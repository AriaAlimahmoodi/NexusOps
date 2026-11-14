"""Validated ingestion boundary for provenance-backed real datasets.

Existing synthetic indexes are never write targets. Source adapters normalize
their source data into Registry contracts before records reach this module.
"""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

from tools.data_governance import _timestamp
from tools.data_normalization import normalize_real_record
from tools.dataset_registry import get_dataset_index, get_dataset_profile


MANIFEST_REQUIRED_FIELDS = (
    "collection_batch", "source_name", "source_url", "publisher",
    "retrieved_at", "geographic_scope", "license",
    "collection_method", "limitations",
)


def validate_collection_manifest(manifest, records):
    issues = []
    for field in MANIFEST_REQUIRED_FIELDS:
        value = manifest.get(field)
        if not isinstance(value, str) or not value.strip():
            issues.append({
                "code": "MISSING_MANIFEST_FIELD",
                "field": field,
                "message": f"Collection manifest field '{field}' is required.",
            })
    retrieved_at = manifest.get("retrieved_at")
    if retrieved_at and _timestamp(retrieved_at) is None:
        issues.append({
            "code": "INVALID_MANIFEST_TIMESTAMP",
            "field": "retrieved_at",
            "message": "'retrieved_at' must be ISO-8601 with an explicit timezone.",
        })
    batch_id = manifest.get("collection_batch")
    if isinstance(batch_id, str) and batch_id.strip():
        for position, record in enumerate(records):
            if not isinstance(record, Mapping):
                continue
            if record.get("collection_batch") != batch_id:
                issues.append({
                    "code": "COLLECTION_BATCH_MISMATCH",
                    "field": "collection_batch",
                    "record_id": str(record.get("id") or position),
                    "message": "Every record must match the manifest collection_batch.",
                })
    return issues


def prepare_real_records(dataset_id, records, manifest):
    """Validate and normalize the whole batch before returning documents."""
    profile = get_dataset_profile(dataset_id)
    if not isinstance(manifest, Mapping):
        raise ValueError("Collection manifest must be a JSON object.")
    if not isinstance(records, Sequence) or isinstance(records, (str, bytes)) or not records:
        raise ValueError("At least one record is required for ingestion.")

    issues = validate_collection_manifest(manifest, records)
    id_fields = profile.get("document_id_fields") or (
        [profile["primary_key"]] if profile.get("primary_key") else []
    )
    seen_ids = set()
    prepared = []

    for position, record in enumerate(records):
        if not isinstance(record, Mapping):
            issues.append({
                "code": "INVALID_RECORD",
                "record_id": str(position),
                "message": "Each record must be a JSON object.",
            })
            continue

        identity_values = [record.get(field) for field in id_fields]
        record_id = (
            "::".join(
                str(value).strip()
                for value in identity_values
                if value is not None and str(value).strip()
            )
            or str(position)
        )

        normalized, record_issues = normalize_real_record(
            dataset_id, record, record_id=record_id
        )
        issues.extend(record_issues)

        if id_fields:
            key_values = [normalized.get(field) for field in id_fields]
            if any(
                not isinstance(value, (str, int))
                or isinstance(value, bool)
                or not str(value).strip()
                for value in key_values
            ):
                issues.append({
                    "code": "MISSING_PRIMARY_KEY",
                    "field": ",".join(id_fields),
                    "record_id": record_id,
                    "message": f"Document identity fields {id_fields} are required.",
                })
            else:
                normalized_id = "::".join(
                    str(value).strip() for value in key_values
                )
                if normalized_id in seen_ids:
                    issues.append({
                        "code": "DUPLICATE_PRIMARY_KEY",
                        "field": ",".join(id_fields),
                        "record_id": normalized_id,
                        "message": "Duplicate document identity in the collection batch.",
                    })
                seen_ids.add(normalized_id)

        prepared.append(normalized)

    if issues:
        error = ValueError(
            f"Real-data batch rejected with {len(issues)} validation issue(s)."
        )
        error.issues = issues
        raise error
    return prepared


def ingest_real_records(client, dataset_id, records, manifest):
    """Publish a validated real-data batch through the atomic Registry alias."""
    # Lazy import avoids a module cycle: the publisher reuses this module's
    # manifest validation contract.
    from tools.atomic_data_publisher import ingest_real_records_atomically

    return ingest_real_records_atomically(
        client, dataset_id, records, manifest
    )
