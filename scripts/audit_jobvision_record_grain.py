from __future__ import annotations

import argparse
import csv
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


def clean(value: Any) -> str:
    return "" if value is None else str(value).strip()


def parse_skill_array(value: str) -> tuple[list[Any], str | None]:
    raw = clean(value)
    if not raw:
        return [], None
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        return [], f"invalid_json:{exc.msg}"
    if not isinstance(parsed, list):
        return [], "not_json_array"
    return parsed, None


def row_fingerprint(row: dict[str, str | None], fieldnames: list[str]) -> str:
    payload = json.dumps(
        [row.get(name) for name in fieldnames],
        ensure_ascii=False,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Read-only JobVision record-grain, RowNumber, and skill-expansion audit. "
            "Does not modify source data, NexusOps schemas, mappings, or Elasticsearch."
        )
    )
    parser.add_argument("--input", required=True, help="Path to JobVision CSV source")
    parser.add_argument(
        "--output",
        default="jobvision-record-grain-audit-v1.json",
        help="Output JSON report path",
    )
    parser.add_argument("--encoding", default="utf-8-sig")
    args = parser.parse_args()

    required = {
        "RowNumber",
        "Jobpost_MainJobCategory",
        "Jobpost_SecondaryJobCategories",
        "Jobpost_SoftwareSkills",
    }
    row_count = 0
    row_number_counts: Counter[int] = Counter()
    row_number_invalid_rows: list[dict[str, Any]] = []
    row_number_order_mismatches: list[dict[str, Any]] = []
    row_fingerprints: Counter[str] = Counter()
    skill_count_distribution: Counter[int] = Counter()
    skill_posts_by_label: Counter[str] = Counter()
    skill_mentions_by_label: Counter[str] = Counter()
    duplicate_skill_occurrences_by_label: Counter[str] = Counter()
    skill_json_errors: list[dict[str, Any]] = []
    non_object_skill_items: list[dict[str, Any]] = []
    missing_title_en_items = 0
    missing_title_fa_items = 0
    skill_posts_with_any = 0
    skill_posts_without_any = 0
    posts_with_duplicate_title_en = 0
    duplicate_title_en_excess_items = 0
    total_skill_items = 0
    secondary_posts = 0
    secondary_multi_posts = 0
    secondary_duplicate_posts = 0
    secondary_main_overlap_posts = 0
    expanded_main_skill_rows = 0
    expanded_all_category_skill_rows = 0
    posts_with_skills_and_secondary = 0
    max_skills_in_post = 0
    max_categories_in_post = 0

    with Path(args.input).open("r", encoding=args.encoding, newline="") as source:
        reader = csv.DictReader(source)
        fieldnames = list(reader.fieldnames or [])
        missing = sorted(required - set(fieldnames))
        if missing:
            raise SystemExit(f"CSV is missing required columns: {', '.join(missing)}")

        for source_line, row in enumerate(reader, start=2):
            row_count += 1
            raw_row_number = clean(row.get("RowNumber"))
            parsed_row_number: int | None = None
            try:
                if raw_row_number:
                    parsed_row_number = int(raw_row_number)
            except ValueError:
                parsed_row_number = None
            if parsed_row_number is None:
                row_number_invalid_rows.append({
                    "csv_line": source_line,
                    "raw_value": raw_row_number or None,
                })
            else:
                row_number_counts[parsed_row_number] += 1
                if parsed_row_number != row_count:
                    if len(row_number_order_mismatches) < 25:
                        row_number_order_mismatches.append({
                            "csv_line": source_line,
                            "expected_position": row_count,
                            "row_number": parsed_row_number,
                        })

            row_fingerprints[row_fingerprint(row, fieldnames)] += 1

            main_category = clean(row.get("Jobpost_MainJobCategory"))
            secondary_raw = clean(row.get("Jobpost_SecondaryJobCategories"))
            secondary = [
                token.strip()
                for token in secondary_raw.split(",")
                if token.strip()
            ] if secondary_raw else []
            if secondary:
                secondary_posts += 1
                if len(secondary) > 1:
                    secondary_multi_posts += 1
                if len(secondary) != len(set(secondary)):
                    secondary_duplicate_posts += 1
                if main_category and main_category in secondary:
                    secondary_main_overlap_posts += 1

            category_values = ([main_category] if main_category else []) + secondary
            unique_categories = set(category_values)
            skills, error = parse_skill_array(row.get("Jobpost_SoftwareSkills", ""))
            if error:
                skill_json_errors.append({"csv_line": source_line, "error": error})
                skills = []

            per_post_labels: Counter[str] = Counter()
            valid_items_in_post = 0
            for item_index, item in enumerate(skills):
                if not isinstance(item, dict):
                    non_object_skill_items.append({
                        "csv_line": source_line,
                        "item_index": item_index,
                        "value_type": type(item).__name__,
                    })
                    continue
                total_skill_items += 1
                title_en = clean(item.get("TitleEn"))
                title_fa = clean(item.get("TitleFa"))
                if not title_en:
                    missing_title_en_items += 1
                    continue
                if not title_fa:
                    missing_title_fa_items += 1
                per_post_labels[title_en] += 1
                valid_items_in_post += 1
                skill_mentions_by_label[title_en] += 1

            skill_count_distribution[valid_items_in_post] += 1
            max_skills_in_post = max(max_skills_in_post, valid_items_in_post)
            if valid_items_in_post:
                skill_posts_with_any += 1
            else:
                skill_posts_without_any += 1

            for label, count in per_post_labels.items():
                skill_posts_by_label[label] += 1
                if count > 1:
                    duplicate_skill_occurrences_by_label[label] += count - 1
            duplicate_excess = sum(count - 1 for count in per_post_labels.values() if count > 1)
            if duplicate_excess:
                posts_with_duplicate_title_en += 1
                duplicate_title_en_excess_items += duplicate_excess

            max_categories_in_post = max(max_categories_in_post, len(unique_categories))
            expanded_main_skill_rows += valid_items_in_post
            expanded_all_category_skill_rows += valid_items_in_post * len(unique_categories)
            if valid_items_in_post and secondary:
                posts_with_skills_and_secondary += 1

    duplicate_row_number_values = [
        {"value": value, "row_count": count}
        for value, count in row_number_counts.items()
        if count > 1
    ]
    duplicate_fingerprint_groups = sum(1 for count in row_fingerprints.values() if count > 1)
    duplicate_fingerprint_excess_rows = sum(count - 1 for count in row_fingerprints.values() if count > 1)
    unique_row_numbers = len(row_number_counts)
    min_row_number = min(row_number_counts) if row_number_counts else None
    max_row_number = max(row_number_counts) if row_number_counts else None
    expected_sequence = set(range(1, row_count + 1))
    missing_sequence_values = sorted(expected_sequence - set(row_number_counts))
    out_of_range_values = sorted(
        value for value in row_number_counts if value < 1 or value > row_count
    )

    report = {
        "report_schema_version": 1,
        "audit_name": "jobvision_record_grain_audit_v1",
        "source": {
            "file": str(Path(args.input)),
            "encoding": args.encoding,
            "rows_read": row_count,
            "columns_read": len(fieldnames),
            "read_only": True,
        },
        "scope_and_safety": {
            "source_data_modified": False,
            "dataset_registry_modified": False,
            "mapping_spec_created": False,
            "elasticsearch_accessed": False,
            "ingestion_authorized": False,
        },
        "record_identity_analysis": {
            "row_number_field": "RowNumber",
            "row_number_nonempty_integer_rows": sum(row_number_counts.values()),
            "row_number_invalid_or_empty_rows": len(row_number_invalid_rows),
            "unique_row_number_values": unique_row_numbers,
            "duplicate_row_number_value_count": len(duplicate_row_number_values),
            "duplicate_row_number_values_sample": sorted(
                duplicate_row_number_values, key=lambda item: (-item["row_count"], item["value"])
            )[:50],
            "row_number_min": min_row_number,
            "row_number_max": max_row_number,
            "row_number_matches_csv_position": (
                not row_number_invalid_rows
                and not row_number_order_mismatches
                and unique_row_numbers == row_count
            ),
            "row_number_order_mismatch_sample": row_number_order_mismatches,
            "missing_values_from_expected_1_to_n_sequence": len(missing_sequence_values),
            "missing_sequence_values_sample": missing_sequence_values[:50],
            "out_of_range_row_number_values": out_of_range_values[:50],
            "exact_duplicate_row_fingerprint_groups": duplicate_fingerprint_groups,
            "exact_duplicate_row_excess_count": duplicate_fingerprint_excess_rows,
            "exact_duplicate_row_fingerprint_is_identity": False,
            "interpretation": (
                "RowNumber can at most identify a row within this observed snapshot if uniqueness "
                "and sequence checks pass. A positional row number is not evidence of a durable "
                "source identifier across refreshed or reordered source exports. Exact row "
                "fingerprints are diagnostics, not guaranteed stable IDs."
            ),
            "invalid_row_number_rows_sample": row_number_invalid_rows[:50],
        },
        "software_skill_record_grain": {
            "rows_with_at_least_one_valid_title_en_skill": skill_posts_with_any,
            "rows_without_valid_title_en_skill": skill_posts_without_any,
            "total_object_skill_items": total_skill_items,
            "skill_items_with_nonempty_title_en": sum(skill_mentions_by_label.values()),
            "skill_items_missing_title_en": missing_title_en_items,
            "skill_items_missing_title_fa": missing_title_fa_items,
            "invalid_or_non_array_skill_json_rows": len(skill_json_errors),
            "non_object_skill_items": len(non_object_skill_items),
            "rows_with_duplicate_title_en_within_same_post": posts_with_duplicate_title_en,
            "duplicate_title_en_excess_items_within_posts": duplicate_title_en_excess_items,
            "max_valid_title_en_skills_in_one_post": max_skills_in_post,
            "skills_per_post_distribution": [
                {"skill_count": count, "post_count": posts}
                for count, posts in sorted(skill_count_distribution.items())
            ],
            "per_skill_post_and_mention_counts": [
                {
                    "title_en": label,
                    "distinct_posts_with_skill": skill_posts_by_label[label],
                    "skill_mentions": skill_mentions_by_label[label],
                    "duplicate_mentions_within_same_post": duplicate_skill_occurrences_by_label[label],
                }
                for label in sorted(skill_mentions_by_label, key=lambda name: (-skill_posts_by_label[name], name.casefold()))
            ],
            "invalid_skill_json_rows_sample": skill_json_errors[:50],
            "non_object_skill_items_sample": non_object_skill_items[:50],
        },
        "category_skill_expansion": {
            "rows_with_secondary_categories": secondary_posts,
            "rows_with_multiple_secondary_categories": secondary_multi_posts,
            "rows_with_duplicate_secondary_categories": secondary_duplicate_posts,
            "rows_where_main_category_repeats_in_secondary": secondary_main_overlap_posts,
            "rows_with_skills_and_secondary_categories": posts_with_skills_and_secondary,
            "max_unique_categories_per_post_including_main": max_categories_in_post,
            "skill_rows_if_one_row_per_post_skill_using_main_category_only": expanded_main_skill_rows,
            "skill_rows_if_each_post_skill_is_repeated_for_every_unique_main_and_secondary_category": expanded_all_category_skill_rows,
            "additional_rows_from_category_skill_cross_product": expanded_all_category_skill_rows - expanded_main_skill_rows,
            "interpretation": (
                "The all-category figure is a cross-product scenario, not a recommendation. "
                "Repeating each post skill for every category can inflate counts and must not "
                "be treated as independent skill demand without an explicit attribution rule."
            ),
        },
        "data_quality": {
            "row_number_invalid_or_empty_count": len(row_number_invalid_rows),
            "duplicate_row_number_value_count": len(duplicate_row_number_values),
            "exact_duplicate_row_excess_count": duplicate_fingerprint_excess_rows,
            "skill_json_error_count": len(skill_json_errors),
            "non_object_skill_item_count": len(non_object_skill_items),
        },
    }

    output_path = Path(args.output)
    output_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "status": "completed",
        "rows_read": row_count,
        "row_number_matches_csv_position": report["record_identity_analysis"]["row_number_matches_csv_position"],
        "duplicate_row_number_value_count": len(duplicate_row_number_values),
        "exact_duplicate_row_excess_count": duplicate_fingerprint_excess_rows,
        "rows_with_skills": skill_posts_with_any,
        "skill_items_with_title_en": sum(skill_mentions_by_label.values()),
        "rows_with_duplicate_title_en_within_same_post": posts_with_duplicate_title_en,
        "skill_rows_main_category_only": expanded_main_skill_rows,
        "skill_rows_all_category_cross_product": expanded_all_category_skill_rows,
        "read_only": True,
        "ingestion_authorized": False,
        "output": str(output_path),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
