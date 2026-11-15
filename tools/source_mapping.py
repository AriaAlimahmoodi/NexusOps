"""Explicit, reviewed source-to-canonical field projection.

This module performs name-based projection only. It never infers semantic
equivalence, converts values, fills missing fields, or changes Registry schemas.
"""
from __future__ import annotations

from collections.abc import Iterable, Iterator, Mapping
from dataclasses import dataclass, field
from datetime import datetime
from types import MappingProxyType
from typing import Any

from tools.dataset_registry import get_dataset_profile


@dataclass(frozen=True, slots=True)
class SourceMappingSpec:
    """Immutable record of an explicitly reviewed field-name mapping."""

    mapping_id: str
    dataset_id: str
    source_name: str
    field_mappings: Mapping[str, str]
    reviewed_by: str
    reviewed_at: str
    review_reference: str
    version: int = 1

    def __post_init__(self) -> None:
        for name in (
            "mapping_id", "dataset_id", "source_name",
            "reviewed_by", "reviewed_at", "review_reference",
        ):
            value = getattr(self, name)
            if not isinstance(value, str) or not value.strip():
                raise ValueError(f"{name} must be a non-empty string.")

        if (
            not isinstance(self.version, int)
            or isinstance(self.version, bool)
            or self.version < 1
        ):
            raise ValueError("version must be a positive integer.")

        try:
            reviewed_at = datetime.fromisoformat(
                self.reviewed_at.strip().replace("Z", "+00:00")
            )
        except ValueError as exc:
            raise ValueError(
                "reviewed_at must be an ISO-8601 timestamp with a timezone."
            ) from exc
        if reviewed_at.tzinfo is None or reviewed_at.utcoffset() is None:
            raise ValueError(
                "reviewed_at must be an ISO-8601 timestamp with a timezone."
            )

        if not isinstance(self.field_mappings, Mapping) or not self.field_mappings:
            raise ValueError("field_mappings must be a non-empty mapping.")

        profile = get_dataset_profile(self.dataset_id)
        allowed_targets = set(profile.get("fields", {}))
        provenance = profile.get("provenance_contract", {})
        allowed_targets.update(provenance.get("required_fields", []))
        allowed_targets.update(provenance.get("optional_fields", []))

        copied: dict[str, str] = {}
        for source_field, target_field in self.field_mappings.items():
            if not isinstance(source_field, str) or not source_field.strip():
                raise ValueError("Source field names must be non-empty strings.")
            if not isinstance(target_field, str) or not target_field.strip():
                raise ValueError("Canonical target field names must be non-empty strings.")
            if target_field not in allowed_targets:
                raise ValueError(
                    f"Target field '{target_field}' is not part of the "
                    f"'{self.dataset_id}' canonical or provenance contract."
                )
            if target_field == "data_classification":
                raise ValueError(
                    "data_classification is assigned by canonical normalization "
                    "and cannot be source-mapped."
                )
            if target_field in copied.values():
                raise ValueError(
                    f"Multiple source fields cannot map to '{target_field}'."
                )
            copied[source_field] = target_field

        object.__setattr__(
            self, "field_mappings", MappingProxyType(copied)
        )


def map_source_record(
    record: Mapping[str, Any],
    mapping_spec: SourceMappingSpec,
) -> dict[str, Any]:
    """Project one raw record using only explicitly declared field names.

    Unmapped source fields are discarded. Missing source fields remain absent;
    values, including nulls, are copied without conversion or interpretation.
    """
    if not isinstance(mapping_spec, SourceMappingSpec):
        raise TypeError("mapping_spec must be a SourceMappingSpec instance.")
    if not isinstance(record, Mapping):
        raise TypeError("Each source record must be a mapping.")

    return {
        target_field: record[source_field]
        for source_field, target_field in mapping_spec.field_mappings.items()
        if source_field in record
    }


def iter_mapped_records(
    records: Iterable[Mapping[str, Any]],
    mapping_spec: SourceMappingSpec,
) -> Iterator[dict[str, Any]]:
    """Lazily project a one-pass source iterator without buffering records."""
    if not isinstance(mapping_spec, SourceMappingSpec):
        raise TypeError("mapping_spec must be a SourceMappingSpec instance.")

    for position, record in enumerate(records):
        try:
            yield map_source_record(record, mapping_spec)
        except TypeError as exc:
            raise TypeError(
                f"Invalid source record at position {position}: {exc}"
            ) from exc
