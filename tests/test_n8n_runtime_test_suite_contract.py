from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RUNTIME_WORKFLOW_PATH = ROOT / "workflows" / "nexusops-mcp-runtime-test-suite.json"


def test_runtime_test_suite_is_importable_and_well_connected():
    workflow = json.loads(RUNTIME_WORKFLOW_PATH.read_text(encoding="utf-8"))
    nodes = workflow["nodes"]
    names = [node["name"] for node in nodes]

    assert workflow["name"] == "NexusOps MCP Runtime Test Suite"
    assert workflow["active"] is False
    assert len(nodes) == 8
    assert len(names) == len(set(names))
    assert names[0] == "Manual Trigger"
    assert names[-1] == "Evaluate Runtime Results"

    known = set(names)
    for source, outputs in workflow["connections"].items():
        assert source in known
        for channel_outputs in outputs.values():
            for branch in channel_outputs:
                for connection in branch:
                    assert connection["node"] in known

    assert "Manual Trigger" in workflow["connections"]
    assert "Evaluate Runtime Results" not in workflow["connections"]


def test_runtime_test_suite_covers_protocol_analytics_and_error_contracts():
    workflow = json.loads(RUNTIME_WORKFLOW_PATH.read_text(encoding="utf-8"))
    by_name = {node["name"]: node for node in workflow["nodes"]}

    initialize = by_name["MCP Initialize"]["parameters"]
    assert initialize["method"] == "POST"
    assert initialize["url"].endswith("/mcp")
    assert json.loads(initialize["jsonBody"])["method"] == "initialize"

    cases_code = by_name["Build Runtime Test Cases"]["parameters"]["jsCode"]
    expected_cases = [
        "MCP tools/list",
        "Course lookup C002",
        "Graduate count",
        "Skill mapping aggregate",
        "Nested filter count",
        "Invalid dataset error envelope",
    ]
    for case in expected_cases:
        assert case in cases_code

    assert 'method:"tools/list"' in cases_code
    assert 'method:"tools/call"' in cases_code
    assert 'operation:"aggregate"' in cases_code
    assert 'groups:[{logic:"or"' in cases_code

    evaluator = by_name["Evaluate Runtime Results"]["parameters"]["jsCode"]
    for assertion in [
        'test.kind==="tools_list"',
        'test.kind==="count"',
        'test.kind==="select"',
        'test.kind==="aggregate"',
        'test.kind==="expected_error"',
        'status:passed?"PASS":"FAIL"',
        'overall:failed===0?"PASS":"FAIL"',
    ]:
        assert assertion in evaluator

    calls = by_name["MCP Runtime Calls"]
    assert calls["onError"] == "continueRegularOutput"
    assert calls["retryOnFail"] is True
    assert calls["maxTries"] == 2


def test_runtime_evaluator_normalizes_nested_mcp_payloads_and_correlates_ids():
    workflow = json.loads(RUNTIME_WORKFLOW_PATH.read_text(encoding="utf-8"))
    evaluator = next(
        node for node in workflow["nodes"]
        if node["name"] == "Evaluate Runtime Results"
    )["parameters"]["jsCode"]

    assert "function normalizePayload(value)" in evaluator
    assert "result.structuredContent" in evaluator
    assert 'typeof current.result==="string"' in evaluator
    assert "const byId=new Map()" in evaluator
    assert "duplicates.has(id)" in evaluator
    assert "pairedIndex" in evaluator
