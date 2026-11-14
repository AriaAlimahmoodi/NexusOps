"""Validated ingestion boundary for provenance-backed real datasets.

Existing synthetic indexes are never write targets. Every accepted batch is
written only to its registered '<dataset_id>_real' index.
"""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

from elasticsearch.helpers import bulk

from tools.data_governance import _timestamp, validate_record_provenance
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
    """Validate the whole batch before returning any document for indexing."""
    profile = get_dataset_profile(dataset_id)
    if not isinstance(manifest, Mapping):
        raise ValueError("Collection manifest must be a JSON object.")
    if not isinstance(records, Sequence) or isinstance(records, (str, bytes)) or not records:
        raise ValueError("At least one record is required for ingestion.")

    issues = validate_collection_manifest(manifest, records)
    id_fields = profile.get("document_id_fields") or ([profile["primary_key"]] if profile.get("primary_key") else [])
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

        record_id = str(record.get(primary_key) or record.get("id") or position)
        for field in profile.get("validation", {}).get("required_fields", []):
            value = record.get(field)
            if value is None or (isinstance(value, str) and not value.strip()):
                issues.append({
                    "code": "MISSING_DATA_FIELD",
                    "field": field,
                    "record_id": record_id,
                    "message": f"Required dataset field '{field}' is missing or empty.",
                })

        issues.extend(validate_record_provenance(record, record_id=record_id))

        if id_fields:
            key_values = [record.get(field) for field in id_fields]
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
                normalized_id = "::".join(str(value).strip() for value in key_values)
                if normalized_id in seen_ids:
                    issues.append({
                        "code": "DUPLICATE_PRIMARY_KEY",
                        "field": ",".join(id_fields),
                        "record_id": normalized_id,
                        "message": "Duplicate document identity in the collection batch.",
                    })
                seen_ids.add(normalized_id)

        if record.get("data_classification") not in (None, "real"):
            issues.append({
                "code": "CLASSIFICATION_CONFLICT",
                "field": "data_classification",
                "record_id": record_id,
                "message": "Real ingestion rejects records classified as non-real.",
            })

        prepared.append({**dict(record), "data_classification": "real"})

    if issues:
        error = ValueError(f"Real-data batch rejected with {len(issues)} validation issue(s).")
        error.issues = issues
        raise error
    return prepared


def ingest_real_records(client, dataset_id, records, manifest):
    """Index a validated batch only into the isolated real-data index."""
    prepared = prepare_real_records(dataset_id, records, manifest)
    profile = get_dataset_profile(dataset_id)
    target_index = get_dataset_index(dataset_id, "real")
    id_fields = profile.get("document_id_fields") or ([profile["primary_key"]] if profile.get("primary_key") else [])

    actions = []
    for record in prepared:
        action = {
            "_op_type": "index",
            "_index": target_index,
            "_source": record,
        }
        if id_fields:
            action["_id"] = "::".join(str(record[field]).strip() for field in id_fields)
        actions.append(action)

    indexed_count, errors = bulk(
        client, actions, raise_on_error=False, stats_only=False
    )
    if errors:
        error = RuntimeError(
            f"Elasticsearch reported {len(errors)} bulk error(s); "
            f"{indexed_count} record(s) were indexed before the errors."
        )
        error.indexed_count = indexed_count
        error.errors = errors
        raise error
    return {
        "dataset_id": dataset_id,
        "classification": "real",
        "index": target_index,
        "collection_batch": manifest["collection_batch"],
        "indexed_records": indexed_count,
    }
