from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pytest


WORKFLOW_PATH = (
    Path(__file__).resolve().parents[1]
    / "workflows"
    / "nexusops-agentic-workflow.json"
)
NODE = shutil.which("node")


def _workflow():
    return json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))


def _run_node_code(
    node_name: str,
    input_items: list[dict],
    node_outputs: dict[str, list[dict]] | None = None,
    run_index: int = 0,
):
    if NODE is None:
        pytest.skip("Node.js is required to execute n8n Code node contract tests.")

    workflow = _workflow()
    node = next(item for item in workflow["nodes"] if item["name"] == node_name)
    payload = {
        "code": node["parameters"]["jsCode"],
        "inputItems": input_items,
        "nodeOutputs": node_outputs or {},
        "runIndex": run_index,
    }
    runner = r"""
const fs = require("node:fs");
const payload = JSON.parse(fs.readFileSync(0, "utf8"));
const inputItems = payload.inputItems || [];
const $input = {
  first: () => inputItems[0],
  all: () => inputItems
};
const $ = (name) => {
  const items = payload.nodeOutputs[name] || [];
  return {
    first: () => items[0],
    last: () => items[items.length - 1],
    all: () => items
  };
};
const result = new Function("$input", "$", "$runIndex", payload.code)(
  $input,
  $,
  payload.runIndex ?? 0
);
process.stdout.write(JSON.stringify(result));
"""
    completed = subprocess.run(
        [NODE, "-e", runner],
        input=json.dumps(payload, ensure_ascii=False),
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(completed.stdout)


def _prepare(question: str) -> dict:
    result = _run_node_code(
        "Prepare Input",
        [{"json": {"chatInput": question}}],
    )
    return result[0]["json"]


def _compose(formatted: list[dict], prepared: dict) -> str:
    result = _run_node_code(
        "Compose Final",
        formatted,
        {
            "Format Result": formatted,
            "Prepare Input": [{"json": prepared}],
            "Answer Writer": [],
        },
    )
    return result[0]["json"]["output"]


def test_course_identifier_lookup_bypasses_an_unsupported_llm_plan():
    question = "نام درس با شناسه C002 چیست؟"
    prepared = _prepare(question)
    unsupported_plan = {
        "tool": "unsupported",
        "arguments": {},
        "unsupported_reason": "The local planner could not resolve this request.",
    }
    validated = _run_node_code(
        "Validate Plan",
        [{"json": {"text": json.dumps(unsupported_plan)}}],
        {"Prepare Input": [{"json": prepared}]},
    )[0]["json"]

    assert validated["valid"] is True
    assert validated["plan"]["tool"] == "search_elasticsearch"
    assert validated["plan"]["arguments"]["query"] == "C002"


def test_combined_count_and_skill_gap_ranking_reaches_a_localized_final_table():
    question = (
        "تعداد کل فارغ‌التحصیلان دانشگاه را گزارش کن و به‌صورت مستقل "
        "پنج مهارت با بیشترین شکاف مهارتی بازار را نیز رتبه‌بندی کن."
    )
    prepared = _prepare(question)
    count_arguments = {
        "dataset_id": "university_graduates",
        "operation": "count",
    }
    gaps = {
        "analysis": "top_skill_gaps",
        "ranking_unit": "skill",
        "description": "Each result is a skill ranked by university-market gap.",
        "limit": 5,
        "results": [
            {
                "ranked_skill": "Kubernetes",
                "associated_course_id": "C013",
                "associated_course_name": "رایانش ابری",
                "course_coverage": 1,
                "market_demand": 4.654321,
                "market_gap": 3.65,
            },
            {
                "ranked_skill": "DevOps",
                "associated_course_id": "C013",
                "associated_course_name": "رایانش ابری",
                "course_coverage": 1.5,
                "market_demand": 4.9,
                "market_gap": 3.4,
            },
            {
                "ranked_skill": "Docker",
                "associated_course_id": "C013",
                "associated_course_name": "رایانش ابری",
                "course_coverage": 1.5,
                "market_demand": 4.55,
                "market_gap": 3.05,
            },
            {
                "ranked_skill": "Data Engineering",
                "associated_course_id": "C004",
                "associated_course_name": "پایگاه داده",
                "course_coverage": 2,
                "market_demand": 4.8,
                "market_gap": 2.8,
            },
            {
                "ranked_skill": "Cloud Computing",
                "associated_course_id": "C013",
                "associated_course_name": "رایانش ابری",
                "course_coverage": 2.5,
                "market_demand": 4.8,
                "market_gap": 2.3,
            },
        ],
    }
    build_items = [
        {
            "json": {
                "rpcId": 1,
                "selectedTool": "analytics_query",
                "rpcBody": {"params": {"arguments": count_arguments}},
                "question": question,
                "responseMode": "ranking",
                "planIndex": 0,
                "planCount": 2,
                "planId": "plan_1",
            }
        },
        {
            "json": {
                "rpcId": 2,
                "selectedTool": "get_top_skill_gaps",
                "rpcBody": {"params": {"arguments": {"limit": 5}}},
                "question": question,
                "responseMode": "ranking",
                "planIndex": 1,
                "planCount": 2,
                "planId": "plan_2",
            }
        },
    ]
    responses = [
        {
            "json": {
                "ok": True,
                "data": {
                    "status": "success",
                    "dataset_id": "university_graduates",
                    "operation": "count",
                    "result": {"count": 30},
                    "metadata": {"total_records": 30},
                },
                "selectedTool": "analytics_query",
                "requestArguments": count_arguments,
                "rpcId": 1,
                "planIndex": 0,
                "planCount": 2,
                "planId": "plan_1",
                "question": question,
                "responseMode": "ranking",
            }
        },
        {
            "json": {
                "ok": True,
                "data": {"result": gaps},
                "selectedTool": "get_top_skill_gaps",
                "requestArguments": {"limit": 5},
                "rpcId": 2,
                "planIndex": 1,
                "planCount": 2,
                "planId": "plan_2",
                "question": question,
                "responseMode": "ranking",
            }
        },
    ]

    formatted = _run_node_code(
        "Format Result",
        responses,
        {"Build Tool Call": build_items},
    )
    assert all(item["json"]["recognized"] is True for item in formatted)
    assert all(item["json"]["executionSuccess"] is True for item in formatted)
    assert formatted[1]["json"]["rows"][0]["market_demand"] == 4.654321

    output = _compose(formatted, prepared)
    assert "30" in output
    assert "Kubernetes" in output
    assert "Data Engineering" in output
    assert "Cloud Computing" in output
    assert "4.65" in output
    assert "| رتبه | مهارت |" in output
    assert "ساختار پاسخ شناسایی نشد" not in output
    assert "پاسخ خام ابزار" not in output


def test_course_lookup_result_keeps_the_exact_course_id_and_name():
    question = "نام درس با شناسه C002 چیست؟"
    prepared = _prepare(question)
    build = {
        "json": {
            "rpcId": 1,
            "selectedTool": "search_elasticsearch",
            "rpcBody": {"params": {"arguments": {"query": "C002"}}},
            "question": question,
            "responseMode": "combined",
            "planIndex": 0,
            "planCount": 1,
            "planId": "plan_1",
        }
    }
    response = {
        "json": {
            "ok": True,
            "data": {
                "query": "C002",
                "total_returned": 1,
                "results": [
                    {
                        "index": "university_courses",
                        "id": "C002",
                        "score": 1.0,
                        "data": {
                            "course_id": "C002",
                            "course_name": "ساختمان داده",
                            "course_category": "Core",
                            "credits": 3,
                            "skills": ["Data Structures", "Algorithms"],
                        },
                    }
                ],
            },
            "selectedTool": "search_elasticsearch",
            "requestArguments": {"query": "C002"},
            "rpcId": 1,
            "planIndex": 0,
            "planCount": 1,
            "planId": "plan_1",
            "question": question,
            "responseMode": "combined",
        }
    }
    formatted = _run_node_code(
        "Format Result",
        [response],
        {"Build Tool Call": [build]},
    )
    assert formatted[0]["json"]["recognized"] is True
    output = _compose(formatted, prepared)
    assert "C002" in output
    assert "ساختمان داده" in output
    assert "شواهد درس" in output


def test_numeric_only_count_returns_only_the_scalar():
    prepared = _prepare("فقط عدد: تعداد کل فارغ‌التحصیلان دانشگاه چند نفر است؟")
    assert prepared["numericOnly"] is True
    count_arguments = {
        "dataset_id": "university_graduates",
        "operation": "count",
    }
    build = {
        "json": {
            "rpcId": 1,
            "selectedTool": "analytics_query",
            "rpcBody": {"params": {"arguments": count_arguments}},
            "question": prepared["question"],
            "responseMode": "calculation",
            "planIndex": 0,
            "planCount": 1,
            "planId": "plan_1",
        }
    }
    response = {
        "json": {
            "ok": True,
            "data": {
                "status": "success",
                "dataset_id": "university_graduates",
                "operation": "count",
                "result": {"count": 30},
            },
            "selectedTool": "analytics_query",
            "requestArguments": count_arguments,
            "rpcId": 1,
            "planIndex": 0,
            "planCount": 1,
            "question": prepared["question"],
            "responseMode": "calculation",
        }
    }
    formatted = _run_node_code(
        "Format Result",
        [response],
        {"Build Tool Call": [build]},
    )
    assert _compose(formatted, prepared) == "30"


def test_english_course_lookup_preserves_request_language():
    question = "What is the name of course C002?"
    prepared = _prepare(question)
    assert prepared["language"] == "en"
    build = {
        "json": {
            "rpcId": 1,
            "selectedTool": "search_elasticsearch",
            "rpcBody": {"params": {"arguments": {"query": "C002"}}},
            "question": question,
            "responseMode": "combined",
            "planIndex": 0,
            "planCount": 1,
            "planId": "plan_1",
        }
    }
    response = {
        "json": {
            "ok": True,
            "data": {
                "query": "C002",
                "total_returned": 1,
                "results": [
                    {
                        "index": "university_courses",
                        "id": "C002",
                        "score": 1.0,
                        "data": {
                            "course_id": "C002",
                            "course_name": "Data Structures",
                            "course_category": "Core",
                            "credits": 3,
                            "skills": ["Data Structures", "Algorithms"],
                        },
                    }
                ],
            },
            "selectedTool": "search_elasticsearch",
            "requestArguments": {"query": "C002"},
            "rpcId": 1,
            "planIndex": 0,
            "planCount": 1,
            "planId": "plan_1",
            "question": question,
            "responseMode": "combined",
        }
    }
    formatted = _run_node_code(
        "Format Result",
        [response],
        {"Build Tool Call": [build]},
    )
    output = _compose(formatted, prepared)
    assert "Results:" in output
    assert "Course name" in output
    assert "Data Structures" in output
    assert "نتایج درخواست شما" not in output
    assert "نام درس" not in output
