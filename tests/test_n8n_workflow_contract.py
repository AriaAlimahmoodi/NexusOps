from __future__ import annotations

import json
from pathlib import Path


WORKFLOW_PATH = (
    Path(__file__).resolve().parents[1]
    / "workflows"
    / "nexusops-agentic-workflow.json"
)


def _workflow():
    return json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))


def test_workflow_has_unique_node_names_and_ids():
    workflow = _workflow()
    names = [node["name"] for node in workflow["nodes"]]
    ids = [node["id"] for node in workflow["nodes"]]

    assert len(names) == len(set(names))
    assert len(ids) == len(set(ids))


def test_workflow_connections_reference_existing_nodes():
    workflow = _workflow()
    names = {node["name"] for node in workflow["nodes"]}

    for source, outputs in workflow["connections"].items():
        assert source in names
        for output_groups in outputs.values():
            for group in output_groups:
                for edge in group:
                    assert edge["node"] in names


def test_mcp_initialized_notification_is_checked_before_tool_calls():
    workflow = _workflow()
    nodes = {node["name"]: node for node in workflow["nodes"]}
    connections = workflow["connections"]

    assert "Validate Initialized Notification" in nodes
    assert "Initialized Notification OK?" in nodes

    validation_code = nodes["Validate Initialized Notification"]["parameters"]["jsCode"]
    assert "response.statusCode" in validation_code
    assert "statusCode >= 200" in validation_code
    assert "statusCode < 300" in validation_code

    notify_target = connections["MCP Initialized Notify"]["main"][0][0]["node"]
    assert notify_target == "Validate Initialized Notification"

    branch_target = connections["Validate Initialized Notification"]["main"][0][0]["node"]
    assert branch_target == "Initialized Notification OK?"

    branches = connections["Initialized Notification OK?"]["main"]
    assert branches[0][0]["node"] == "Build Tool Call"
    assert branches[1][0]["node"] == "Error Reply"


def test_mcp_tool_execution_is_downstream_of_successful_initialization():
    workflow = _workflow()
    connections = workflow["connections"]

    assert connections["MCP Parse Init"]["main"][0][0]["node"] == "Init OK?"
    assert connections["Init OK?"]["main"][0][0]["node"] == "MCP Initialized Notify"
    assert connections["Initialized Notification OK?"]["main"][0][0]["node"] == "Build Tool Call"
    assert connections["Build Tool Call"]["main"][0][0]["node"] == "MCP Call Tool"


def test_workflow_routes_domain_analytics_through_the_new_mcp_tool():
    workflow = _workflow()
    nodes = {node["name"]: node for node in workflow["nodes"]}
    gate = nodes["Domain Gate"]["parameters"]["jsCode"]
    planner = nodes["Query Planner"]["parameters"]["text"]
    validator = nodes["Validate Plan"]["parameters"]["jsCode"]
    builder = nodes["Build Tool Call"]["parameters"]["jsCode"]
    formatter = nodes["Format Result"]["parameters"]["jsCode"]

    assert "روند" in gate and "برنامه درسی" in gate
    assert "analyze_university_market" in planner
    assert "management_report" in planner
    assert 'tool:"analyze_university_market"' in validator
    assert 'tool==="analyze_university_market"' in validator
    assert '"analyze_university_market"' in builder
    assert "sections: data.sections" in formatter
    assert "recommendations: data.recommendations" in formatter
    assert "limitations: data.limitations" in formatter
