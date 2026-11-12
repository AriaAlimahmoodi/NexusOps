from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
WORKFLOW_PATH = PROJECT_ROOT / "workflows" / "nexusops-agentic-workflow.json"


def test_agent_workflow_accepts_empty_root_filters_but_rejects_empty_nested_groups():
    workflow = json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))
    validator = next(node for node in workflow["nodes"] if node["name"] == "Validate Plan")
    code = validator["parameters"]["jsCode"]

    assert 'if(!cs.length&&!gs.length){if(depth>0)errs.push(path+" خالی است.");else return null;}' in code


def test_agent_workflow_planner_prompt_forbids_synthesizing_empty_filter_groups():
    workflow = json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))
    planner = next(node for node in workflow["nodes"] if node["name"] == "Query Planner")
    prompt = planner["parameters"]["text"]

    assert "اگر هیچ شرطی در درخواست وجود ندارد، filters را حذف کن یا null بده" in prompt
    assert "گروه خالی تو‌در‌تو نامعتبر است" in prompt
