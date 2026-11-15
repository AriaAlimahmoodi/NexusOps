"""Read-only assessment of a raw source against a canonical Dataset Registry profile.

This module compares exact field names and observed physical types only. It does
not infer semantic mappings, change Registry contracts, or authorize ingestion.
"""
from __future__ import annotations

from typing import Any

from tools.dataset_registry import get_dataset_profile
from tools.source_discovery import profile_source


_DATE_FIELDS = {"observed_at", "published_at", "valid_from", "valid_until"}


def _expected_type(field: str, config: dict[str, Any] | None) -> str:
    if config is not None:
        return str(config.get("type", ""))
    return "date" if field in _DATE_FIELDS else "keyword"


def _type_status(
    expected: str,
    observed: dict[str, Any],
) -> str:
    actual = observed.get("inferred_type", "unknown")
    if actual in {"unknown", "mixed"}:
        return "not_assessable"

    compatible = {
        "keyword": {"string"},
        "text": {"string"},
        "integer": {"integer"},
        "float": {"integer", "float"},
        "double": {"integer", "float"},
        "scaled_float": {"integer", "float"},
        "half_float": {"integer", "float"},
        "boolean": {"boolean"},
        "date": {"date", "datetime"},
        "object": {"json_object"},
        "nested": {"json_object"},
    }

    if expected == "keyword" and actual == "json_array":
        item_types = set(observed.get("json_array_item_types", {}))
        return "compatible" if item_types == {"str"} else "mismatch"

    if expected not in compatible:
        return "not_assessable"
    return "compatible" if actual in compatible[expected] else "mismatch"


def assess_source_compatibility(
    dataset_id: str,
    format_name: str,
    source,
    *,
    adapter_registry=None,
    source_name: str | None = None,
    sample_limit: int = 5,
    top_values_limit: int = 10,
    max_distinct_values: int = 1000,
) -> dict[str, Any]:
    """Profile a source and compare exact field names with a Registry contract.

    The source is read once through the selected adapter. Exact-name matches
    are candidates for manual review, not approved semantic mappings.
    """
    from tools.adapters.base import SourceSpec

    if not isinstance(source, SourceSpec):
        raise TypeError("source must be a SourceSpec instance.")

    dataset_profile = get_dataset_profile(dataset_id)
    source_profile = profile_source(
        format_name,
        source,
        adapter_registry=adapter_registry,
        source_name=source_name,
        sample_limit=sample_limit,
        top_values_limit=top_values_limit,
        max_distinct_values=max_distinct_values,
    )

    dataset_fields = dataset_profile.get("fields", {})
    provenance = dataset_profile.get("provenance_contract", {})
    required_provenance = set(provenance.get("required_fields", []))
    optional_provenance = set(provenance.get("optional_fields", []))
    supported_fields = set(dataset_fields) | required_provenance | optional_provenance

    required_fields = (
        set(dataset_profile.get("validation", {}).get("required_fields", []))
        | required_provenance
    )
    observed_columns = source_profile["columns"]
    observed_fields = set(observed_columns)

    exact_matches = sorted(observed_fields & supported_fields)
    missing_required = sorted(required_fields - observed_fields)
    unsupported_source_fields = sorted(observed_fields - supported_fields)

    type_assessments = []
    for field in exact_matches:
        config = dataset_fields.get(field)
        expected = _expected_type(field, config)
        observed = observed_columns[field]
        type_assessments.append({
            "field": field,
            "expected_type": expected,
            "observed_type": observed.get("inferred_type", "unknown"),
            "status": _type_status(expected, observed),
        })

    return {
        "assessment_version": 1,
        "dataset_id": dataset_id,
        "format_name": format_name,
        "source_profile": source_profile,
        "source_field_count": len(observed_fields),
        "registry_supported_field_count": len(supported_fields),
        "exact_name_matches": exact_matches,
        "missing_required_fields": missing_required,
        "unsupported_source_fields": unsupported_source_fields,
        "type_assessments": type_assessments,
        "summary": {
            "exact_name_match_count": len(exact_matches),
            "missing_required_field_count": len(missing_required),
            "unsupported_source_field_count": len(unsupported_source_fields),
            "type_mismatch_count": sum(
                item["status"] == "mismatch" for item in type_assessments
            ),
            "type_not_assessable_count": sum(
                item["status"] == "not_assessable" for item in type_assessments
            ),
        },
        "semantic_mapping_performed": False,
        "ingestion_authorized": False,
        "decision": "manual_review_required",
    }
