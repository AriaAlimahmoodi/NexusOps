"""Read-only comparison of physical source fields with a canonical dataset."""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from tools.dataset_registry import get_dataset_profile


_SOURCE_TYPES_BY_TARGET = {
    "keyword": {"string"}, "text": {"string"},
    "integer": {"integer"}, "long": {"integer"},
    "short": {"integer"}, "byte": {"integer"},
    "float": {"integer", "float"}, "double": {"integer", "float"},
    "scaled_float": {"integer", "float"}, "half_float": {"integer", "float"},
    "boolean": {"boolean"}, "date": {"date", "datetime"},
    "object": {"json_object"}, "nested": {"json_object"},
}


def analyze_dataset_compatibility(
    source_profile: Mapping[str, Any], dataset_id: str
) -> dict[str, Any]:
    """Report exact-name physical compatibility; never creates mappings."""
    if not isinstance(source_profile, Mapping):
        raise TypeError("source_profile must be a mapping.")
    columns = source_profile.get("columns")
    if not isinstance(columns, Mapping) or not columns:
        raise ValueError("source_profile.columns must be a non-empty mapping.")

    profile = get_dataset_profile(dataset_id)
    fields = profile.get("fields", {})
    if not isinstance(fields, Mapping):
        raise ValueError("Registered dataset fields must be a mapping.")
    provenance = profile.get("provenance_contract", {})
    required = set(provenance.get("required_fields", []))
    optional = set(provenance.get("optional_fields", []))
    required.update(
        name for name, spec in fields.items()
        if isinstance(spec, Mapping) and spec.get("required") is True
    )

    results = []
    for source_name, stats in columns.items():
        if not isinstance(source_name, str) or not isinstance(stats, Mapping):
            raise ValueError("Source profile columns contain an invalid entry.")
        target = fields.get(source_name)
        source_type = stats.get("inferred_type", "unknown")
        target_type = target.get("type") if isinstance(target, Mapping) else None
        compatible = (
            source_type in _SOURCE_TYPES_BY_TARGET.get(target_type, set())
            if target_type is not None else None
        )
        results.append({
            "source_field": source_name,
            "source_type": source_type,
            "same_name_target_exists": target is not None,
            "same_name_type_compatible": compatible,
            "mapping_required": True,
        })

    present = set(columns)
    compatible_count = sum(x["same_name_type_compatible"] is True for x in results)
    incompatible_count = sum(x["same_name_type_compatible"] is False for x in results)
    unknown_count = sum(x["same_name_type_compatible"] is None for x in results)
    missing_required = sorted(required - present)
    decision = (
        "incompatible" if missing_required or incompatible_count
        else "partially_compatible" if unknown_count
        else "compatible"
    )
    return {
        "compatibility_version": 1,
        "dataset_id": dataset_id,
        "source_name": source_profile.get("source_name"),
        "same_name_type_compatible_count": compatible_count,
        "same_name_type_incompatible_count": incompatible_count,
        "unmatched_or_unknown_count": unknown_count,
        "missing_required_fields": missing_required,
        "optional_provenance_fields_not_present": sorted(optional - present),
        "decision": decision,
        "fields": results,
        "mapping_created": False,
        "registry_mutated": False,
    }
