from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SUITE_PATH = ROOT / "workflows" / "nexusops-agentic-e2e-test-suite.json"
AGENT_PATH = ROOT / "workflows" / "nexusops-agentic-workflow.json"


def _workflow(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _node(workflow, name):
    matches = [node for node in workflow["nodes"] if node["name"] == name]
    assert len(matches) == 1, f"Expected exactly one node named {name!r}"
    return matches[0]


def test_agent_e2e_suite_is_importable_and_graph_is_well_connected():
    workflow = _workflow(SUITE_PATH)
    names = [node["name"] for node in workflow["nodes"]]

    assert workflow["name"] == "NexusOps Agentic E2E Acceptance Suite"
    assert workflow["active"] is False
    assert len(names) == len(set(names))
    assert names[0] == "Manual Trigger"
    assert names[-1] == "Evaluate Agent E2E Results"

    known = set(names)
    for source, outputs in workflow["connections"].items():
        assert source in known
        for channel_outputs in outputs.values():
            for branch in channel_outputs:
                for connection in branch:
                    assert connection["node"] in known


def test_suite_calls_the_real_chat_trigger_and_not_the_mcp_test_endpoint():
    suite = _workflow(SUITE_PATH)
    agent = _workflow(AGENT_PATH)
    trigger = _node(agent, "When chat message received")
    request = _node(suite, "Invoke Production Chat Trigger")

    assert trigger["parameters"]["public"] is True
    expected_url = (
        "http://127.0.0.1:5678/webhook/"
        + trigger["webhookId"]
        + "/chat"
    )
    assert request["parameters"]["url"] == expected_url
    assert request["parameters"]["method"] == "POST"
    assert request["parameters"]["jsonBody"] == "={{ $json.requestBody }}"
    assert request["parameters"]["options"]["timeout"] >= 120000
    assert request["parameters"]["options"]["response"]["response"]["fullResponse"] is True
    assert request["parameters"]["options"]["response"]["response"]["neverError"] is True


def test_agent_cases_cover_numeric_course_multi_objective_and_domain_paths():
    suite = _workflow(SUITE_PATH)
    build_code = _node(suite, "Build Agent Test Cases")["parameters"]["jsCode"]
    evaluator_code = _node(suite, "Evaluate Agent E2E Results")["parameters"]["jsCode"]

    for token in [
        "A01", "numeric_count", "expectedCount:30",
        "A05", "scalar_aggregate", "expectedAverage:6.93",
        "تعداد فارغ التحصیلان و میانگین مدت اشتغال را محاسبه کن",
        "A02", "course_lookup", "C002", "ساختمان داده",
        "A03", "multi_plan", "شکاف مهارتی",
        "A04", "out_of_scope", "بیت‌کوین",
        'action:"sendMessage"', "sessionId", "chatInput",
    ]:
        assert token in build_code

    # Response-value extraction belongs to the evaluator, not the case builder.
    for token in [
        'test.kind==="scalar_aggregate"',
        "numericTokens",
        "test.expectedCount",
        "test.expectedAverage",
        "hasCount",
        "hasAverage",
        "passed=hasCount&&hasAverage",
    ]:
        assert token in evaluator_code


def test_agent_requests_are_serialized_and_loop_back_before_evaluation():
    suite = _workflow(SUITE_PATH)
    loop = _node(suite, "Loop Over Agent Cases")
    connections = suite["connections"]

    assert loop["parameters"]["batchSize"] == 1
    assert connections["Loop Over Agent Cases"]["main"][1][0]["node"] == (
        "Invoke Production Chat Trigger"
    )
    assert connections["Invoke Production Chat Trigger"]["main"][0][0]["node"] == (
        "Loop Over Agent Cases"
    )
    assert connections["Loop Over Agent Cases"]["main"][0][0]["node"] == (
        "Evaluate Agent E2E Results"
    )


def test_agent_evaluator_checks_real_response_content_and_reports_scope_limits():
    suite = _workflow(SUITE_PATH)
    code = _node(suite, "Evaluate Agent E2E Results")["parameters"]["jsCode"]

    for token in [
        "function normalizeDigits", "function responseText",
        "expectedCount", "expectedCourseName", "partial_failure",
        "Response correlation failed", "items.length===cases.length", 'overall:failed===0',
        "does not inject MCP faults or claim concurrency coverage",
    ]:
        assert token in code
