import json
from pathlib import Path


WORKFLOW_PATH = (
    Path(__file__).resolve().parents[1]
    / "workflows"
    / "nexusops-agentic-workflow.json"
)


def _workflow():
    return json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))


def _node(name):
    nodes = _workflow()["nodes"]
    return next(node for node in nodes if node["name"] == name)


def test_prepare_input_detects_language_from_each_request():
    code = _node("Prepare Input")["parameters"]["jsCode"]
    assert "faLetters" in code
    assert "enLetters" in code
    assert 'language=faLetters===0&&enLetters===0?"und":faLetters>enLetters?"fa":"en"' in code
    assert "sessionId" in code


def test_numeric_only_requests_return_only_the_scalar_value():
    prepare = _node("Prepare Input")["parameters"]["jsCode"]
    compose = _node("Compose Final")["parameters"]["jsCode"]
    assert "const numericOnly=" in prepare
    assert "only (the )?number" in prepare
    assert "numericOnly&&r.length===1" in compose


def test_answer_writer_language_is_dynamic_not_persian_only():
    prompt = _node("Answer Writer")["parameters"]["text"]
    assert "{{ $json.language }}" in prompt
    assert "دقیقاً به زبان ورودی همین درخواست پاسخ بده" in prompt
    assert "- فارسی باشد." not in prompt
    assert "هرگز از تاریخچه، Session دیگر" in prompt


def test_count_and_aggregate_are_not_misclassified_as_incomplete_datasets():
    code = _node("Prepare LLM Context")["parameters"]["jsCode"]
    assert 'let completenessStatus = "not_applicable"' in code
    assert 'if (item.operation === "select")' in code
    assert '"COUNT values are scalar summaries' in code
    assert '"AGGREGATE rows are buckets' in code
    assert 'dataset_completeness: "not_assessed"' in code
    assert 'result.data_completeness.response_limited === true' in code
    assert 'status === "incomplete"' not in code


def test_compose_final_localizes_output_and_suppresses_unsolicited_analysis():
    code = _node("Compose Final")["parameters"]["jsCode"]
    assert 'const english=language==="en"' in code
    assert 'english?"Results:"' in code
    assert 'if(includeAnalysis&&analysis)' in code
    assert 'english?"Count":"تعداد"' in code


def test_markdown_headers_are_rendered_in_the_request_language():
    code = _node("Compose Final")["parameters"]["jsCode"]
    assert "headerLabels=english?{" in code
    assert 'graduate_count:"Graduate count"' in code
    assert 'graduate_count:"تعداد فارغ‌التحصیلان"' in code
    assert 'average_employment_months:"Average employment (months)"' in code
    assert 'average_employment_months:"میانگین مدت اشتغال (ماه)"' in code


def test_out_of_scope_and_error_replies_follow_request_language():
    out_of_scope = _node("Out of Scope Reply")["parameters"]["jsCode"]
    error_reply = _node("Error Reply")["parameters"]["jsCode"]
    assert 'j.language==="en"' in out_of_scope
    assert 'p.language==="en"' in error_reply


def test_tool_calls_and_results_preserve_session_identity():
    build = _node("Build Tool Call")["parameters"]["jsCode"]
    parse = _node("MCP Parse Result")["parameters"]["jsCode"]
    format_result = _node("Format Result")["parameters"]["jsCode"]
    context = _node("Prepare LLM Context")["parameters"]["jsCode"]
    assert "chatSessionId:p.sessionId" in build
    assert "mcpSessionId:init.sessionId" in build
    assert "chatSessionId: request.chatSessionId" in parse
    assert "mcpSessionId: request.mcpSessionId" in parse
    assert "mixed chat sessions detected" in context
    assert "mixed MCP sessions detected" in context
    assert "MCP session identity mismatch" in context
    assert "const chatSessionId = response.chatSessionId" in format_result


def test_course_lookup_keeps_explicit_identifier_and_name_evidence():
    code = _node("Compose Final")["parameters"]["jsCode"]
    assert 'x.selectedTool==="search_elasticsearch"' in code
    assert "row.course_id!=null&&row.course_name!=null" in code
    assert "Course evidence (course_id, course_name)" in code


def test_workflow_keeps_the_existing_execution_path():
    connections = _workflow()["connections"]
    assert connections["Prepare LLM Context"]["main"][0][0]["node"] == "Answer Writer"
    assert connections["Answer Writer"]["main"][0][0]["node"] == "Compose Final"
