"""Report reviewed FPGA skill mentions in specific official course publications."""

import json
import re

from tools.computational_engine.jobvision_fpga import SNAPSHOT, load_snapshot

COURSE_REVIEW = SNAPSHOT.with_name("fpga-course-syllabi.json")
FPGA = re.compile(r"\bFPGAs?\b", re.IGNORECASE)
ACADEMIC = re.compile(r"\b(?:syllab(?:us|i|uses)|course\s+evidence)\b|سرفصل|شواهد\s+درس", re.IGNORECASE)
COURSE_CODE = re.compile(r"\bECE\s*(\d{3,4})\b", re.IGNORECASE)


def is_fpga_course_question(question):
    return bool(FPGA.search(question) and ACADEMIC.search(question))


def assess_skill(course, skill_id):
    source = course["source"]
    mention = course["mentions"].get(skill_id)
    if mention:
        page = mention.get("pdf_page")
        source_url = f"{source['url']}#page={page}" if page else source["url"]
        return {"skill_id": skill_id, "status": "mentioned",
                "evidence": {**mention, "url": source_url}}
    if source["kind"] == "full_syllabus" and skill_id in course["reviewed_absences"]:
        return {"skill_id": skill_id, "status": "not_mentioned_in_full_syllabus",
                "evidence": None}
    return {"skill_id": skill_id, "status": "insufficient_course_information",
            "evidence": None}


def course_evidence_report(question):
    with COURSE_REVIEW.open(encoding="utf-8") as stream:
        review = json.load(stream)
    courses = review["courses"]
    requested = {f"ECE {code}" for code in COURSE_CODE.findall(question)}
    if requested - {course["course_id"] for course in courses}:
        raise ValueError("Choose a reviewed FPGA pilot course: ECE 2020, ECE 2031, or ECE 385.")

    snapshot = load_snapshot()
    skills = review["skill_ids"]
    return {
        "scope": {
            "role": snapshot["role"]["id"],
            "course_review_version": review["version"],
            "course_reviewed_on": review["reviewed_on"],
            "market_source": snapshot["source"]["publisher"],
            "market_country": snapshot["source"]["country"],
            "market_collection_batch": snapshot["source"]["collection_batch_sha256"],
            "market_total_postings": snapshot["total_postings"],
        },
        "skill_ids": skills,
        "courses": [
            {
                "institution": course["institution"],
                "course_id": course["course_id"],
                "course_name": course["course_name"],
                "term": course["term"],
                "section": course["section"],
                "source": course["source"],
                "skills": [assess_skill(course, skill) for skill in skills],
            }
            for course in courses
            if not requested or course["course_id"] in requested
        ],
    }
