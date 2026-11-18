"""Read-only comparison of physical source fields with a canonical dataset."""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from tools.dataset_registry import get_dataset_profile


_SOURCE_TYPES_BY_TARGET = {
    "keyword": {"string"},
    "text": {"string"},
    "integer": {"integer"},
    "long": {"integer"},
    "short": {"integer"},
    "byte": {"integer"},
    "float": {"integer", "float"},
    "double": {"integer", "float"},
    "scaled_float": {"integer", "float"},
    "half_float": {"integer", "float"},
    "boolean": {"boolean"},
    "date": {"date", "datetime"},
    "object": {"json_object"},
    "nested": {"json_object"},
}

# Provenance is a separate registry contract, not part of the dataset's
# analytical fields. It still has a physical representation when supplied
# by the source and must be assessed with the same type discipline.
_PROVENANCE_FIELD_TYPES = {
    "source": "keyword",
    "observed_at": "date",
    "published_at": "date",
    "collection_batch": "keyword",
    "time_granularity": "keyword",
    "valid_from": "date",
    "valid_until": "date",
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

    validation = profile.get("validation", {})
    required_dataset = set(validation.get("required_fields", []))
    provenance = profile.get("provenance_contract", {})
    required_provenance = set(provenance.get("required_fields", []))
    optional_provenance = set(provenance.get("optional_fields", []))

    results = []
    for source_name, stats in columns.items():
        if not isinstance(source_name, str) or not isinstance(stats, Mapping):
            raise ValueError("Source profile columns contain an invalid entry.")

        target = fields.get(source_name)
        is_provenance_field = source_name in _PROVENANCE_FIELD_TYPES
        target_type = (
            target.get("type")
            if isinstance(target, Mapping)
            else _PROVENANCE_FIELD_TYPES.get(source_name)
        )
        source_type = stats.get("inferred_type", "unknown")

        if target_type is None:
            compatible = None
        elif source_type in {"unknown", "mixed", None}:
            compatible = None
        else:
            compatible = source_type in _SOURCE_TYPES_BY_TARGET.get(
                target_type, set()
            )

        results.append({
            "source_field": source_name,
            "source_type": source_type,
            "same_name_target_exists": target is not None or is_provenance_field,
            "target_type": target_type,
            "same_name_type_compatible": compatible,
            "field_class": "provenance" if is_provenance_field else (
                "dataset" if target is not None else "unmatched"
            ),
            "mapping_required": True,
        })

    present = set(columns)
    compatible_count = sum(
        item["same_name_type_compatible"] is True for item in results
    )
    incompatible_count = sum(
        item["same_name_type_compatible"] is False for item in results
    )
    unknown_count = sum(
        item["same_name_type_compatible"] is None for item in results
    )

    missing_required_dataset = sorted(required_dataset - present)
    missing_required_provenance = sorted(required_provenance - present)
    missing_required = sorted(
        set(missing_required_dataset) | set(missing_required_provenance)
    )
    missing_optional_provenance = sorted(optional_provenance - present)

    decision = (
        "incompatible"
        if missing_required or incompatible_count
        else "partially_compatible"
        if unknown_count
        else "compatible"
    )
    return {
        "compatibility_version": 2,
        "dataset_id": dataset_id,
        "source_name": source_profile.get("source_name"),
        "same_name_type_compatible_count": compatible_count,
        "same_name_type_incompatible_count": incompatible_count,
        "unmatched_or_unknown_count": unknown_count,
        "required_dataset_fields": sorted(required_dataset),
        "required_provenance_fields": sorted(required_provenance),
        "missing_required_dataset_fields": missing_required_dataset,
        "missing_required_provenance_fields": missing_required_provenance,
        "missing_required_fields": missing_required,
        "optional_provenance_fields_not_present": missing_optional_provenance,
        "decision": decision,
        "fields": results,
        "mapping_created": False,
        "registry_mutated": False,
    }
