"""Publish verified Phase 17 course evidence and search it by canonical skill."""
import argparse
import hashlib
import json
from pathlib import Path

from elasticsearch import ConflictError
from elasticsearch.helpers import scan

from scripts.plan_phase19_migration import plan
from tools.computational_engine.skill_ids import canonical
from tools.persian_ui.datasets import INDEX

ALIAS = "nexusops_real_shared_course_evidence"
REVIEW = Path(__file__).resolve().parents[1] / "configs/evidence/fpga-course-syllabi.json"


def digest(value):
    payload = json.dumps(value, sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def records_from(report):
    records = {}
    for candidate in report["candidate_groups"]:
        if candidate["status"] != "matched_reviewed_evidence":
            continue
        evidence = candidate["reviewed_evidence"]
        skill_id = candidate["skill_id"]
        identity = [evidence[key] for key in ("institution", "course_id", "term", "section")]
        key = digest([*identity, skill_id])
        if key not in records:
            records[key] = {**evidence, "skill_id": skill_id, "origins": [],
                            "classification": "real", "evidence_type": "course_skill_mention"}
        for origin in candidate["origins"]:
            if origin not in records[key]["origins"]:
                records[key]["origins"].append(origin)
    for record in records.values():
        record["origins"].sort(key=lambda origin: (origin["dataset_id"], origin["source_row"]))
    return records


def publish(client, records):
    if not records:
        raise ValueError("No verified course evidence to publish.")
    index = f"{ALIAS}__v_{digest(records)[:24]}"
    if not client.indices.exists(index=index):
        client.indices.create(index=index, mappings={"dynamic": "strict", "properties": {
            **{field: {"type": "keyword"} for field in (
                "institution", "course_id", "course_name", "term", "section",
                "review_version", "skill_id", "classification", "evidence_type")},
            **{field: {"type": "object", "enabled": False}
               for field in ("source", "mention", "origins")},
        }})
    for key, record in records.items():
        try:
            client.create(index=index, id=key, document=record)
        except ConflictError:
            pass
        if client.get(index=index, id=key)["_source"] != record:
            raise RuntimeError("Published document differs from reviewed evidence.")
    client.indices.refresh(index=index)
    if client.count(index=index)["count"] != len(records):
        raise RuntimeError("Staged document count differs from reviewed evidence.")
    current = client.indices.get_alias(name=ALIAS) if client.indices.exists_alias(name=ALIAS) else {}
    if set(current) != {index}:
        actions = [{"remove": {"index": previous, "alias": ALIAS, "must_exist": True}}
                   for previous in current]
        actions.append({"add": {"index": index, "alias": ALIAS}})
        if not client.indices.update_aliases(actions=actions)["acknowledged"]:
            raise RuntimeError("Alias update was not acknowledged.")
    return {"alias": ALIAS, "index": index, "records": len(records)}


def search(client, skill):
    skill_id = canonical(skill)
    if not skill_id:
        raise ValueError("A skill is required.")
    hits = scan(client, index=ALIAS, allow_partial_search_results=False,
                query={"query": {"term": {"skill_id": skill_id}}})
    return sorted((hit["_source"] for hit in hits),
                  key=lambda row: (row["institution"], row["course_id"], row["term"], row["section"] or ""))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--publish", action="store_true")
    mode.add_argument("--skill")
    args = parser.parse_args()

    from config import get_elasticsearch_client

    with get_elasticsearch_client() as client:
        if args.publish:
            review = json.loads(REVIEW.read_text(encoding="utf-8"))
            hits = scan(client, index=INDEX, allow_partial_search_results=False,
                        query={"query": {"match_all": {}}})
            result = publish(client, records_from(plan(hits, review)))
        else:
            result = search(client, args.skill)
    print(json.dumps(result, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
