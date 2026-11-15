"""Read-only preflight for a source using an explicit reviewed field mapping.

This composes adapter dispatch, source projection, and canonical preflight over
one streaming pass. It never writes to Elasticsearch or authorizes publication.
"""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from tools.adapters.base import SourceSpec
from tools.ingestion_preflight import audit_canonical_record_stream
from tools.source_mapping import SourceMappingSpec, iter_mapped_records


def audit_source_ingestion_preflight(
    dataset_id: str,
    format_name: str,
    source: SourceSpec,
    manifest: Mapping[str, Any],
    *,
    mapping_spec: SourceMappingSpec,
    adapter_registry=None,
    max_issue_samples: int = 100,
) -> dict[str, Any]:
    """Read, explicitly map, and audit one source stream without publication.

    The mapping must identify the requested dataset and the same source_name
    declared by the collection manifest. Those checks happen before the
    adapter is invoked. The raw source is consumed once; records are projected
    lazily and passed directly to the canonical preflight auditor.
    """
    if not isinstance(source, SourceSpec):
        raise TypeError("source must be a SourceSpec instance.")
    if not isinstance(manifest, Mapping):
        raise TypeError("manifest must be a mapping.")
    if not isinstance(mapping_spec, SourceMappingSpec):
        raise TypeError("mapping_spec must be a SourceMappingSpec instance.")
    if mapping_spec.dataset_id != dataset_id:
        raise ValueError(
            "mapping_spec dataset_id does not match the preflight dataset."
        )
    if manifest.get("source_name") != mapping_spec.source_name:
        raise ValueError(
            "manifest source_name must match mapping_spec source_name."
        )

    if adapter_registry is None:
        from tools.adapters.registry import create_default_adapter_registry

        adapter_registry = create_default_adapter_registry()

    raw_records = adapter_registry.iter_records(format_name, source)
    mapped_records = iter_mapped_records(raw_records, mapping_spec)
    report = audit_canonical_record_stream(
        dataset_id,
        mapped_records,
        manifest,
        max_issue_samples=max_issue_samples,
    )

    report.update({
        "preflight_scope": "adapter_to_reviewed_mapping_to_canonical_contract",
        "format_name": format_name,
        "mapping_applied": True,
        "mapping_id": mapping_spec.mapping_id,
        "mapping_version": mapping_spec.version,
        "mapping_source_name": mapping_spec.source_name,
        "mapping_review_reference": mapping_spec.review_reference,
        "ingestion_authorized": False,
        "elasticsearch_write_performed": False,
        "alias_changed": False,
    })
    return report
