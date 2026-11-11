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


def test_execution_trace_is_propagated_across_mcp_and_answer_context():
    workflow = _workflow()
    build = _node(workflow, "Build Tool Call")["parameters"]["jsCode"]
    parser = _node(workflow, "MCP Parse Result")["parameters"]["jsCode"]
    formatter = _node(workflow, "Format Result")["parameters"]["jsCode"]
    context = _node(workflow, "Prepare LLM Context")["parameters"]["jsCode"]
    compose = _node(workflow, "Compose Final")["parameters"]["jsCode"]

    assert '$execution?.id' in build
    assert 'executionId' in build
    assert 'executionId: request.executionId' in parser
    assert 'executionId: response.executionId' in formatter
    assert 'execution_id: item.executionId' in context
    assert 'execution_ids:' in context
    assert 'executionIds' in compose


def test_final_gate_rejects_incomplete_duplicate_and_unrecognized_plan_sets():
    workflow = _workflow()
    compose = _node(workflow, "Compose Final")["parameters"]["jsCode"]

    assert 'expectedCounts.length===1' in compose
    assert 'uniqueIndexes.size===r.length' in compose
    assert 'uniqueIds.size===ids.length' in compose
    assert 'correlationFailures' in compose
    assert 'unrecognized>0' in compose
    assert 'overallStatus' in compose
    assert 'if(mode==="analysis")' in compose
    assert 'وضعیت اعتبار پاسخ' in compose


def test_top_skill_gap_renderer_supports_tool_schema_and_nested_mcp_result_envelope():
    workflow = _workflow()
    code = _node(workflow, "Format Result")["parameters"]["jsCode"]

    assert "function renderTopSkillGaps(data)" in code
    assert 'data.result.analysis === "top_skill_gaps"' in code
    assert 'selectedTool === "get_top_skill_gaps"' in code
    for field in [
        "ranked_skill",
        "associated_course_id",
        "associated_course_name",
        "course_coverage",
        "market_demand",
        "market_gap",
    ]:
        assert field in code
    assert 'ranking_unit: payload.ranking_unit ?? "skill"' in code
    assert "safeNumber(row.market_gap) !== null" in code


def test_planner_prompt_contains_canonical_count_course_examples_and_retry_feedback():
    workflow = _workflow()
    prompt = _node(workflow, "Query Planner")["parameters"]["text"]

    for token in [
        "بازخورد اعتبارسنجی تلاش قبلی",
        "{{ $json.lastError }}",
        "{{ $json.lastRaw }}",
        '"dataset_id":"university_graduates","operation":"count"',
        '"dataset_id":"university_courses","operation":"select"',
        '"field":"course_id","operator":"eq","value":"C002"',
        "برای هر درخواست تک‌هدفه فقط قالب تک را برگردان",
    ]:
        assert token in prompt




def test_workflow_has_deterministic_fallbacks_for_grouped_filter_and_ranked_analytics():
    workflow = _workflow()
    validator = _node(workflow, "Validate Plan")["parameters"]["jsCode"]
    for token in [
        "function deterministicAnalyticsPlan(question)",
        'plan("university_graduates","aggregate"',
        '"career_relevance"',
        '"employment_months"',
        'plan("skill_mapping","select"',
        'field:"market_demand",operator:"gte"',
        'field:"market_gap",operator:"gte"',
        'plan("skill_mapping","aggregate"',
        '"average_market_gap",order:"desc"',
        "deterministicAnalyticsPlan(q) ?? extract(txt)",
    ]:
        assert token in validator


def test_planner_prompt_documents_canonical_analytics_metric_contract():
    workflow = _workflow()
    prompt = _node(workflow, "Query Planner")["parameters"]["text"]
    for token in [
        "نمونه‌های قطعی برای سه تحلیل پرتکرار",
        '"function":"avg","field":"career_relevance","alias":"average_career_relevance"',
        '"function":"avg","field":"market_demand","alias":"average_market_demand"',
        '"field":"average_market_gap","order":"desc"',
        "هرگز select_fields یا fields اختراع نکن",
        "نام ابزار تک‌هدفه همیشه دقیقاً analytics_query است",
    ]:
        assert token in prompt


def test_error_reply_distinguishes_unsupported_requests_from_invalid_plans():
    workflow = _workflow()
    code = _node(workflow, "Error Reply")["parameters"]["jsCode"]
    assert "j.unsupported === true" in code
    assert "این به معنی پشتیبانی‌نشدن تحلیل نیست" in code


def test_live_persian_grouped_graduate_prompt_has_count_and_both_averages():
    workflow = _workflow()
    validator = _node(workflow, "Validate Plan")["parameters"]["jsCode"]

    assert 'replace(/[\\u200c\\u200f]/g," ")' in validator
    assert '"ماه های اشتغال"' in validator
    assert '{function:"count_documents",alias:"graduate_count"}' in validator
    assert '"career_relevance"' in validator
    assert '"employment_months"' in validator


def test_planner_metadata_nested_in_arguments_is_normalized_without_weakening_schema():
    workflow = _workflow()
    validator = _node(workflow, "Validate Plan")["parameters"]["jsCode"]

    assert "rawArgs=x.arguments??{}" in validator
    assert "delete a.unsupported_reason" in validator
    assert "delete a.response_mode" in validator
    assert 'const extra=Object.keys(a).filter(k=>!allowed.includes(k))' in validator


def test_filtered_result_counts_are_not_described_as_full_dataset_counts():
    workflow = _workflow()
    prompt = _node(workflow, "Answer Writer")["parameters"]["text"]

    assert "تعداد کل اسناد ایندکس یا دیتاست معرفی نکن" in prompt
    assert "بدون فیلتر روی کل دیتاست" in prompt
    assert "complete بودن نتایج فیلترشده" in prompt


def test_numeric_presentation_rounds_float_artifacts_without_changing_structured_facts():
    workflow = _workflow()
    formatter = _node(workflow, "Format Result")["parameters"]["jsCode"]
    compose = _node(workflow, "Compose Final")["parameters"]["jsCode"]

    assert "Number(value.toFixed(2))" in formatter
    assert "Number(v.toFixed(2))" in compose


def test_numeric_string_float_artifacts_are_rounded_in_all_presentation_paths():
    workflow = _workflow()
    formatter = _node(workflow, "Format Result")["parameters"]["jsCode"]
    compose = _node(workflow, "Compose Final")["parameters"]["jsCode"]

    assert 'typeof value === "string"' in formatter
    assert 'typeof v==="string"' in compose
    assert 'Number(n.toFixed(2))' in compose


def test_filtered_skill_mapping_select_uses_deterministic_scope_safe_analysis():
    workflow = _workflow()
    compose = _node(workflow, "Compose Final")["parameters"]["jsCode"]

    assert 'q.dataset_id==="skill_mapping"' in compose
    assert 'تعداد کل اسناد شاخص skill_mapping را مشخص نمی‌کند' in compose
    assert 'COUNT مستقل و بدون فیلتر' in compose

def test_grouped_graduate_aggregate_uses_deterministic_evidence_based_analysis():
    workflow = _workflow()
    compose = _node(workflow, "Compose Final")["parameters"]["jsCode"]
    formatter = _node(workflow, "Format Result")["parameters"]["jsCode"]

    assert 'q.dataset_id==="university_graduates"' in compose
    assert 'q.group_by[0]==="major"' in compose
    assert 'm.alias==="graduate_count"' in compose
    assert 'm.alias==="average_career_relevance"' in compose
    assert 'm.alias==="average_employment_months"' in compose
    assert 'Number(row.average_career_relevance).toFixed(2)' in compose
    assert 'تعداد گروه‌های بازگشتی به‌تنهایی تعداد رشته‌های کل دیتاست را اثبات نمی‌کند' in compose
    assert 'value==="Computer Engineering"?"مهندسی کامپیوتر"' in compose
    assert 'column === "major" && value === "Computer Engineering" ? "مهندسی کامپیوتر"' in formatter


def test_grouped_graduate_analysis_does_not_claim_unreturned_majors_are_absent():
    workflow = _workflow()
    compose = _node(workflow, "Compose Final")["parameters"]["jsCode"]

    assert "رشته‌های دیگر در داده‌های موجود یافت نشده‌اند" not in compose
    assert "تعداد گروه‌های بازگشتی به‌تنهایی تعداد رشته‌های کل دیتاست را اثبات نمی‌کند" in compose



def test_workflow_supports_scalar_aggregates_and_bounds_filter_complexity():
    workflow = _workflow()
    validator = _node(workflow, "Validate Plan")["parameters"]["jsCode"]
    planner = _node(workflow, "Query Planner")["parameters"]["text"]
    assert 'if(op==="aggregate"&&!metrics.length)' in validator
    assert "group_by برای آمار کلی اختیاری است" in validator
    assert "state.conditions>32" in validator
    assert "depth>5" in validator
    assert "group_by را آرایه خالی" in planner
