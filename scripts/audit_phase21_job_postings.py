"""Read-only audit of active job posting batches and possible identity overlap."""
import json
from collections import Counter, defaultdict
from itertools import combinations
from pathlib import Path
import argparse


SOURCE_FAMILIES = {
    "JobVision job postings": "JobVision",
    "JobVision hardware role candidates": "JobVision",
}


def fingerprint(row):
    skills = row.get("skills")
    normalized = (tuple(sorted({value.strip().casefold() for value in skills
                                if isinstance(value, str) and value.strip()}))
                  if isinstance(skills, (list, tuple)) else None)
    return row.get("activation_month"), row.get("job_field"), normalized


def compare(left, right):
    counts = Counter()
    for identifier in left.keys() & right.keys():
        if len(left[identifier]) != 1 or len(right[identifier]) != 1:
            counts["ambiguous_within_batch"] += 1
            continue
        lhs, rhs = next(iter(left[identifier])), next(iter(right[identifier]))
        if lhs == rhs and all(value is not None and value != "" for value in lhs):
            counts["all_compared_fields_equal"] += 1
        for name, a, b in zip(("activation_month", "job_field", "skills"), lhs, rhs):
            if a is None or b is None or a == "" or b == "":
                counts[f"{name}_missing"] += 1
            elif a != b:
                counts[f"{name}_different"] += 1
            else:
                counts[f"{name}_equal"] += 1
    return dict(sorted(counts.items()))


def audit(rows):
    batches = {}
    invalid = Counter()
    for row in rows:
        if row.get("data_classification") != "real":
            invalid["not_classified_real"] += 1
            continue
        source, batch, posting = (row.get(key) for key in ("source", "collection_batch", "posting_id"))
        if not all(isinstance(value, str) and value.strip() for value in (source, batch, posting)):
            invalid["missing_identity"] += 1
            continue
        group = batches.setdefault((source, batch), {
            "ids": defaultdict(set), "documents": 0, "documents_with_skills": 0,
            "documents_with_title": 0, "months": set(), "categories": Counter(),
        })
        group["documents"] += 1
        group["ids"][posting].add(fingerprint(row))
        skills = row.get("skills")
        if isinstance(skills, (tuple, list)) and any(isinstance(x, str) and x.strip() for x in skills):
            group["documents_with_skills"] += 1
        title = row.get("posting_title")
        if isinstance(title, str) and title.strip():
            group["documents_with_title"] += 1
        month = row.get("activation_month")
        if isinstance(month, str) and month.strip():
            group["months"].add(month)
        category = row.get("job_field")
        if isinstance(category, str) and category.strip():
            group["categories"][category] += 1

    by_source = defaultdict(list)
    inventory = []
    for (source, batch), group in sorted(batches.items()):
        by_source[SOURCE_FAMILIES.get(source, source)].append((source, batch))
        inventory.append({
            "source": source, "batch": batch, "documents": group["documents"],
            "unique_ids_within_batch": len(group["ids"]),
            "duplicate_documents": group["documents"] - len(group["ids"]),
            "documents_with_skills": group["documents_with_skills"],
            "documents_without_skills": group["documents"] - group["documents_with_skills"],
            "documents_with_title": group["documents_with_title"],
            "first_month": min(group["months"], default=None),
            "last_month": max(group["months"], default=None),
            "categories": dict(sorted(group["categories"].items())),
        })

    overlap = []
    for source, batch_ids in sorted(by_source.items()):
        for left, right in combinations(batch_ids, 2):
            lhs = batches[left]["ids"]
            rhs = batches[right]["ids"]
            comparison = compare(lhs, rhs)
            shared = len(lhs.keys() & rhs.keys())
            comparable = (source == "JobVision" and {left[0], right[0]} == SOURCE_FAMILIES.keys()
                          and comparison.get("all_compared_fields_equal", 0) == shared
                          and all(group["documents"] == len(group["ids"])
                                  for group in (batches[left], batches[right])))
            pooled = None
            if comparable:
                unique = {**lhs, **rhs}
                with_skills = sum(bool(next(iter(values))[2]) for values in unique.values())
                pooled = {
                    "unique_posting_ids": len(unique),
                    "with_recorded_skills": with_skills,
                    "without_recorded_skills": len(unique) - with_skills,
                    "scope": "Two compared JobVision batches only",
                }
            overlap.append({"source": source, "left_source": left[0], "left_batch": left[1],
                            "right_source": right[0], "right_batch": right[1],
                            "matching_posting_ids": shared,
                            "field_comparison": comparison,
                            "pooled_denominators": pooled})
    return {
        "batches": inventory,
        "excluded_documents": dict(invalid),
        "same_source_overlap_candidates": overlap,
        "identity_limit": "Matching identifiers across batches require source-level identity verification. Cross-source duplicates are not assessed.",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    from config import get_elasticsearch_client
    from elasticsearch.helpers import scan
    from tools.dataset_registry import get_dataset_index

    index = get_dataset_index("job_postings", "real")
    fields = ["data_classification", "source", "collection_batch", "posting_id",
              "activation_month", "job_field", "skills", "posting_title"]
    with get_elasticsearch_client() as client:
        rows = scan(client, index=index, query={"_source": fields, "query": {"match_all": {}}},
                    allow_partial_search_results=False)
        result = audit(hit["_source"] for hit in rows)
    result["index"] = index
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
