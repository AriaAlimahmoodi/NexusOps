from __future__ import annotations

import asyncio
import importlib
import json
import os
import threading
import uuid
from types import SimpleNamespace

import httpx
import pytest

import llm_mcp_client as client_runtime


def test_conversation_state_and_verified_memory_are_isolated():
    conversation_a = f"runtime-a-{uuid.uuid4().hex}"
    conversation_b = f"runtime-b-{uuid.uuid4().hex}"

    state_a = client_runtime.get_conversation_state(conversation_a)
    state_b = client_runtime.get_conversation_state(conversation_b)

    state_a.history.append([{"role": "user", "content": "private turn"}])
    state_a.memory_manager.store_tool_result(
        tool_name="analytics_query",
        arguments={"dataset_id": "university_graduates", "operation": "count"},
        data={"status": "success", "count": 7},
    )

    assert state_a is client_runtime.get_conversation_state(conversation_a)
    assert state_a is not state_b
    assert state_b.history == []
    assert state_b.memory_manager.get_verified_tool_results() == []


def test_conversation_id_validation_rejects_empty_and_oversized_values():
    with pytest.raises(ValueError):
        client_runtime.get_conversation_state(" ")

    with pytest.raises(ValueError):
        client_runtime.get_conversation_state("x" * 129)


def test_mcp_transport_failure_retries_with_a_fresh_attempt(monkeypatch):
    attempts = []

    async def fake_attempt(plan, *, request_id, attempt):
        attempts.append((request_id, attempt))
        if len(attempts) == 1:
            raise httpx.ConnectError("temporary connection failure")
        return True, {"status": "success"}, "validated"

    monkeypatch.setattr(client_runtime, "_run_mcp_attempt", fake_attempt)
    monkeypatch.setattr(client_runtime, "MCP_RETRY_BASE_DELAY_SECONDS", 0)

    result = asyncio.run(
        client_runtime.execute_mcp_query_with_resilience(
            SimpleNamespace(tool_name="analytics_query"),
            request_id="trace-123",
        )
    )

    assert result == (True, {"status": "success"}, "validated")
    assert attempts == [("trace-123", 1), ("trace-123", 2)]


def test_application_level_mcp_failure_is_not_retried(monkeypatch):
    attempts = []

    async def fake_attempt(plan, *, request_id, attempt):
        attempts.append(attempt)
        return False, None, "INVALID_FIELD"

    monkeypatch.setattr(client_runtime, "_run_mcp_attempt", fake_attempt)

    result = asyncio.run(
        client_runtime.execute_mcp_query_with_resilience(
            SimpleNamespace(tool_name="analytics_query"),
            request_id="trace-456",
        )
    )

    assert result == (False, None, "INVALID_FIELD")
    assert attempts == [1]


def _load_server(monkeypatch):
    monkeypatch.setenv("ELASTICSEARCH_PASSWORD", "test-only-not-used")
    return importlib.import_module("server")


def test_mcp_sync_tool_is_offloaded_from_the_event_loop(monkeypatch):
    server = _load_server(monkeypatch)
    event_loop_thread = threading.get_ident()
    worker_threads = []

    def fake_search(query):
        worker_threads.append(threading.get_ident())
        return json.dumps({"query": query})

    monkeypatch.setattr(server, "search_elasticsearch", fake_search)

    result = asyncio.run(server.search_tool("sample"))

    assert json.loads(result) == {"query": "sample"}
    assert len(worker_threads) == 1
    assert worker_threads[0] != event_loop_thread


def test_analytics_failure_uses_the_canonical_response_envelope(monkeypatch):
    server = _load_server(monkeypatch)

    def fail(_arguments):
        raise server.AnalyticsServiceError(
            "Unknown dataset",
            code="UNKNOWN_DATASET",
            details={"dataset_id": "missing"},
        )

    monkeypatch.setattr(server, "run_analytics_query", fail)

    raw = asyncio.run(
        server.analytics_query_tool(
            dataset_id="missing",
            operation="count",
        )
    )
    response = json.loads(raw)

    assert response["status"] == "error"
    assert response["dataset_id"] == "missing"
    assert response["operation"] == "count"
    assert response["result"] is None
    assert response["metadata"]["request_id"]
    assert response["metadata"]["execution_time_ms"] >= 0
    assert response["warnings"] == []
    assert response["error"] == {
        "code": "UNKNOWN_DATASET",
        "message": "Unknown dataset",
        "details": {"dataset_id": "missing"},
    }


def test_analytics_success_runs_off_loop_and_attaches_trace_id(monkeypatch):
    server = _load_server(monkeypatch)
    event_loop_thread = threading.get_ident()
    worker_threads = []

    def fake_run(_arguments):
        worker_threads.append(threading.get_ident())
        return {
            "status": "success",
            "dataset_id": "university_graduates",
            "operation": "count",
            "result": {"count": 12},
            "metadata": {"execution_time_ms": 2.0},
            "warnings": [],
            "error": None,
        }

    monkeypatch.setattr(server, "run_analytics_query", fake_run)

    response = json.loads(asyncio.run(
        server.analytics_query_tool(
            dataset_id="university_graduates",
            operation="count",
        )
    ))

    assert response["status"] == "success"
    assert response["result"]["count"] == 12
    assert response["metadata"]["request_id"]
    assert worker_threads[0] != event_loop_thread


def test_mcp_retry_budget_is_bounded(monkeypatch):
    attempts = []

    async def always_fails(plan, *, request_id, attempt):
        attempts.append(attempt)
        raise httpx.ConnectError("service unavailable")

    monkeypatch.setattr(client_runtime, "_run_mcp_attempt", always_fails)
    monkeypatch.setattr(client_runtime, "MCP_MAX_ATTEMPTS", 2)
    monkeypatch.setattr(client_runtime, "MCP_RETRY_BASE_DELAY_SECONDS", 0)

    result = asyncio.run(
        client_runtime.execute_mcp_query_with_resilience(
            SimpleNamespace(tool_name="analytics_query"),
            request_id="trace-exhausted",
        )
    )

    assert result[0] is False
    assert result[1] is None
    assert "could not be reached" in result[2]
    assert attempts == [1, 2]


def test_json_runtime_logs_include_correlation_fields_without_payload():
    import logging

    from runtime_logging import JsonLogFormatter

    record = logging.makeLogRecord({
        "name": "nexusops.test",
        "levelno": logging.INFO,
        "levelname": "INFO",
        "msg": "MCP tool completed",
        "args": (),
        "request_id": "trace-json",
        "tool_name": "analytics_query",
        "duration_ms": 12.5,
    })

    payload = json.loads(JsonLogFormatter().format(record))

    assert payload["request_id"] == "trace-json"
    assert payload["tool_name"] == "analytics_query"
    assert payload["duration_ms"] == 12.5
    assert payload["event"] == "MCP tool completed"
    assert "arguments" not in payload
    assert "result" not in payload


def test_analytics_tool_error_payload_is_normalized_to_full_contract(monkeypatch):
    server = _load_server(monkeypatch)
    monkeypatch.setattr(
        server,
        "run_analytics_query",
        lambda _arguments: {
            "status": "error",
            "error": {
                "code": "INVALID_ANALYTICS_REQUEST",
                "message": "The request is invalid.",
                "stage": "request_validation",
                "exception_type": "ValueError",
            },
        },
    )

    response = json.loads(asyncio.run(
        server.analytics_query_tool(
            dataset_id="university_courses",
            operation="count",
        )
    ))

    assert response["status"] == "error"
    assert response["dataset_id"] == "university_courses"
    assert response["operation"] == "count"
    assert response["result"] is None
    assert response["metadata"]["request_id"]
    assert response["error"]["code"] == "INVALID_ANALYTICS_REQUEST"
    assert response["error"]["details"] == {
        "stage": "request_validation",
        "exception_type": "ValueError",
    }


def test_analytics_tool_closes_client_when_service_fails(monkeypatch):
    import tools.analytics_tool as analytics_tool

    class FakeClient:
        closed = False

        def close(self):
            self.closed = True

    fake_client = FakeClient()

    class FakeAdapter:
        def __init__(self, client):
            assert client is fake_client

    class FailingService:
        def __init__(self, adapter):
            self.adapter = adapter

        def analyze(self, request):
            raise RuntimeError("simulated adapter failure")

    monkeypatch.setattr(analytics_tool, "get_elasticsearch_client", lambda: fake_client)
    monkeypatch.setattr(analytics_tool, "ElasticsearchAdapter", FakeAdapter)
    monkeypatch.setattr(analytics_tool, "AnalyticsService", FailingService)

    result = analytics_tool.run_analytics_query({
        "dataset_id": "university_graduates",
        "operation": "count",
    })

    assert result["status"] == "error"
    assert result["error"]["code"] == "ANALYTICS_EXECUTION_FAILED"
    assert fake_client.closed is True


def test_market_skill_tool_closes_client_when_search_fails(monkeypatch):
    import tools.market_skills as market_skills

    class FakeClient:
        closed = False

        def search(self, **_kwargs):
            raise RuntimeError("simulated Elasticsearch failure")

        def close(self):
            self.closed = True

    fake_client = FakeClient()
    monkeypatch.setattr(market_skills, "get_elasticsearch_client", lambda: fake_client)

    with pytest.raises(RuntimeError, match="simulated Elasticsearch failure"):
        market_skills.get_market_skill_details(["DevOps"])

    assert fake_client.closed is True
