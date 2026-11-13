import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / "workflows" / "nexusops-agentic-workflow.json"


def validate_plan_code():
    workflow = json.loads(WORKFLOW.read_text(encoding="utf-8"))
    matches = [
        node for node in workflow["nodes"]
        if node.get("name") == "Validate Plan"
    ]
    assert len(matches) == 1, "Workflow must contain exactly one Validate Plan node"
    return matches[0]["parameters"]["jsCode"]


def test_independent_graduate_count_and_skill_gap_are_both_planned():
    code = validate_plan_code()
    multi_route = code.index("if(asksGraduateCount&&asksRankedSkillGap&&!asksEmploymentAverage)")
    single_count_route = code.index(
        'if(asksGraduateCount&&!asksEmploymentAverage&&!has("به تفکیک"'
    )

    assert multi_route < single_count_route
    assert 'dataset_id:"university_graduates",operation:"count"' in code
    assert 'tool:"get_top_skill_gaps"' in code
    assert "arguments:{limit:5}" in code
    assert "رتبه‌بندی پنج مهارت با بیشترین شکاف مهارتی بازار" in code


def test_course_gap_routing_precedes_general_skill_gap_ranking():
    code = validate_plan_code()
    course_route = code.index("if(asksCourseGap)")
    skill_route = code.index("if(asksRankedSkillGap)")

    assert course_route < skill_route
    assert 'group_by:["course_id","course_name"]' in code
    assert 'field:"market_gap",alias:"max_market_gap"' in code


def test_top_five_skill_gap_request_has_a_deterministic_route():
    code = validate_plan_code()

    assert 'has("پنج مهارت","۵ مهارت","five skills"' in code
    assert "return topSkillGapPlan(requestedLimit)" in code
