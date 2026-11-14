"""Read-only data provenance and university-market mapping audits for Phase 8."""
from __future__ import annotations

import math
from datetime import datetime
from typing import Any, Iterable, Mapping


REQUIRED_PROVENANCE_FIELDS = ("source", "observed_at", "collection_batch", "time_granularity")
OPTIONAL_PROVENANCE_FIELDS = ("published_at", "valid_from", "valid_until")
DEFAULT_GAP_TOLERANCE = 1e-6


def _timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        return None
    return parsed


def _issue(code: str, message: str, *, field: str | None = None,
           record_id: str | None = None) -> dict[str, str]:
    result = {"code": code, "message": message}
    if field:
        result["field"] = field
    if record_id:
        result["record_id"] = record_id
    return result


def validate_record_provenance(
    record: Mapping[str, Any],
    *,
    record_id: str | None = None,
) -> list[dict[str, str]]:
    """Validate traceability metadata without modifying or enriching a record.

    Missing required metadata is reported separately from malformed metadata:
    legacy records are unverified, not silently treated as source-backed.
    """
    issues: list[dict[str, str]] = []
    for field in REQUIRED_PROVENANCE_FIELDS:
        value = record.get(field)
        if not isinstance(value, str) or not value.strip():
            issues.append(_issue(
                "MISSING_PROVENANCE_FIELD",
                f"Required provenance field '{field}' is missing or empty.",
                field=field,
                record_id=record_id,
            ))

    observed_raw = record.get("observed_at")
    observed = _timestamp(observed_raw)
    if isinstance(observed_raw, str) and observed_raw.strip() and observed is None:
        issues.append(_issue(
            "INVALID_TIMESTAMP",
            "'observed_at' must be an ISO-8601 timestamp with an explicit timezone.",
            field="observed_at",
            record_id=record_id,
        ))

    published_raw = record.get("published_at")
    published = _timestamp(published_raw) if published_raw is not None else None
    if published_raw is not None and published is None:
        issues.append(_issue(
            "INVALID_TIMESTAMP",
            "'published_at', when supplied, must be an ISO-8601 timestamp with an explicit timezone.",
            field="published_at",
            record_id=record_id,
        ))
    if observed is not None and published is not None and published > observed:
        issues.append(_issue(
            "PUBLICATION_AFTER_OBSERVATION",
            "'published_at' cannot be later than 'observed_at'.",
            field="published_at",
            record_id=record_id,
        ))
    validity_values = {field: _timestamp(record.get(field)) for field in ("valid_from", "valid_until")}
    supplied_validity = {field for field in validity_values if record.get(field) is not None}
    if supplied_validity and supplied_validity != {"valid_from", "valid_until"}:
        issues.append(_issue("INCOMPLETE_VALIDITY_WINDOW", "'valid_from' and 'valid_until' must be supplied together.", field="valid_from" if "valid_from" not in supplied_validity else "valid_until", record_id=record_id))
    for field, parsed in validity_values.items():
        if record.get(field) is not None and parsed is None:
            issues.append(_issue("INVALID_TIMESTAMP", f"'{field}' must be ISO-8601 with an explicit timezone.", field=field, record_id=record_id))
    valid_from, valid_until = validity_values["valid_from"], validity_values["valid_until"]
    if valid_from is not None and valid_until is not None and valid_until < valid_from:
        issues.append(_issue("INVALID_VALIDITY_WINDOW", "'valid_until' cannot be earlier than 'valid_from'.", field="valid_until", record_id=record_id))
    return issues


def audit_dataset_provenance(
    records: Iterable[Mapping[str, Any]],
    *,
    dataset_id: str,
    classification: str = "real",
) -> dict[str, Any]:
    """Audit real provenance; keep synthetic fixtures explicitly separate."""
    if classification not in {"synthetic", "real"}:
        raise ValueError("classification must be 'synthetic' or 'real'.")
    if classification == "synthetic":
        total = sum(1 for _ in records)
        return {
            "dataset_id": dataset_id, "classification": "synthetic",
            "total_records": total, "verified_records": 0,
            "unverified_records": 0, "invalid_records": 0,
            "synthetic_records": total, "provenance_coverage": None,
            "issues": [],
        }
    total = verified = unverified = invalid = 0
    issues: list[dict[str, str]] = []

    for index, record in enumerate(records):
        total += 1
        record_id = str(record.get("_id") or record.get("id") or index)
        record_issues = validate_record_provenance(record, record_id=record_id)
        if not record_issues:
            verified += 1
            continue
        malformed = any(
            item["code"] != "MISSING_PROVENANCE_FIELD"
            for item in record_issues
        )
        if malformed:
            invalid += 1
        else:
            unverified += 1
        issues.extend(record_issues)

    return {
        "dataset_id": dataset_id,
        "classification": "real",
        "total_records": total,
        "synthetic_records": 0,
        "verified_records": verified,
        "unverified_records": unverified,
        "invalid_records": invalid,
        "provenance_coverage": (verified / total) if total else None,
        "issues": issues,
    }


def _number(value: Any) -> bool:
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(float(value))
    )


def audit_skill_mapping(
    mappings: Iterable[Mapping[str, Any]],
    courses: Iterable[Mapping[str, Any]],
    market_records: Iterable[Mapping[str, Any]],
    *,
    gap_tolerance: float = DEFAULT_GAP_TOLERANCE,
) -> dict[str, Any]:
    """Cross-check skill mappings against course and market reference records.

    University-Market Gap is defined as market_demand - course_coverage.
    It is signed: positive values indicate demand exceeds represented course
    coverage; negative values indicate represented coverage exceeds demand.
    """
    if not _number(gap_tolerance) or gap_tolerance < 0:
        raise ValueError("gap_tolerance must be a finite non-negative number.")

    course_names: dict[str, set[str]] = {}
    for course in courses:
        course_id = course.get("course_id")
        course_name = course.get("course_name")
        if isinstance(course_id, str) and course_id.strip():
            course_names.setdefault(course_id, set()).add(
                str(course_name).strip() if course_name is not None else ""
            )

    market_skills = {
        str(item.get("skill")).strip().casefold()
        for item in market_records
        if isinstance(item.get("skill"), str) and item.get("skill").strip()
    }

    total = valid = 0
    issues: list[dict[str, str]] = []
    seen_pairs: set[tuple[str, str]] = set()

    for index, mapping in enumerate(mappings):
        total += 1
        record_id = str(mapping.get("_id") or mapping.get("id") or index)
        row_issues: list[dict[str, str]] = []
        skill = mapping.get("skill")
        course_id = mapping.get("course_id")
        course_name = mapping.get("course_name")

        if not isinstance(skill, str) or not skill.strip():
            row_issues.append(_issue("MISSING_SKILL", "Mapping skill is missing.", field="skill", record_id=record_id))
        elif skill.strip().casefold() not in market_skills:
            row_issues.append(_issue("UNKNOWN_MARKET_SKILL", "Mapped skill has no matching labor-market reference record.", field="skill", record_id=record_id))

        if not isinstance(course_id, str) or not course_id.strip():
            row_issues.append(_issue("MISSING_COURSE_ID", "Mapping course_id is missing.", field="course_id", record_id=record_id))
        elif course_id not in course_names:
            row_issues.append(_issue("UNKNOWN_COURSE", "Mapped course_id does not exist in university_courses.", field="course_id", record_id=record_id))
        elif str(course_name or "").strip() not in course_names[course_id]:
            row_issues.append(_issue("COURSE_NAME_MISMATCH", "Mapped course_name does not match the referenced course_id.", field="course_name", record_id=record_id))

        if isinstance(skill, str) and isinstance(course_id, str):
            pair = (skill.strip().casefold(), course_id.strip())
            if pair in seen_pairs:
                row_issues.append(_issue("DUPLICATE_SKILL_COURSE_MAPPING", "Duplicate skill/course mapping pair.", record_id=record_id))
            seen_pairs.add(pair)

        numeric_fields = ("course_coverage", "market_demand", "market_gap")
        numeric = {}
        for field in numeric_fields:
            value = mapping.get(field)
            if not _number(value):
                row_issues.append(_issue("INVALID_MAPPING_METRIC", f"'{field}' must be a finite number.", field=field, record_id=record_id))
            else:
                numeric[field] = float(value)

        if len(numeric) == len(numeric_fields):
            expected_gap = numeric["market_demand"] - numeric["course_coverage"]
            if not math.isclose(numeric["market_gap"], expected_gap, rel_tol=0.0, abs_tol=gap_tolerance):
                row_issues.append(_issue(
                    "MARKET_GAP_FORMULA_MISMATCH",
                    "market_gap must equal market_demand - course_coverage within the configured tolerance.",
                    field="market_gap",
                    record_id=record_id,
                ))

        if row_issues:
            issues.extend(row_issues)
        else:
            valid += 1

    return {
        "dataset_id": "skill_mapping",
        "total_records": total,
        "valid_records": valid,
        "invalid_records": total - valid,
        "mapping_validity": (valid / total) if total else None,
        "gap_definition": "market_gap = market_demand - course_coverage",
        "gap_tolerance": gap_tolerance,
        "issues": issues,
    }
