"""Answer the JobVision and Purdue pilot question using live Elasticsearch evidence."""
import argparse
from getpass import getpass
import json
import os
import re

from tools.dataset_registry import get_dataset_index


MARKET_BATCH = "5ea2992462bba91dd6afe2d48f7e3878cc3a11c800f16472d60a66b4d1c13293"
COURSE_BATCH = "c533c4896e3704883f3de18c88357bdf9d58db58d6c64c85e00a5975e0f6f85b"
PROGRAM = "Purdue-BSCmpE-Fall-2026-Software-Engineering-fixed-pilot"


def share(numerator, denominator):
    return {
        "numerator": numerator,
        "denominator": denominator,
        "percent": round(100 * numerator / denominator, 2) if denominator else None,
    }


def answer(client, question):
    match = re.fullmatch(
        r"Compare ([A-Za-z0-9][A-Za-z0-9 .+#_-]*) in JobVision and Purdue\.?",
        question.strip(), re.IGNORECASE,
    )
    if not match:
        raise ValueError("Use the pilot question: Compare <skill ID> in JobVision and Purdue")
    skill = match[1].strip().casefold()
    skill_filter = {"term": {"skills": skill}}
    market_index = get_dataset_index("job_postings", "real")
    course_index = get_dataset_index("curriculum_catalog", "real")

    market = client.search(
        index=market_index, size=0, track_total_hits=True, allow_partial_search_results=False,
        query={"term": {"collection_batch": MARKET_BATCH}},
        aggs={
            "skill": {"filter": skill_filter},
            "missing_skills": {"filter": {"term": {"skill_count": 0}}},
            "categories": {"terms": {"field": "job_field", "size": 10}},
            "first_month": {"terms": {"field": "activation_month", "size": 1, "order": {"_key": "asc"}}},
            "last_month": {"terms": {"field": "activation_month", "size": 1, "order": {"_key": "desc"}}},
        },
    )
    courses = client.search(
        index=course_index, size=0, track_total_hits=True, allow_partial_search_results=False,
        query={"bool": {"filter": [
            {"term": {"collection_batch": COURSE_BATCH}},
            {"term": {"program_id": PROGRAM}},
            {"term": {"major": "Computer Engineering"}},
            {"term": {"course_type": "required"}},
        ]}},
        aggs={
            "credits": {"sum": {"field": "credits"}},
            "missing_credits": {"missing": {"field": "credits"}},
            "skill": {"filter": skill_filter, "aggs": {"credits": {"sum": {"field": "credits"}}}},
        },
    )
    if market["timed_out"] or courses["timed_out"]:
        raise RuntimeError("Elasticsearch timed out while reading the evidence.")

    market_total = market["hits"]["total"]["value"]
    course_total = courses["hits"]["total"]["value"]
    if not market_total or not course_total:
        raise ValueError("Required pilot evidence is missing from the registered Elasticsearch aliases.")

    jobs = market["aggregations"]
    curriculum = courses["aggregations"]
    posted = jobs["skill"]["doc_count"]
    missing = jobs["missing_skills"]["doc_count"]
    return {
        "question": question,
        "skill_id": skill,
        "market": {
            "scope": {"source": "JobVision", "country": "Iran", "index": market_index,
                      "collection_batch": MARKET_BATCH,
                      "categories": [bucket["key"] for bucket in jobs["categories"]["buckets"]],
                      "first_activation_month": jobs["first_month"]["buckets"][0]["key"],
                      "last_activation_month": jobs["last_month"]["buckets"][0]["key"]},
            "all_postings": share(posted, market_total),
            "postings_with_recorded_skills": share(posted, market_total - missing),
            "postings_without_recorded_skills": missing,
        },
        "education": {
            "scope": {"source": "Purdue", "major": "Computer Engineering", "program_id": PROGRAM,
                      "course_type": "required", "index": course_index, "collection_batch": COURSE_BATCH},
            "required_courses": share(curriculum["skill"]["doc_count"], course_total),
            "required_credits": share(curriculum["skill"]["credits"]["value"], curriculum["credits"]["value"])
            if not curriculum["missing_credits"]["doc_count"] else None,
        },
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("question")
    parser.add_argument("--prompt-password", action="store_true")
    args = parser.parse_args()
    if args.prompt_password:
        os.environ["ELASTICSEARCH_PASSWORD"] = getpass("Elasticsearch password: ")
    from config import get_elasticsearch_client

    with get_elasticsearch_client() as client:
        print(json.dumps(answer(client, args.question), ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
