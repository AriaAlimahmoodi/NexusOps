from __future__ import annotations

import argparse
import csv
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


PERSIAN_RE = re.compile(r"[\u0600-\u06FF]")
COMPOSITE_RE = re.compile(r"[&,/+]|\b(?:and|or)\b|[,()]")
WHITESPACE_RE = re.compile(r"\s+")


def clean(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def normalize_label(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).casefold()
    value = value.replace("\u064a", "\u06cc").replace("\u0643", "\u06a9")
    value = value.replace("\u200c", " ").replace("\u200f", "")
    value = WHITESPACE_RE.sub(" ", value).strip()
    return value


def parse_json_array(value: str) -> tuple[list[Any], str | None]:
    value = clean(value)
    if not value:
        return [], None
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError as exc:
        return [], f"invalid_json:{exc.msg}"
    if not isinstance(parsed, list):
        return [], "not_json_array"
    return parsed, None


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Read-only semantic audit of JobVision categories and nested software skills. "
            "Does not modify source data, NexusOps mappings, Registry, or Elasticsearch."
        )
    )
    parser.add_argument("--input", required=True, help="Path to JobVision CSV source")
    parser.add_argument(
        "--output",
        default="jobvision-semantic-audit-v3.json",
        help="Output JSON report path",
    )
    parser.add_argument("--encoding", default="utf-8-sig")
    args = parser.parse_args()

    main_category_counts: Counter[str] = Counter()
    secondary_category_counts: Counter[str] = Counter()
    secondary_raw_counts: Counter[str] = Counter()
    secondary_token_occurrences: Counter[str] = Counter()
    main_secondary_overlap_rows = 0
    duplicate_secondary_rows = 0
    multi_secondary_rows = 0
    secondary_records = 0
    secondary_invalid_rows: list[dict[str, Any]] = []
    secondary_empty_rows = 0

    skill_mentions: Counter[str] = Counter()
    skill_title_fa_values: dict[str, Counter[str]] = defaultdict(Counter)
    skill_levels: dict[str, Counter[str]] = defaultdict(Counter)
    skill_persian_title_values: dict[str, Counter[str]] = defaultdict(Counter)
    skill_title_en_values: dict[str, Counter[str]] = defaultdict(Counter)
    skill_rows_missing_en = 0
    skill_rows_missing_fa = 0
    skill_invalid_rows: list[dict[str, Any]] = []
    skill_non_object_items: list[dict[str, Any]] = []
    alias_to_skill_names: dict[str, set[str]] = defaultdict(set)
    normalized_en_to_raw: dict[str, set[str]] = defaultdict(set)
    normalized_alias_to_raw: dict[str, set[str]] = defaultdict(set)

    row_count = 0
    with Path(args.input).open("r", encoding=args.encoding, newline="") as source:
        reader = csv.DictReader(source)
        required_columns = {
            "Jobpost_MainJobCategory",
            "Jobpost_SecondaryJobCategories",
            "Jobpost_SoftwareSkills",
        }
        missing = sorted(required_columns - set(reader.fieldnames or []))
        if missing:
            raise SystemExit(f"CSV is missing required columns: {', '.join(missing)}")

        for row_number, row in enumerate(reader, start=2):
            row_count += 1

            main_category = clean(row.get("Jobpost_MainJobCategory"))
            if main_category:
                main_category_counts[main_category] += 1

            secondary_raw = clean(row.get("Jobpost_SecondaryJobCategories"))
            if not secondary_raw:
                secondary_empty_rows += 1
            else:
                secondary_records += 1
                secondary_raw_counts[secondary_raw] += 1
                # The source profile showed comma-separated text, not JSON.
                tokens = [part.strip() for part in secondary_raw.split(",") if part.strip()]
                secondary_token_occurrences.update(tokens)
                secondary_category_counts.update(tokens)
                if len(tokens) > 1:
                    multi_secondary_rows += 1
                if len(tokens) != len(set(tokens)):
                    duplicate_secondary_rows += 1
                if main_category and main_category in tokens:
                    main_secondary_overlap_rows += 1

            skill_items, skill_error = parse_json_array(row.get("Jobpost_SoftwareSkills", ""))
            if skill_error:
                skill_invalid_rows.append(
                    {"row_number": row_number, "error": skill_error}
                )
                continue

            for item_index, item in enumerate(skill_items):
                if not isinstance(item, dict):
                    skill_non_object_items.append(
                        {
                            "row_number": row_number,
                            "item_index": item_index,
                            "value_type": type(item).__name__,
                        }
                    )
                    continue

                title_en = clean(item.get("TitleEn"))
                title_fa = clean(item.get("TitleFa"))
                level = clean(item.get("Level"))
                if not title_en:
                    skill_rows_missing_en += 1
                    continue
                if not title_fa:
                    skill_rows_missing_fa += 1

                skill_mentions[title_en] += 1
                skill_title_en_values[title_en][title_en] += 1
                if title_fa:
                    skill_title_fa_values[title_en][title_fa] += 1
                    aliases = [part.strip() for part in title_fa.split(",") if part.strip()]
                    for alias in aliases:
                        alias_to_skill_names[alias].add(title_en)
                        normalized_alias_to_raw[normalize_label(alias)].add(alias)
                if level:
                    skill_levels[title_en][level] += 1

                normalized_en_to_raw[normalize_label(title_en)].add(title_en)

    main_categories = set(main_category_counts)
    secondary_categories = set(secondary_category_counts)
    main_only = sorted(main_categories - secondary_categories)
    secondary_only = sorted(secondary_categories - main_categories)
    alias_collisions = [
        {
            "alias": alias,
            "skill_names": sorted(skill_names),
            "mention_count_for_alias": sum(
                count
                for skill_name in skill_names
                for raw_value, count in skill_title_fa_values[skill_name].items()
                if alias in {
                    part.strip()
                    for part in raw_value.split(",")
                    if part.strip()
                }
            ),
        }
        for alias, skill_names in sorted(alias_to_skill_names.items())
        if len(skill_names) > 1
    ]

    skills_report: list[dict[str, Any]] = []
    for skill_name, mention_count in sorted(
        skill_mentions.items(), key=lambda item: (-item[1], item[0].casefold())
    ):
        fa_values = skill_title_fa_values[skill_name]
        levels = skill_levels[skill_name]
        flags: list[str] = []
        if PERSIAN_RE.search(skill_name):
            flags.append("title_en_contains_persian_script")
        if COMPOSITE_RE.search(skill_name):
            flags.append("possible_composite_or_multi_part_label")
        if not fa_values:
            flags.append("missing_title_fa")
        if len(fa_values) > 1:
            flags.append("multiple_title_fa_variants")
        aliases = sorted(
            {
                alias.strip()
                for raw_fa in fa_values
                for alias in raw_fa.split(",")
                if alias.strip()
            }
        )
        if len(aliases) > 1:
            flags.append("multiple_persian_alias_tokens")
        skills_report.append(
            {
                "title_en": skill_name,
                "mention_count": mention_count,
                "title_fa_values": [
                    {"value": value, "count": count}
                    for value, count in fa_values.most_common()
                ],
                "persian_alias_tokens": aliases,
                "level_distribution": dict(levels.most_common()),
                "audit_flags": flags,
            }
        )

    normalized_en_collisions = [
        {"normalized": key, "raw_labels": sorted(values)}
        for key, values in sorted(normalized_en_to_raw.items())
        if len(values) > 1
    ]
    normalized_alias_collisions = [
        {"normalized": key, "raw_aliases": sorted(values)}
        for key, values in sorted(normalized_alias_to_raw.items())
        if len(values) > 1
    ]

    # A comma-split token is only taxonomy-compatible when it exactly matches
    # a main category. This is a diagnostic, not proof that comma splitting is safe.
    secondary_tokens_not_in_main_taxonomy = [
        {"category": category, "occurrences": count}
        for category, count in sorted(secondary_category_counts.items())
        if category not in main_categories
    ]

    report = {
        "report_schema_version": 1,
        "audit_name": "jobvision_semantic_audit_v3",
        "source": {
            "file": str(Path(args.input)),
            "encoding": args.encoding,
            "rows_read": row_count,
            "read_only": True,
        },
        "scope_and_safety": {
            "source_data_modified": False,
            "dataset_registry_modified": False,
            "mapping_spec_created": False,
            "elasticsearch_accessed": False,
            "ingestion_authorized": False,
            "interpretation": (
                "Flags identify candidates for human semantic review; they do not "
                "assert that a label is erroneous or approve any mapping."
            ),
        },
        "category_analysis": {
            "main_category_unique_count": len(main_categories),
            "secondary_category_unique_count_after_comma_split": len(secondary_categories),
            "main_category_counts": [
                {"category": key, "job_post_count": count}
                for key, count in main_category_counts.most_common()
            ],
            "secondary_category_counts": [
                {"category": key, "secondary_mentions": count}
                for key, count in secondary_category_counts.most_common()
            ],
            "main_only_categories": main_only,
            "secondary_only_categories": secondary_only,
            "records_with_secondary_categories": secondary_records,
            "records_without_secondary_categories": secondary_empty_rows,
            "records_with_multiple_secondary_categories": multi_secondary_rows,
            "records_with_duplicate_secondary_items": duplicate_secondary_rows,
            "records_where_main_category_also_appears_in_secondary": main_secondary_overlap_rows,
            "unique_raw_secondary_strings": len(secondary_raw_counts),
            "secondary_tokens_not_found_in_main_taxonomy": secondary_tokens_not_in_main_taxonomy,
            "top_raw_secondary_strings": [
                {"raw_value": value, "record_count": count}
                for value, count in secondary_raw_counts.most_common(100)
            ],
            "split_assumption": (
                "Secondary categories were split on literal commas. Tokens not found "
                "in the main-category taxonomy are surfaced for review; matching tokens "
                "do not by themselves prove that comma splitting preserves semantics."
            ),
        },
        "software_skill_analysis": {
            "unique_title_en_labels": len(skill_mentions),
            "total_skill_mentions_with_nonempty_title_en": sum(skill_mentions.values()),
            "items_missing_title_en": skill_rows_missing_en,
            "items_missing_title_fa": skill_rows_missing_fa,
            "invalid_or_non_array_software_json_rows": skill_invalid_rows,
            "non_object_skill_items": skill_non_object_items,
            "title_en_labels": skills_report,
            "title_fa_alias_collisions_across_multiple_title_en": alias_collisions,
            "normalized_title_en_collisions": normalized_en_collisions,
            "normalized_persian_alias_collisions": normalized_alias_collisions,
            "flag_definitions": {
                "title_en_contains_persian_script": "TitleEn contains at least one Persian/Arabic-block character.",
                "possible_composite_or_multi_part_label": "Label contains &, /, +, comma, parentheses, or standalone and/or.",
                "missing_title_fa": "No non-empty TitleFa was observed for this TitleEn label.",
                "multiple_title_fa_variants": "More than one raw TitleFa value was observed for the same TitleEn.",
                "multiple_persian_alias_tokens": "TitleFa contains more than one comma-separated alias token.",
            },
            "interpretation_note": (
                "TitleEn and TitleFa are preserved as source labels. Persian script, "
                "composite punctuation, or alias collisions are review signals only; "
                "no automatic canonicalization, translation validation, or deduplication is performed."
            ),
        },
        "data_quality": {
            "secondary_category_rows_with_nonempty_raw_value": secondary_records,
            "software_skill_json_error_row_count": len(skill_invalid_rows),
            "software_skill_non_object_item_count": len(skill_non_object_items),
        },
    }

    output_path = Path(args.output)
    output_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "status": "completed",
                "rows_read": row_count,
                "unique_main_categories": len(main_categories),
                "unique_secondary_categories": len(secondary_categories),
                "unique_software_skill_labels": len(skill_mentions),
                "skill_mentions": sum(skill_mentions.values()),
                "secondary_only_categories": len(secondary_only),
                "secondary_tokens_not_in_main_taxonomy": len(
                    secondary_tokens_not_in_main_taxonomy
                ),
                "alias_collisions": len(alias_collisions),
                "output": str(output_path),
                "read_only": True,
                "ingestion_authorized": False,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
