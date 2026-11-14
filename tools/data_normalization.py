"""Source-independent normalization into NexusOps canonical dataset contracts.

Source adapters must map their source-specific columns before calling this
module. This module never changes the Registry schema to accommodate a source.
"""
from __future__ import annotations

import math
from collections.abc import Mapping
from datetime import datetime
from typing import Any

from tools.data_governance import validate_record_provenance
from tools.dataset_registry import get_dataset_profile


def _issue(code: str, message: str, *, field: str | None = None,
           record_id: str | None = None) -> dict[str, str]:
    result = {"code": code, "message": message}
    if field:
        result["field"] = field
    if record_id:
        result["record_id"] = record_id
    return result


def _normalize_value(value: Any, field: str, field_type: str) -> tuple[Any, str | None]:
    if value is None:
        return None, None

    if field_type in {"keyword", "text"}:
        if isinstance(value, str):
            normalized = value.strip()
            if not normalized:
                return None, f"Field '{field}' cannot be an empty string."
            return normalized, None
        if field_type == "keyword" and isinstance(value, list):
            normalized_values = []
            for item in value:
                if not isinstance(item, str) or not item.strip():
                    return None, f"Every value in '{field}' must be a non-empty string."
                normalized_values.append(item.strip())
            return normalized_values, None
        return None, f"Field '{field}' must be a string" + (
            " or an array of strings." if field_type == "keyword" else "."
        )

    if field_type == "integer":
        if isinstance(value, bool):
            return None, f"Field '{field}' must be an integer, not a boolean."
        try:
            number = float(value)
        except (TypeError, ValueError, OverflowError):
            return None, f"Field '{field}' must be an integer."
        if not math.isfinite(number) or not number.is_integer():
            return None, f"Field '{field}' must be a finite integer."
        return int(number), None

    if field_type in {"float", "double", "scaled_float", "half_float"}:
        if isinstance(value, bool):
            return None, f"Field '{field}' must be numeric, not a boolean."
        try:
            number = float(value)
        except (TypeError, ValueError, OverflowError):
            return None, f"Field '{field}' must be numeric."
        if not math.isfinite(number):
            return None, f"Field '{field}' must be finite."
        return number, None

    if field_type == "boolean":
        if isinstance(value, bool):
            return value, None
        if isinstance(value, str):
            normalized = value.strip().casefold()
            if normalized in {"true", "1", "yes"}:
                return True, None
            if normalized in {"false", "0", "no"}:
                return False, None
        if isinstance(value, int) and value in (0, 1):
            return bool(value), None
        return None, f"Field '{field}' must be a boolean."

    if field_type == "date":
        if not isinstance(value, str):
            return None, f"Field '{field}' must be an ISO-8601 date string."
        try:
            parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
        except ValueError:
            return None, f"Field '{field}' must be an ISO-8601 date string."
        return parsed.isoformat(), None

    if field_type in {"object", "nested"}:
        if isinstance(value, Mapping):
            return dict(value), None
        return None, f"Field '{field}' must be an object."

    return None, f"Registry field '{field}' has unsupported canonical type '{field_type}'."


def normalize_real_record(
    dataset_id: str,
    record: Mapping[str, Any],
    *,
    record_id: str | None = None,
) -> tuple[dict[str, Any], list[dict[str, str]]]:
    """Normalize one source-adapted record against its registered schema.

    The returned document contains only canonical Registry fields plus the
    real-data classification marker. Unknown source fields are rejected rather
    than silently indexed or discarded.
    """
    if not isinstance(record, Mapping):
        return {}, [_issue("INVALID_RECORD", "Each record must be a mapping.", record_id=record_id)]

    profile = get_dataset_profile(dataset_id)
    fields = profile.get("fields", {})
    allowed_fields = set(fields) | {"data_classification"}
    issues: list[dict[str, str]] = []
    normalized: dict[str, Any] = {}

    for field in record:
        if field not in allowed_fields:
            issues.append(_issue(
                "UNKNOWN_DATASET_FIELD",
                f"Field '{field}' is not registered for dataset '{dataset_id}'.",
                field=str(field),
                record_id=record_id,
            ))

    for field, field_config in fields.items():
        if field not in record:
            continue
        value, error = _normalize_value(
            record[field], field, str(field_config.get("type", ""))
        )
        if error:
            issues.append(_issue(
                "INVALID_FIELD_TYPE", error, field=field, record_id=record_id
            ))
        else:
            normalized[field] = value

    for field in profile.get("validation", {}).get("required_fields", []):
        value = normalized.get(field)
        if value is None or (isinstance(value, str) and not value.strip()):
            issues.append(_issue(
                "MISSING_DATA_FIELD",
                f"Required dataset field '{field}' is missing or empty.",
                field=field,
                record_id=record_id,
            ))

    ranges = profile.get("validation", {}).get("expected_numeric_ranges", {})
    for field, bounds in ranges.items():
        if field not in normalized or normalized[field] is None:
            continue
        value = normalized[field]
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            continue  # The type validator already reports the invalid value.
        minimum = bounds.get("min")
        maximum = bounds.get("max")
        if minimum is not None and value < minimum:
            issues.append(_issue(
                "NUMERIC_VALUE_OUT_OF_RANGE",
                f"Field '{field}' is below its registered minimum ({minimum}).",
                field=field,
                record_id=record_id,
            ))
        if maximum is not None and value > maximum:
            issues.append(_issue(
                "NUMERIC_VALUE_OUT_OF_RANGE",
                f"Field '{field}' exceeds its registered maximum ({maximum}).",
                field=field,
                record_id=record_id,
            ))

    supplied_classification = record.get("data_classification")
    if supplied_classification not in (None, "real"):
        issues.append(_issue(
            "CLASSIFICATION_CONFLICT",
            "Real ingestion rejects records classified as non-real.",
            field="data_classification",
            record_id=record_id,
        ))

    issues.extend(validate_record_provenance(normalized, record_id=record_id))
    normalized["data_classification"] = "real"
    return normalized, issues
