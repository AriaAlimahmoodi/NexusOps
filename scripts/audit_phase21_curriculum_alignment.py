"""Audit active curriculum coverage and produce a scoped course alignment report."""
import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path


def catalog_inventory(rows):
    groups = defaultdict(list)
    for row in rows:
        key = tuple(row.get(field) for field in
                    ("source", "program_id", "major", "study_level", "collection_batch"))
        groups[key].append(row)
    result = []
    for key, courses in sorted(groups.items(), key=lambda item: repr(item[0])):
        types = Counter(row.get("course_type") or "unknown" for row in courses)
        required = [row for row in courses if row.get("course_type") == "required"]
        result.append({
            **dict(zip(("source", "program_id", "major", "study_level", "collection_batch"), key)),
            "records": len(courses),
            "unique_course_ids": len({row["course_id"] for row in courses if row.get("course_id")}),
            "course_types": dict(types),
            "required_courses_missing_credits": sum(row.get("credits") is None for row in required),
            "courses_missing_recorded_skills": sum(not row.get("skills") for row in courses),
        })
    return result


def alignment_summary(report):
    groups = defaultdict(list)
    for row in report["courses"]:
        key = tuple(row[field] for field in ("program_id", "collection_batch", "market_batch"))
        groups[key].append(row)
    result = []
    for key, rows in sorted(groups.items(), key=lambda item: repr(item[0])):
        eligible = [row for row in rows if row["status"] == "computed"
                    and row["observed_alignment_percent"] is not None]
        ranked = sorted(eligible, key=lambda row: (-row["observed_alignment_percent"], row["course_id"]))
        ranked_rows = [{field: row[field] for field in (
            "course_id", "course_name", "observed_alignment_percent", "documented_skills",
            "postings_by_course_skill", "course_evidence", "market_review_reference")}
            for row in ranked]
        review = []
        for row in rows:
            unmatched = sorted(skill for skill, count in row["postings_by_course_skill"].items()
                               if count == 0)
            if not unmatched and row["documented_skills"]:
                continue
            review.append({
                "course_id": row["course_id"], "course_name": row["course_name"],
                "observed_unmatched_skills": unmatched,
                "status": row["status"], "limitation": row["limitation"],
                "market_review_reference": row["market_review_reference"],
                "course_evidence": row["course_evidence"],
                "action": (
                    "Review the official syllabus for documented skills."
                    if not row["documented_skills"] else
                    "Verify market scope and skill capture before proposing curriculum changes."
                    if row["status"] != "computed" else
                    "Review the relevance of these skills against the cited market scope."
                ),
            })
        result.append({
            "program_id": key[0], "curriculum_batch": key[1], "market_batch": key[2],
            "market_sources": rows[0]["market_sources"],
            "total_postings": rows[0]["total_postings"],
            "assessable_postings": rows[0]["assessable_postings"],
            "status_counts": dict(Counter(row["status"] for row in rows)),
            "ranked_courses": ranked_rows, "review_items": review,
        })
    return {"metric_version": report["metric_version"], "scopes": result}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    from config import get_elasticsearch_client
    from elasticsearch.helpers import scan
    from tools.computational_engine.course_alignment import live_report
    from tools.dataset_registry import get_dataset_index

    with get_elasticsearch_client() as client:
        index = get_dataset_index("curriculum_catalog", "real")
        hits = scan(client, index=index, allow_partial_search_results=False,
                    query={"query": {"term": {"data_classification": "real"}}})
        inventory = catalog_inventory(hit["_source"] for hit in hits)
        result = {"catalog": inventory, "alignment": alignment_summary(live_report(client))}
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
