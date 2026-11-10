from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW_PATH = ROOT / "workflows" / "nexusops-agentic-workflow.json"


def _workflow():
    return json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))


def _node(workflow, name):
    matches = [node for node in workflow["nodes"] if node["name"] == name]
    assert len(matches) == 1, f"Expected exactly one node named {name!r}"
    return matches[0]


def _header_names(node):
    return {
        str(item.get("name", "")).lower()
        for item in node["parameters"]["headerParameters"]["parameters"]
    }


def test_mcp_initialize_sends_required_http_headers():
    workflow = _workflow()
    node = _node(workflow, "MCP Initialize")
    parameters = node["parameters"]

    assert parameters["method"] == "POST"
    assert parameters["url"].endswith("/mcp")
    assert parameters["sendHeaders"] is True
    assert _header_names(node) >= {"content-type", "accept"}
    assert all(
        item.get("name") and item.get("value")
        for item in parameters["headerParameters"]["parameters"]
    )

    request = json.loads(parameters["jsonBody"])
    assert request["jsonrpc"] == "2.0"
    assert request["method"] == "initialize"
    assert request["params"]["protocolVersion"]


def test_mcp_session_headers_are_propagated_through_initialized_and_tool_calls():
    workflow = _workflow()

    parse_init = _node(workflow, "MCP Parse Init")["parameters"]["jsCode"]
    notify = _node(workflow, "MCP Initialized Notify")
    call_tool = _node(workflow, "MCP Call Tool")

    # The session identifier is returned as an HTTP response header.
    # The negotiated protocol version is returned in the initialize result
    # body and must be propagated to subsequent MCP requests.
    assert 'getHeader("mcp-session-id")' in parse_init
    assert "message.result.protocolVersion" in parse_init
    assert 'reqHeaders["MCP-Protocol-Version"] = message.result.protocolVersion' in parse_init
    assert _header_names(notify) >= {
        "content-type", "accept", "mcp-session-id", "mcp-protocol-version"
    }
    assert _header_names(call_tool) >= {
        "content-type", "accept", "mcp-session-id", "mcp-protocol-version"
    }

    notify_body = json.loads(notify["parameters"]["jsonBody"])
    assert notify_body["method"] == "notifications/initialized"
    assert "id" not in notify_body


def test_initialized_notification_is_a_gate_before_tool_execution():
    workflow = _workflow()
    connections = workflow["connections"]

    assert connections["MCP Initialized Notify"]["main"][0][0]["node"] == (
        "Validate Initialized Notification"
    )
    assert connections["Validate Initialized Notification"]["main"][0][0]["node"] == (
        "Initialized Notification OK?"
    )
    branches = connections["Initialized Notification OK?"]["main"]
    assert branches[0][0]["node"] == "Build Tool Call"
    assert branches[1][0]["node"] == "Error Reply"


def test_workflow_connections_reference_existing_nodes():
    workflow = _workflow()
    names = {node["name"] for node in workflow["nodes"]}

    for source, outputs in workflow["connections"].items():
        assert source in names, f"Unknown connection source: {source}"
        for channel_outputs in outputs.values():
            for branch in channel_outputs:
                for connection in branch:
                    assert connection["node"] in names, (
                        f"Unknown connection target: {connection['node']}"
                    )


def test_mcp_result_parser_enforces_one_outcome_per_requested_plan():
    workflow = _workflow()
    code = _node(workflow, "MCP Parse Result")["parameters"]["jsCode"]

    assert 'const requests = $("Build Tool Call").all()' in code
    assert "return requests.map((request, index)" in code
    assert "Multiple MCP responses matched the same JSON-RPC request ID." in code
    assert "MCP response missing for this plan." in code


def test_mcp_result_parser_never_guesses_multi_plan_correlation_without_rpc_ids():
    workflow = _workflow()
    code = _node(workflow, "MCP Parse Result")["parameters"]["jsCode"]

    assert "requests.length === 1" in code
    assert "multi-plan correlation is ambiguous" in code
    assert "unexpected JSON-RPC IDs were received" in code
    assert 'responseBuckets.get(key) ?? []' in code


def test_multi_plan_correlation_and_completeness_reach_answer_context():
    workflow = _workflow()
    format_code = _node(workflow, "Format Result")["parameters"]["jsCode"]
    context_code = _node(workflow, "Prepare LLM Context")["parameters"]["jsCode"]
    compose_code = _node(workflow, "Compose Final")["parameters"]["jsCode"]

    assert 'correlationStatus: response.correlationStatus ?? "unknown"' in format_code
    assert "expected_plans: expectedPlanCount" in context_code
    assert "plan_set_complete: planSetComplete" in context_code
    assert "correlation_failures: correlationFailures" in context_code
    assert 'overall_execution_status: overallExecutionStatus' in context_code
    assert '"partial_failure"' in context_code
    assert "planSetComplete" in compose_code
    assert "وضعیت اجرای چندبرنامه‌ای" in compose_code


def test_mcp_tool_call_preserves_per_plan_transport_failures_for_partial_results():
    workflow = _workflow()
    call_tool = _node(workflow, "MCP Call Tool")
    parser = _node(workflow, "MCP Parse Result")["parameters"]["jsCode"]

    assert call_tool["onError"] == "continueRegularOutput"
    assert call_tool["retryOnFail"] is True
    assert call_tool["maxTries"] == 2
    assert call_tool["waitBetweenTries"] == 1000
    assert "const responseItems = $input.all()" in parser
    assert "responseItems[index]?.pairedItem" in parser
    assert "statusCode: 599" in parser
    assert "paired-item lineage" in parser
