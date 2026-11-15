"""Read-only semantic coverage audit for an external source profile.

This audit compares source headers with the existing NexusOps registry and,
when a local CSV is supplied, measures row-level consistency of bilingual
column candidates. It never changes schemas, source data, or ingestion state.

Example:
    python -m scripts.audit_source_semantic_coverage jobvision-source-profile.json \
        --csv "D:/data/JobVision_Jobposts_Dataset.csv" \
        --output jobvision-semantic-coverage-audit.json
"""
from __future__ import annotations

import argparse
import csv
import json
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterable

from tools.dataset_registry import DATASET_PROFILES
from tools.semantic_matching import detect_bilingual_field_pairs, match_source_profile


# Independent domain review of every JobVision header. "candidate" means
# semantically plausible for review, not an accepted mapping.
_FIELD_REVIEW: dict[str, tuple[str, str, str | None, str | None]] = {
    "RowNumber": ("metadata", "Row sequence identifier; not a NexusOps business entity key.", None, None),
    "Jobpost_RawTitle": ("candidate", "Advertised job title; conceptually aligns with job_title.", "labor_market", "job_title"),
    "Jobpost_PreferredGender": ("unsupported", "Recruitment preference; no corresponding field in the current registry.", None, None),
    "Jobpost_ProvinceFa": ("unsupported", "Job location; no location dimension exists in the current registry.", None, None),
    "Jobpost_ProvinceEn": ("unsupported", "English representation of job location; no location dimension exists.", None, None),
    "Jobpost_WorkTypeFa": ("unsupported", "Employment arrangement; no work_type field exists in the registry.", None, None),
    "Jobpost_WorkTypeEn": ("unsupported", "English representation of employment arrangement; no work_type field exists.", None, None),
    "Jobpost_SalaryCanBeShown": ("unsupported", "Salary-disclosure permission, not a salary amount or existing canonical field.", None, None),
    "Jobpost_MinSalary": ("unsupported", "Salary lower bound; no salary metric exists in the current registry.", None, None),
    "Jobpost_MaxSalary": ("unsupported", "Salary upper bound; no salary metric exists in the current registry.", None, None),
    "Jobpost_MainJobCategory": ("candidate", "Primary occupational category; plausible job_field candidate, subject to taxonomy review.", "labor_market", "job_field"),
    "Jobpost_SecondaryJobCategories": ("candidate", "Additional occupational categories; same broad concept as job_field but multi-valued and requires extraction.", "labor_market", "job_field"),
    "Jobpost_IndustryFa": ("unsupported", "Employer/business industry is not the same concept as occupational job_field.", None, None),
    "Jobpost_IndustryEn": ("unsupported", "English employer-industry label; no industry field exists in the registry.", None, None),
    "Jobpost_RequiredExperienceYears": ("unsupported", "Numeric required years are not the categorical experience_level field.", None, None),
    "Jobpost_RequiredRelatedExperienceInThisIndustry": ("unsupported", "Employer requirement flag, not a graduate attribute or experience-level category.", None, None),
    "Jobpost_CompanyWorkTimesDescription": ("unsupported", "Free-text work schedule; no schedule field exists in the registry.", None, None),
    "Jobpost_LanguageSkills": ("unsupported", "Language proficiency requirements are not software skills; no language-skills field exists.", None, None),
    "Jobpost_SoftwareSkills": ("candidate", "Nested advertised software skills; plausible skill candidate after extracting skill names, not copying JSON.", "labor_market", "skill"),
    "Jobpost_AcademicFields": ("unsupported", "Required academic fields for applicants, not a graduate's own major.", None, None),
    "Jobpost_BenefitFa": ("unsupported", "Employment benefits; no benefits field exists in the registry.", None, None),
    "Jobpost_BenefitEn": ("unsupported", "English employment-benefits labels; no benefits field exists.", None, None),
    "Jobpost_HasDisabilitySupport": ("unsupported", "Employer support/eligibility attribute; no equivalent canonical field exists.", None, None),
    "Jobpost_RequiredMinAge": ("unsupported", "Minimum applicant age is not graduation_year or another registered field.", None, None),
    "Jobpost_RequiredMaxAge": ("unsupported", "Maximum applicant age is not graduation_year or another registered field.", None, None),
    "Jobpost_RequiredMilitaryServiceCard": ("unsupported", "Hiring requirement, not additional_training or a graduate attribute.", None, None),
    "Jobpost_IsRemote": ("unsupported", "Remote-work attribute; no work_location_mode field exists.", None, None),
    "Jobpost_IsInternship": ("unsupported", "Internship flag; no internship/employment-type field exists.", None, None),
    "Jobpost_PriorityWithLocalCandidate": ("unsupported", "Employer recruitment preference; no equivalent field exists.", None, None),
    "Jobpost_ActivationTime_YEAR_MONTH": ("unsupported", "Job-ad activation month; no publication/activation date field exists.", None, None),
    "Company_AgeFromEstablishmentYear": ("unsupported", "Employer age band; no company attribute fields exist.", None, None),
    "Company_ProvinceFa": ("unsupported", "Employer location; no company-location field exists.", None, None),
    "Company_ProvinceEn": ("unsupported", "English employer-location label; no company-location field exists.", None, None),
    "Company_CityFa": ("unsupported", "Employer city; no location field exists in the registry.", None, None),
    "Company_CityEn": ("unsupported", "English employer-city label; no location field exists.", None, None),
    "Comany_CompanyOwnershipTypesFa": ("unsupported", "Employer ownership type; no company-ownership field exists.", None, None),
    "Company_CompanyOwnershipTypesEn": ("unsupported", "English employer-ownership label; no company-ownership field exists.", None, None),
    "Company_SizeFa": ("unsupported", "Employer size band; no company-size field exists.", None, None),
    "Company_SizeEn": ("unsupported", "English employer-size band; no company-size field exists.", None, None),
    "Company_ActivityTypeFa": ("unsupported", "Company operating scope/type; no corresponding field exists.", None, None),
    "Company_ActivityTypeEn": ("unsupported", "English company operating-scope label; no corresponding field exists.", None, None),
    "Company_IndustryFa": ("unsupported", "Employer industry is not the same concept as occupational job_field.", None, None),
    "Company_IndustryEn": ("unsupported", "English employer-industry label; no industry field exists.", None, None),
}

# The deterministic suffix detector finds nine pairs. This additional pair is
# included as a spelling-variant candidate; its header typo is not corrected.
_EXTRA_PAIR_CANDIDATES = [
    ("Comany_CompanyOwnershipTypesFa", "Company_CompanyOwnershipTypesEn"),
]


def _norm(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).strip().casefold()
    return " ".join(value.split())


def _pair_stats(
    left_name: str,
    right_name: str,
    rows: Iterable[dict[str, str | None]],
) -> dict[str, Any]:
    total = both = both_null = left_only_null = right_only_null = exact = 0
    left_to_right: dict[str, set[str]] = defaultdict(set)
    right_to_left: dict[str, set[str]] = defaultdict(set)
    pair_counts: Counter[tuple[str, str]] = Counter()

    for row in rows:
        total += 1
        left_raw = row.get(left_name)
        right_raw = row.get(right_name)
        left = _norm(left_raw or "")
        right = _norm(right_raw or "")
        if not left and not right:
            both_null += 1
            continue
        if not left:
            left_only_null += 1
            continue
        if not right:
            right_only_null += 1
            continue
        both += 1
        if left == right:
            exact += 1
        left_to_right[left].add(right)
        right_to_left[right].add(left)
        pair_counts[(left, right)] += 1

    left_conflict_values = {key for key, values in left_to_right.items() if len(values) > 1}
    right_conflict_values = {key for key, values in right_to_left.items() if len(values) > 1}
    left_conflict_rows = sum(count for (left, _), count in pair_counts.items() if left in left_conflict_values)
    right_conflict_rows = sum(count for (_, right), count in pair_counts.items() if right in right_conflict_values)

    return {
        "fields": [left_name, right_name],
        "rows": total,
        "both_non_null_rows": both,
        "both_null_rows": both_null,
        "left_null_right_present_rows": left_only_null,
        "right_null_left_present_rows": right_only_null,
        "exact_normalized_equal_rows": exact,
        "exact_normalized_equal_ratio": round(exact / both, 6) if both else None,
        "distinct_left_values": len(left_to_right),
        "distinct_right_values": len(right_to_left),
        "distinct_observed_value_pairs": len(pair_counts),
        "left_values_with_multiple_right_translations": len(left_conflict_values),
        "right_values_with_multiple_left_translations": len(right_conflict_values),
        "rows_in_left_to_multiple_right_conflicts": left_conflict_rows,
        "rows_in_right_to_multiple_left_conflicts": right_conflict_rows,
        "row_pair_consistency_ratio": round(
            1 - max(left_conflict_rows, right_conflict_rows) / both, 6
        ) if both else None,
        "interpretation": (
            "Consistent row-level pairing is evidence of aligned bilingual columns, "
            "not proof that every translation is semantically correct."
        ),
    }


def build_audit(
    source_profile: dict[str, Any],
    csv_path: Path | None = None,
) -> dict[str, Any]:
    columns = source_profile.get("columns")
    if not isinstance(columns, dict):
        raise ValueError("Source profile must contain a columns object.")

    missing_review = sorted(set(columns) - set(_FIELD_REVIEW))
    stale_review = sorted(set(_FIELD_REVIEW) - set(columns))
    if missing_review or stale_review:
        raise ValueError(
            f"Field review catalog mismatch; unreviewed={missing_review}, "
            f"not_in_profile={stale_review}"
        )

    registry_fields = {
        dataset_id: {
            field: config.get("type", "unknown")
            for field, config in profile.get("fields", {}).items()
        }
        for dataset_id, profile in DATASET_PROFILES.items()
    }
    deterministic = match_source_profile(source_profile, DATASET_PROFILES.values())

    field_reviews = []
    for name, stats in columns.items():
        classification, rationale, target_dataset, target_field = _FIELD_REVIEW[name]
        target_exists = (
            target_dataset in registry_fields
            and target_field in registry_fields[target_dataset]
            if target_dataset and target_field else None
        )
        field_reviews.append({
            "source_field": name,
            "source_type": stats.get("inferred_type", "unknown"),
            "non_null_count": stats.get("non_null_count"),
            "null_count": stats.get("null_count"),
            "null_ratio": stats.get("null_ratio"),
            "independent_review": classification,
            "candidate_target": (
                {"dataset_id": target_dataset, "field": target_field,
                 "registered": bool(target_exists)}
                if target_dataset and target_field else None
            ),
            "rationale": rationale,
        })

    detected_pairs = []
    for pair in detect_bilingual_field_pairs(columns):
        names = [item["name"] for item in pair["fields"]]
        detected_pairs.append((names[0], names[1]))
    all_pairs = list(detected_pairs)
    for pair in _EXTRA_PAIR_CANDIDATES:
        if pair[0] in columns and pair[1] in columns and pair not in all_pairs:
            all_pairs.append(pair)

    pair_results = []
    csv_summary: dict[str, Any] | None = None
    if csv_path is not None:
        if not csv_path.is_file():
            raise ValueError(f"CSV file does not exist: {csv_path}")
        pair_names = {name for pair in all_pairs for name in pair}
        with csv_path.open("r", encoding="utf-8-sig", newline="") as stream:
            reader = csv.DictReader(stream)
            headers = reader.fieldnames or []
            missing_headers = sorted(set(columns) - set(headers))
            extra_headers = sorted(set(headers) - set(columns))
            if missing_headers:
                raise ValueError(f"CSV is missing profiled columns: {missing_headers}")
            pair_states = {
                pair: {
                    "rows": 0, "both": 0, "both_null": 0,
                    "left_only_null": 0, "right_only_null": 0, "exact": 0,
                    "left_to_right": defaultdict(set),
                    "right_to_left": defaultdict(set),
                    "pair_counts": Counter(),
                }
                for pair in all_pairs
            }
            row_count = 0
            for row in reader:
                row_count += 1
                for left_name, right_name in all_pairs:
                    state = pair_states[(left_name, right_name)]
                    state["rows"] += 1
                    left = _norm(row.get(left_name) or "")
                    right = _norm(row.get(right_name) or "")
                    if not left and not right:
                        state["both_null"] += 1
                        continue
                    if not left:
                        state["left_only_null"] += 1
                        continue
                    if not right:
                        state["right_only_null"] += 1
                        continue
                    state["both"] += 1
                    if left == right:
                        state["exact"] += 1
                    state["left_to_right"][left].add(right)
                    state["right_to_left"][right].add(left)
                    state["pair_counts"][(left, right)] += 1
            for left_name, right_name in all_pairs:
                state = pair_states[(left_name, right_name)]
                left_conflicts = {
                    key for key, values in state["left_to_right"].items()
                    if len(values) > 1
                }
                right_conflicts = {
                    key for key, values in state["right_to_left"].items()
                    if len(values) > 1
                }
                left_conflict_rows = sum(
                    count for (left, _), count in state["pair_counts"].items()
                    if left in left_conflicts
                )
                right_conflict_rows = sum(
                    count for (_, right), count in state["pair_counts"].items()
                    if right in right_conflicts
                )
                both = state["both"]
                pair_results.append({
                    "fields": [left_name, right_name],
                    "rows": state["rows"],
                    "both_non_null_rows": both,
                    "both_null_rows": state["both_null"],
                    "left_null_right_present_rows": state["left_only_null"],
                    "right_null_left_present_rows": state["right_only_null"],
                    "exact_normalized_equal_rows": state["exact"],
                    "exact_normalized_equal_ratio": round(state["exact"] / both, 6) if both else None,
                    "distinct_left_values": len(state["left_to_right"]),
                    "distinct_right_values": len(state["right_to_left"]),
                    "distinct_observed_value_pairs": len(state["pair_counts"]),
                    "left_values_with_multiple_right_translations": len(left_conflicts),
                    "right_values_with_multiple_left_translations": len(right_conflicts),
                    "rows_in_left_to_multiple_right_conflicts": left_conflict_rows,
                    "rows_in_right_to_multiple_left_conflicts": right_conflict_rows,
                    "row_pair_consistency_ratio": round(
                        1 - max(left_conflict_rows, right_conflict_rows) / both, 6
                    ) if both else None,
                    "interpretation": (
                        "Consistent row-level pairing is evidence of aligned bilingual columns, "
                        "not proof that every translation is semantically correct."
                    ),
                })
        csv_summary = {
            "path": str(csv_path),
            "rows_read": row_count,
            "profiled_row_count": source_profile.get("row_count"),
            "row_count_matches_profile": row_count == source_profile.get("row_count"),
            "profiled_column_count": len(columns),
            "csv_column_count": len(headers),
            "extra_csv_columns": extra_headers,
            "pair_count_checked": len(pair_results),
        }

    classifications = Counter(item["independent_review"] for item in field_reviews)
    deterministic_summary = deterministic["summary"]
    return {
        "audit_version": 1,
        "source": {
            "name": source_profile.get("source_name"),
            "row_count": source_profile.get("row_count"),
            "column_count": len(columns),
        },
        "registry": {
            "dataset_count": len(DATASET_PROFILES),
            "field_count_total_across_datasets": sum(len(v) for v in registry_fields.values()),
            "fields_by_dataset": {
                dataset_id: list(fields)
                for dataset_id, fields in registry_fields.items()
            },
        },
        "coverage_summary": {
            "field_classification_counts": dict(classifications),
            "candidate_source_fields": classifications.get("candidate", 0),
            "unsupported_source_fields": classifications.get("unsupported", 0),
            "metadata_source_fields": classifications.get("metadata", 0),
            "deterministic_matcher": deterministic_summary,
            "note": (
                "Independent candidate labels are review hypotheses, not accepted mappings. "
                "No source field is approved for ingestion by this report."
            ),
        },
        "field_reviews": field_reviews,
        "deterministic_matches": deterministic["matches"],
        "bilingual_pair_candidates": [
            {
                "fields": [left, right],
                "detected_by_suffix_matcher": (left, right) in detected_pairs,
                "reason": (
                    "Suffix-based Fa/En candidate."
                    if (left, right) in detected_pairs
                    else "Additional candidate retained because one header contains a spelling variant."
                ),
                "value_equivalence_verified": False,
                "safe_to_drop": False,
            }
            for left, right in all_pairs
        ],
        "bilingual_row_level_validation": pair_results,
        "csv_validation": csv_summary,
        "policy": {
            "read_only": True,
            "schema_mutation": False,
            "source_data_mutation": False,
            "ingestion": False,
            "automatic_mapping_acceptance": False,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Read-only semantic coverage audit.")
    parser.add_argument("profile", help="Source profile JSON.")
    parser.add_argument("--csv", help="Local source CSV; required for row-level bilingual checks.")
    parser.add_argument("--output", default="semantic-coverage-audit.json")
    args = parser.parse_args()

    profile_path = Path(args.profile)
    if not profile_path.is_file():
        parser.error(f"source profile does not exist: {profile_path}")
    try:
        profile = json.loads(profile_path.read_text(encoding="utf-8"))
        report = build_audit(profile, Path(args.csv) if args.csv else None)
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError, csv.Error) as error:
        parser.error(str(error))

    output_path = Path(args.output)
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    summary = report["coverage_summary"]
    print(json.dumps({
        "status": "completed",
        "source_fields": report["source"]["column_count"],
        "independent_classifications": summary["field_classification_counts"],
        "deterministic_matcher": summary["deterministic_matcher"],
        "bilingual_pairs_checked": len(report["bilingual_row_level_validation"]),
        "csv_validation": report["csv_validation"],
        "report_path": str(output_path),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
