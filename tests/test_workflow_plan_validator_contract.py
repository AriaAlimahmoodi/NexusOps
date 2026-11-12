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

def test_compose_final_interprets_grouped_graduate_averages_independent_of_metric_aliases():
    workflow = json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))
    composer = next(node for node in workflow["nodes"] if node["name"] == "Compose Final")
    code = composer["parameters"]["jsCode"]

    assert 'q.dataset_id==="university_graduates"' in code
    assert 'm.field==="career_relevance"&&m.function==="avg"' in code
    assert 'm.field==="employment_months"&&m.function==="avg"' in code
    assert 'getMetric(row,employmentMetric??{})' in code
    assert 'getMetric(row,relevanceMetric??{})' in code
    assert 'row.record_count??row.document_count??row.doc_count' in code
    assert "همبستگی میان مدت اشتغال و ارتباط شغلی" in code
    assert "individual-level correlation" in code

