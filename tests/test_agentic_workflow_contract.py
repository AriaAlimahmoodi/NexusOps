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


def _headers(node):
    return {
        str(item.get("name", "")).lower()
        for item in node["parameters"]["headerParameters"]["parameters"]
    }


def test_mcp_initialize_and_session_negotiation_contract():
    workflow = _workflow()
    initialize = _node(workflow, "MCP Initialize")
    assert initialize["parameters"]["method"] == "POST"
    assert initialize["parameters"]["url"].endswith("/mcp")
    assert _headers(initialize) >= {"content-type", "accept"}
    parse_init = _node(workflow, "MCP Parse Init")["parameters"]["jsCode"]
    assert 'getHeader("mcp-session-id")' in parse_init
    assert "message.result.protocolVersion" in parse_init


def test_initialized_notification_is_a_gate_before_tool_execution():
    workflow = _workflow()
    connections = workflow["connections"]
    assert connections["MCP Initialized Notify"]["main"][0][0]["node"] == "Validate Initialized Notification"
    assert connections["Validate Initialized Notification"]["main"][0][0]["node"] == "Initialized Notification OK?"
    branches = connections["Initialized Notification OK?"]["main"]
    assert branches[0][0]["node"] == "Build Tool Call"
    assert branches[1][0]["node"] == "Error Reply"


def test_workflow_connections_reference_existing_nodes():
    workflow = _workflow()
    names = {node["name"] for node in workflow["nodes"]}
    for source, outputs in workflow["connections"].items():
        assert source in names
        for channel_outputs in outputs.values():
            for branch in channel_outputs:
                for connection in branch:
                    assert connection["node"] in names


def test_mcp_result_parser_correlates_successful_responses_by_json_rpc_id():
    code = _node(_workflow(), "MCP Parse Result")["parameters"]["jsCode"]
    assert 'const requests = $("Build Tool Call").all()' in code
    assert "requestIds" in code
    assert "messageId" in code
    assert "successful response has no JSON-RPC ID" in code
    assert "duplicate response RPC IDs" in code
    assert "response RPC ID has no matching request" in code
    assert "response could not be paired with its originating request" in code


def test_transport_errors_keep_positional_request_metadata_only_for_http_failures():
    workflow = _workflow()
    parser = _node(workflow, "MCP Parse Result")["parameters"]["jsCode"]
    call = _node(workflow, "MCP Call Tool")["parameters"]
    response_options = call["options"]["response"]["response"]
    assert response_options["fullResponse"] is True
    assert response_options["neverError"] is True
    assert response_options["responseFormat"] == "text"
    assert "statusCode >= 400 ? requests[index] : null" in parser
    assert "Successful responses must match by JSON-RPC ID" in parser


def test_prepare_context_rejects_incomplete_or_mixed_plan_sets():
    code = _node(_workflow(), "Prepare LLM Context")["parameters"]["jsCode"]
    for token in (
        "expectedPlanCount",
        "planIndexes",
        "planIds",
        "rpcIds",
        "chatSessionIds",
        "mcpSessionIds",
        "expectedMcpSessionId",
        "mixed response modes",
        "chat session identity mismatch",
        "MCP session identity mismatch",
    ):
        assert token in code


def test_format_result_matches_each_response_to_its_originating_rpc_request():
    code = _node(_workflow(), "Format Result")["parameters"]["jsCode"]
    assert "response.rpcId" in code
    assert 'buildItems.find(item => item.json?.rpcId === response.rpcId)' in code
    assert "response RPC ID has no matching originating plan" in code


def test_top_skill_gap_renderer_uses_the_specialized_tool_contract():
    code = _node(_workflow(), "Format Result")["parameters"]["jsCode"]
    assert "function renderTopSkillGaps(data)" in code
    for field in (
        "ranked_skill",
        "associated_course_id",
        "associated_course_name",
        "course_coverage",
        "market_demand",
        "market_gap",
    ):
        assert field in code


def test_planner_prompt_documents_retry_feedback_and_canonical_entity_lookup():
    prompt = _node(_workflow(), "Query Planner")["parameters"]["text"]
    for token in (
        "بازخورد اعتبارسنجی تلاش قبلی",
        "{{ $json.lastError }}",
        "{{ $json.lastRaw }}",
        '"dataset_id":"university_graduates","operation":"count"',
        '"dataset_id":"university_courses","operation":"select"',
        '"field":"course_id","operator":"eq","value":"C002"',
        "برای هر درخواست تک‌هدفه فقط قالب تک را برگردان",
        "هرگز کلید select_fields یا fields اختراع نکن",
        "تقدم استاندارد AND بر OR",
        "کلید or_conditions نساز",
    ):
        assert token in prompt


def test_deterministic_planner_covers_scalar_aggregates_and_course_metric_routing():
    validator = _node(_workflow(), "Validate Plan")["parameters"]["jsCode"]
    for token in (
        "function deterministicAnalyticsPlan(question)",
        'group_by:[]',
        'field==="credits"?"university_courses"',
        'datasets.length===1',
        'function:"count_documents",alias:"graduate_count"',
    ):
        assert token in validator


def test_deterministic_skill_filters_preserve_every_threshold_and_boolean_group():
    workflow = _workflow()
    validator = _node(workflow, "Validate Plan")["parameters"]["jsCode"]
    planner = _node(workflow, "Query Planner")["parameters"]["text"]
    for token in (
        "const thresholds=(fields)=>",
        "const buildThresholdFilter=items=>",
        'field:"course_coverage",labels:["course_coverage","پوشش درس"]',
        'return {logic:"or",conditions:[],groups};',
        "comparisonOperator(reverse[2],true)",
    ):
        assert token in validator
    assert "تقدم استاندارد AND بر OR" in planner
    assert "مقایسه معکوس" in planner


def test_workflow_validator_bounds_filter_and_aggregation_complexity():
    validator = _node(_workflow(), "Validate Plan")["parameters"]["jsCode"]
    for token in ("depth>5", "state.groups>16", "state.conditions>32", "x.value.length>100"):
        assert token in validator
    assert 'if(op==="aggregate"&&!metrics.length)' in validator


def test_planner_metadata_is_normalized_without_weakening_argument_validation():
    validator = _node(_workflow(), "Validate Plan")["parameters"]["jsCode"]
    assert "rawArgs=x.arguments??{}" in validator
    assert "delete a.unsupported_reason" in validator
    assert "delete a.response_mode" in validator
    assert "const extra=Object.keys(a).filter(k=>!allowed.includes(k))" in validator


def test_university_market_domain_tool_is_routed_and_validated():
    workflow = _workflow()
    prompt = _node(workflow, "Query Planner")["parameters"]["text"]
    validator = _node(workflow, "Validate Plan")["parameters"]["jsCode"]
    assert "analyze_university_market" in prompt
    assert 'tool:"analyze_university_market"' in validator
    assert "course_effectiveness" in validator
    assert "curriculum_recommendations" in validator


def test_language_is_detected_once_and_propagated_to_every_response_stage():
    workflow = _workflow()
    prepare = _node(workflow, "Prepare Input")["parameters"]["jsCode"]
    context = _node(workflow, "Prepare LLM Context")["parameters"]["jsCode"]
    writer = _node(workflow, "Answer Writer")["parameters"]["text"]
    composer = _node(workflow, "Compose Final")["parameters"]["jsCode"]
    assert "faLetters" in prepare and "enLetters" in prepare
    assert 'faLetters>=enLetters?"fa":"en"' in prepare
    assert "const responseLanguage = language;" in context
    assert "persianCount" in context and "latinCount" in context
    assert "{{ $json.responseLanguage }}" in writer
    assert 'const english=language==="en"' in composer


def test_formatter_localizes_course_names_and_rounds_numeric_strings():
    code = _node(_workflow(), "Format Result")["parameters"]["jsCode"]
    assert "PERSIAN_COLUMN_LABELS" in code
    assert "ENGLISH_COURSE_NAMES" in code
    assert "displayColumnName(column)" in code
    assert 'column === "course_name"' in code
    assert 'typeof value === "string"' in code
    assert "Number(numeric.toFixed(2))" in code


def test_course_gap_aggregate_is_ranked_by_max_market_gap_and_not_bucket_order():
    code = _node(_workflow(), "Format Result")["parameters"]["jsCode"]
    assert 'args.group_by.includes("course_id")' in code
    assert 'args.group_by.includes("course_name")' in code
    assert 'metric.alias === "max_market_gap"' in code
    assert "return rightValue - leftValue" in code


def test_aggregate_semantic_integrity_checks_fields_metrics_and_duplicate_groups():
    code = _node(_workflow(), "Format Result")["parameters"]["jsCode"]
    for token in (
        'semanticIntegrity.status = semanticIntegrity.violations.length ? "invalid" : "valid"',
        '"missing_required_field:" + field',
        '"invalid_metric_value:" + alias',
        '"duplicate_group_key"',
        "semantic_integrity: semanticIntegrity",
    ):
        assert token in code


def test_compose_final_withholds_numeric_analysis_when_semantic_integrity_fails():
    code = _node(_workflow(), "Compose Final")["parameters"]["jsCode"]
    assert 'const semanticIntegrityFailures=r.filter(x=>x.semanticIntegrity?.status==="invalid")' in code
    assert '"integrity_failure"' in code
    assert "Data integrity warning" in code
    assert "final numeric analysis was withheld" in code


def test_course_gap_report_uses_all_structured_rows_and_handles_empty_or_invalid_rows():
    code = _node(_workflow(), "Compose Final")["parameters"]["jsCode"]
    for token in (
        "courseGapAggregates",
        "ranked.map((row,index)",
        "all \"+ranked.length+\" course rows",
        "Course ranking by maximum skill gap",
        "رتبه‌بندی قطعی درس‌ها بر اساس بیشترین شکاف مهارتی",
        "if(sourceRows.length===0)",
        "No aggregated course rows were returned",
    ):
        assert token in code


def test_answer_writer_never_overstates_filtered_result_scope_or_invents_missing_entities():
    prompt = _node(_workflow(), "Answer Writer")["parameters"]["text"]
    assert "تعداد کل اسناد ایندکس یا دیتاست معرفی نکن" in prompt
    assert "بدون فیلتر روی کل دیتاست" in prompt
    assert "complete بودن نتایج فیلترشده" in prompt
    assert "Never infer that unreturned majors" in prompt


def test_error_reply_is_bilingual_and_never_converts_execution_errors_to_zero():
    code = _node(_workflow(), "Error Reply")["parameters"]["jsCode"]
    assert 'p.language==="en"' in code
    assert "This does not mean that the result is zero" in code
    assert "این خطا به معنی صفر بودن نتایج نیست" in code
