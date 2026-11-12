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


def test_out_of_scope_and_error_replies_follow_request_language():
    out_of_scope = _node("Out of Scope Reply")["parameters"]["jsCode"]
    error_reply = _node("Error Reply")["parameters"]["jsCode"]
    assert 'j.language==="en"' in out_of_scope
    assert 'p.language==="en"' in error_reply


def test_workflow_keeps_the_existing_execution_path():
    connections = _workflow()["connections"]
    assert connections["Prepare LLM Context"]["main"][0][0]["node"] == "Answer Writer"
    assert connections["Answer Writer"]["main"][0][0]["node"] == "Compose Final"
