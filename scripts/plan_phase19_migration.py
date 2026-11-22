"""Inspect Phase 17 publications before admitting rows to shared search."""
import argparse
import json
import os
import unicodedata
from pathlib import Path

from tools.computational_engine.fpga_course_evidence import assess_skill

from tools.computational_engine.skill_ids import canonical
from tools.persian_ui.datasets import INDEX, SCHEMA


# This label was used in the Phase 17 acceptance input.
REVIEWED_LABELS = {"johns hopkins 525.677.81": "johns hopkins university 525.677.81"}


def load_reviews(base_path):
    base = json.loads(base_path.read_text(encoding="utf-8"))
    additional = os.getenv("NEXUSOPS_ADDITIONAL_COURSE_REVIEW")
    if additional:
        review = json.loads(Path(additional).read_text(encoding="utf-8"))
        base["courses"].extend({**course, "review_version": review["version"]}
                               for course in review["courses"])
    return base


def match_review(candidate, review):
    labels = {title.casefold() for title in candidate["course_titles"]}
    labels = {REVIEWED_LABELS.get(label, label) for label in labels}
    matches = [course for course in review["courses"]
               if f"{course['institution']} {course['course_id']}".casefold() in labels]
    if len(matches) != 1:
        return
    course = matches[0]
    assessment = assess_skill(course, candidate["skill_id"])
    if assessment["status"] != "mentioned":
        return
    candidate["status"] = "matched_reviewed_evidence"
    candidate["reviewed_evidence"] = {
        "institution": course["institution"], "course_id": course["course_id"],
        "course_name": course["course_name"], "term": course["term"],
        "section": course.get("section"), "review_version": course.get("review_version", review["version"]),
        "source": course["source"], "mention": assessment["evidence"],
    }


def plan(hits, review=None):
    candidates = {}
    publications = []
    for hit in hits:
        dataset_id = hit["_id"]
        document = hit["_source"]
        data = document.get("data") or {}
        origin = data.get("source") or {}
        rows = data.get("records")
        if (document.get("schema") != SCHEMA or not isinstance(rows, list)
                or document.get("row_count") != len(rows)):
            publications.append({"id": dataset_id, "status": "invalid_publication"})
            continue

        accepted = 0
        for row in rows:
            if not isinstance(row, dict):
                continue
            skill = row.get("skill")
            course = row.get("course")
            position = row.get("source_row")
            if not isinstance(skill, str) or not isinstance(course, str):
                continue
            skill_id = canonical(skill)
            title = " ".join(unicodedata.normalize("NFKC", course).split())
            if not skill_id or not title or type(position) is not int or position < 1:
                continue
            key = (title.casefold(), skill_id)
            candidate = candidates.setdefault(key, {
                "course_titles": set(),
                "skill_id": skill_id,
                "status": "requires_verified_course_identity_and_evidence",
                "origins": [],
            })
            candidate["course_titles"].add(title)
            candidate["origins"].append({
                "dataset_id": dataset_id, "source_row": position,
                "source_kind": origin.get("kind"), "source_sha256": origin.get("sha256"),
            })
            accepted += 1
        publications.append({
            "id": dataset_id, "status": "reviewed_for_migration",
            "rows": len(rows), "candidate_rows": accepted, "skipped_rows": len(rows) - accepted,
        })

    for candidate in candidates.values():
        candidate["course_titles"] = sorted(candidate["course_titles"])
        if review is not None:
            match_review(candidate, review)
        candidate["origins"].sort(key=lambda item: (item["dataset_id"], item["source_row"]))
    return {
        "publications": sorted(publications, key=lambda item: item["id"]),
        "candidate_groups": [candidates[key] for key in sorted(candidates)],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, help="Path for the UTF-8 migration plan")
    parser.add_argument("--review", type=Path, help="Reviewed syllabus JSON for evidence matching")
    args = parser.parse_args()
    review = load_reviews(args.review) if args.review else None

    from elasticsearch.helpers import scan

    from config import get_elasticsearch_client

    with get_elasticsearch_client() as client:
        exists = bool(client.indices.exists(index=INDEX))
        hits = scan(client, index=INDEX, query={"query": {"match_all": {}}},
                    allow_partial_search_results=False) if exists else ()
        report = plan(hits, review)
        report["source_index_present"] = exists
    Path(args.output).write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
