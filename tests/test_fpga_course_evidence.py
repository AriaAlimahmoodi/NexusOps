import json

import pytest

from query_planner import build_query_plan
from tools.computational_engine.fpga_course_evidence import COURSE_REVIEW, assess_skill
from tools.computational_engine.service import answer


def test_fpga_course_evidence_reports_exact_scope_and_all_three_statuses():
    question = "شواهد سرفصل درس‌ها برای مهارت‌های FPGA را نشان بده"
    plan = build_query_plan(question)
    assert plan.tool_name == "skill_evidence"
    education = answer(None, **plan.arguments)["education"]
    assert education["scope"]["role"] == "fpga"
    assert education["scope"]["course_review_version"] == "fpga-course-syllabi-v2"
    assert education["scope"]["market_total_postings"] == 120

    courses = {course["course_id"]: course for course in education["courses"]}
    assert set(courses) == {"ECE 2020", "ECE 2031", "ECE 385", "ENG EC 551", "525.677.81"}
    for course in courses.values():
        assert [row["skill_id"] for row in course["skills"]] == education["skill_ids"]
        assert course["source"]["url"].startswith("https://")
        assert course["source"]["version"]

    laboratory = {row["skill_id"]: row for row in courses["ECE 2031"]["skills"]}
    assert laboratory["vhdl"]["status"] == "mentioned"
    assert laboratory["vhdl"]["evidence"]["phrase"] == "Logic synthesis and simulation using VHDL"
    assert laboratory["vhdl"]["evidence"]["url"].endswith(".pdf#page=5")
    assert laboratory["verilog"]["status"] == "not_mentioned_in_full_syllabus"
    assert laboratory["verilog"]["evidence"] is None

    outline = {row["skill_id"]: row for row in courses["ECE 385"]["skills"]}
    assert outline["systemverilog"]["status"] == "mentioned"
    assert outline["verilog"]["status"] == "insufficient_course_information"
    assert outline["verilog"]["evidence"] is None


def test_unreviewed_skill_needs_evidence_even_when_the_syllabus_is_complete():
    review = json.loads(COURSE_REVIEW.read_text(encoding="utf-8"))
    laboratory = review["courses"][0]
    assert laboratory["source"]["kind"] == "full_syllabus"
    assert assess_skill(laboratory, "python")["status"] == "insufficient_course_information"


def test_course_codes_filter_the_review_and_fail_for_unsupported_courses():
    result = answer(None, "Show the FPGA syllabus review for ECE2031")
    assert [course["course_id"] for course in result["education"]["courses"]] == ["ECE 2031"]
    with pytest.raises(ValueError, match="Choose a reviewed FPGA pilot course"):
        answer(None, "Show the FPGA syllabus review for ECE 9999")


@pytest.mark.parametrize("codes", ["ENG EC 551 and 525.677.81", "EC551 and 525.677"])
def test_fpga_course_evidence_filters_new_courses_and_preserves_source_limits(codes):
    result = answer(None, f"Show FPGA syllabus evidence for {codes}.")
    courses = result["education"]["courses"]
    assert [course["course_id"] for course in courses] == ["ENG EC 551", "525.677.81"]
    boston, hopkins = courses
    assert boston["source"]["kind"] == "catalog_description"
    assert hopkins["source"]["kind"] == "abridged_syllabus"

    boston_skills = {row["skill_id"]: row for row in boston["skills"]}
    hopkins_skills = {row["skill_id"]: row for row in hopkins["skills"]}
    assert boston_skills["verilog"]["status"] == "mentioned"
    assert "Verilog" in boston_skills["verilog"]["evidence"]["phrase"]
    assert hopkins_skills["matlab"]["status"] == "mentioned"
    assert hopkins_skills["matlab"]["evidence"]["section"] == "Course Learning Outcomes (CLOs)"
    assert boston_skills["matlab"]["status"] == "insufficient_course_information"
    assert hopkins_skills["verilog"]["status"] == "insufficient_course_information"
