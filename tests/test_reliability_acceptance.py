from __future__ import annotations

import asyncio
import importlib
import json
import threading
import time
import uuid
from types import SimpleNamespace

import httpx
import pytest

import llm_mcp_client as client_runtime
from tools.analytics_engine.result_formatter import ResultFormatter, ResultFormattingError


def test_retry_uses_fresh_attempt_numbers_and_exponential_backoff(monkeypatch):
    attempts, delays = [], []

    async def injected_attempt(plan, *, request_id, attempt):
        attempts.append((request_id, attempt))
        if attempt < 3:
            raise httpx.ConnectError("injected transient transport failure")
        return True, {"status": "success", "result": {"count": 30}}, "validated"

    async def injected_sleep(delay):
        delays.append(delay)

    monkeypatch.setattr(client_runtime, "_run_mcp_attempt", injected_attempt)
    monkeypatch.setattr(client_runtime, "MCP_MAX_ATTEMPTS", 3)
    monkeypatch.setattr(client_runtime, "MCP_RETRY_BASE_DELAY_SECONDS", 0.25)
    monkeypatch.setattr(client_runtime.asyncio, "sleep", injected_sleep)

    result = asyncio.run(client_runtime.execute_mcp_query_with_resilience(
        SimpleNamespace(tool_name="analytics_query"),
        request_id="fault-injection-retry",
    ))

    assert result[0] is True
    assert result[1]["result"]["count"] == 30
    assert attempts == [
        ("fault-injection-retry", 1),
        ("fault-injection-retry", 2),
        ("fault-injection-retry", 3),
    ]
    assert delays == [0.25, 0.5]


def test_retry_cancellation_propagates_without_another_attempt(monkeypatch):
    attempts = []

    async def blocked_attempt(plan, *, request_id, attempt):
        attempts.append(attempt)
        await asyncio.Event().wait()

    monkeypatch.setattr(client_runtime, "_run_mcp_attempt", blocked_attempt)
    monkeypatch.setattr(client_runtime, "MCP_MAX_ATTEMPTS", 4)

    async def scenario():
        task = asyncio.create_task(client_runtime.execute_mcp_query_with_resilience(
            SimpleNamespace(tool_name="analytics_query"),
            request_id="fault-injection-cancel",
        ))
        while not attempts:
            await asyncio.sleep(0)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

    asyncio.run(scenario())
    assert attempts == [1]


def test_timeout_fault_exhausts_the_bounded_retry_budget(monkeypatch):
    attempts = []

    async def injected_timeout(plan, *, request_id, attempt):
        attempts.append(attempt)
        raise TimeoutError("injected MCP timeout")

    monkeypatch.setattr(client_runtime, "_run_mcp_attempt", injected_timeout)
    monkeypatch.setattr(client_runtime, "MCP_MAX_ATTEMPTS", 2)
    monkeypatch.setattr(client_runtime, "MCP_RETRY_BASE_DELAY_SECONDS", 0)

    result = asyncio.run(client_runtime.execute_mcp_query_with_resilience(
        SimpleNamespace(tool_name="analytics_query"),
        request_id="fault-injection-timeout",
    ))

    assert result[0] is False
    assert result[1] is None
    assert "could not be reached" in result[2]
    assert attempts == [1, 2]


def test_mcp_protocol_error_is_not_retried_or_treated_as_empty_data(monkeypatch):
    calls = []

    async def injected_call_tool(tool_name, arguments):
        calls.append((tool_name, arguments))
        return SimpleNamespace(
            isError=True,
            structuredContent=None,
            content=[SimpleNamespace(text="injected protocol failure")],
        )

    class FakeSession:
        async def call_tool(self, tool_name, arguments):
            return await injected_call_tool(tool_name, arguments)

    monkeypatch.setattr(client_runtime, "validate_tool_arguments",
                        lambda **_: (True, {}, "arguments valid"))

    result = asyncio.run(client_runtime.execute_planned_mcp_query(
        FakeSession(),
        SimpleNamespace(tool_name="analytics_query", arguments={}),
        request_id="fault-injection-protocol",
    ))

    assert result[0] is False
    assert "injected protocol failure" in result[2].lower()
    assert len(calls) == 1


def test_malformed_mcp_result_fails_closed(monkeypatch):
    async def injected_call_tool(tool_name, arguments):
        return SimpleNamespace(
            isError=False,
            structuredContent={"unexpected": "shape"},
            content=[],
        )

    class FakeSession:
        async def call_tool(self, tool_name, arguments):
            return await injected_call_tool(tool_name, arguments)

    monkeypatch.setattr(client_runtime, "validate_tool_arguments",
                        lambda **_: (True, {}, "arguments valid"))
    monkeypatch.setattr(client_runtime, "validate_mcp_result",
                        lambda **_: (False, "injected result contract mismatch"))

    result = asyncio.run(client_runtime.execute_planned_mcp_query(
        FakeSession(),
        SimpleNamespace(tool_name="analytics_query", arguments={}),
        request_id="fault-injection-schema",
    ))

    assert result == (False, None, "injected result contract mismatch")


def test_same_conversation_requests_are_serialized_and_keep_turn_order(monkeypatch):
    conversation_id = f"reliability-same-{uuid.uuid4().hex}"
    active = 0
    maximum_active = 0
    entered = []

    async def fake_request(question, state, request_id):
        nonlocal active, maximum_active
        active += 1
        maximum_active = max(maximum_active, active)
        entered.append(question)
        await asyncio.sleep(0.01)
        state.history.append([{"role": "user", "content": question}])
        active -= 1
        return question

    monkeypatch.setattr(client_runtime, "_ask_nexusops_for_state", fake_request)

    async def scenario():
        return await asyncio.gather(
            client_runtime.ask_nexusops("turn one", conversation_id),
            client_runtime.ask_nexusops("turn two", conversation_id),
        )

    answers = asyncio.run(scenario())
    state = client_runtime.get_conversation_state(conversation_id)

    assert answers == ["turn one", "turn two"]
    assert maximum_active == 1
    assert entered == ["turn one", "turn two"]
    assert [turn[0]["content"] for turn in state.history] == ["turn one", "turn two"]


def test_different_conversations_execute_concurrently_without_state_leakage(monkeypatch):
    conversation_a = f"reliability-a-{uuid.uuid4().hex}"
    conversation_b = f"reliability-b-{uuid.uuid4().hex}"
    entered = []
    both_entered = None

    async def fake_request(question, state, request_id):
        entered.append(question)
        if len(entered) == 2:
            both_entered.set()
        await asyncio.wait_for(both_entered.wait(), timeout=2)
        state.summary = question
        state.history.append([{"role": "user", "content": question}])
        return question

    monkeypatch.setattr(client_runtime, "_ask_nexusops_for_state", fake_request)

    async def scenario():
        nonlocal both_entered
        both_entered = asyncio.Event()
        return await asyncio.gather(
            client_runtime.ask_nexusops("conversation alpha", conversation_a),
            client_runtime.ask_nexusops("conversation beta", conversation_b),
        )

    answers = asyncio.run(scenario())
    state_a = client_runtime.get_conversation_state(conversation_a)
    state_b = client_runtime.get_conversation_state(conversation_b)

    assert set(answers) == {"conversation alpha", "conversation beta"}
    assert set(entered) == {"conversation alpha", "conversation beta"}
    assert state_a is not state_b
    assert state_a.summary == "conversation alpha"
    assert state_b.summary == "conversation beta"
    assert state_a.history[0][0]["content"] == "conversation alpha"
    assert state_b.history[0][0]["content"] == "conversation beta"


def test_mcp_blocking_tool_concurrency_respects_shared_semaphore(monkeypatch):
    monkeypatch.setenv("ELASTICSEARCH_PASSWORD", "test-only-not-used")
    server = importlib.import_module("server")
    monkeypatch.setattr(server, "_SYNC_TOOL_SEMAPHORE", asyncio.Semaphore(2))

    active = 0
    maximum_active = 0
    guard = threading.Lock()

    def blocking_operation(value):
        nonlocal active, maximum_active
        with guard:
            active += 1
            maximum_active = max(maximum_active, active)
        time.sleep(0.025)
        with guard:
            active -= 1
        return value

    async def scenario():
        return await asyncio.gather(*(
            server.run_sync_function("concurrency-acceptance", blocking_operation, index)
            for index in range(8)
        ))

    results = asyncio.run(scenario())
    assert results == list(range(8))
    assert 1 < maximum_active <= 2


def test_count_numeric_contract_preserves_exact_integer_and_rejects_invalid_values():
    valid = ResultFormatter.format_success(
        "university_graduates", "count",
        {"operation": "count", "count": 30, "execution_time_ms": 1.0, "warnings": []},
    )
    assert valid["result"]["count"] == 30
    assert type(valid["result"]["count"]) is int

    for invalid in (True, 30.0, -1):
        with pytest.raises(ResultFormattingError):
            ResultFormatter.format_success(
                "university_graduates", "count",
                {"operation": "count", "count": invalid, "execution_time_ms": 1.0, "warnings": []},
            )


def test_select_numeric_totals_cannot_contradict_returned_records():
    with pytest.raises(ResultFormattingError, match="cannot be less than returned_records"):
        ResultFormatter.format_success(
            "university_courses", "select",
            {
                "operation": "select",
                "records": [{"course_id": "C001"}, {"course_id": "C002"}],
                "returned_records": 2,
                "total_records": 1,
                "execution_time_ms": 1.0,
                "warnings": [],
            },
        )


def test_aggregate_metrics_must_be_finite_numeric_values():
    for invalid in (float("nan"), float("inf"), True, "4.5"):
        with pytest.raises(ResultFormattingError, match="finite numeric"):
            ResultFormatter.format_success(
                "skill_mapping", "aggregate",
                {
                    "operation": "aggregate",
                    "buckets": [{
                        "key": {"skill": "DevOps"},
                        "doc_count": 3,
                        "metrics": {"average_market_gap": invalid},
                    }],
                    "total_records": 30,
                    "execution_time_ms": 1.0,
                    "warnings": [],
                },
            )


def test_structured_logs_never_emit_raw_conversation_identifiers():
    import logging
    from runtime_logging import JsonLogFormatter

    record = logging.makeLogRecord({
        "name": "nexusops.reliability",
        "levelno": logging.INFO,
        "levelname": "INFO",
        "msg": "request completed",
        "args": (),
        "conversation_id": "private-session-token",
        "conversation_ref": "a1b2c3d4e5f60718",
        "request_id": "trace-safe",
    })
    output = JsonLogFormatter().format(record)
    payload = json.loads(output)

    assert "private-session-token" not in output
    assert "conversation_id" not in payload
    assert payload["conversation_ref"] == "a1b2c3d4e5f60718"
    assert payload["request_id"] == "trace-safe"


def test_live_concurrency_evaluator_checks_each_session_result_independently():
    from scripts.live_concurrency_acceptance import build_cases, evaluate_response

    cases = build_cases("run-token")
    assert [case["test_id"] for case in cases] == ["C01", "C02", "C03"]

    results = [
        evaluate_response(cases[0], 200, "30"),
        evaluate_response(cases[1], 200, "C002 — ساختمان داده"),
        evaluate_response(
            cases[2],
            200,
            "پنج مهارت با بیشترین شکاف مهارتی بازار:\n"
            "1. مهارت الف: 4.5\n"
            "2. مهارت ب: 4.2\n"
            "3. مهارت پ: 3.9\n"
            "4. مهارت ت: 3.7\n"
            "5. مهارت ث: 3.4",
        ),
    ]
    assert [result["status"] for result in results] == ["PASS", "PASS", "PASS"]
    assert all(result["session_ref"] for result in results)
    assert evaluate_response(cases[0], 200, "130")["status"] == "FAIL"
