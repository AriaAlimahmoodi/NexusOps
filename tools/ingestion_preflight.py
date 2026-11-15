"""Read-only streaming preflight audit for canonical real-data ingestion.

This module validates already-mapped canonical records and their collection
manifest. It never writes to Elasticsearch or publishes an index alias.
"""
from __future__ import annotations

from collections import Counter
from collections.abc import Iterable, Mapping
from typing import Any

from tools.data_ingestion import validate_collection_manifest
from tools.data_normalization import normalize_real_record
from tools.dataset_registry import get_dataset_profile


def audit_canonical_record_stream(
    dataset_id: str,
    records: Iterable[Mapping[str, Any]],
    manifest: Mapping[str, Any],
    *,
    max_issue_samples: int = 100,
) -> dict[str, Any]:
    """Audit a one-pass stream of source-mapped canonical records.

    The input must already use reviewed canonical field names. The function
    applies the existing Registry normalizer, provenance checks, manifest
    checks, collection-batch consistency, and document-identity uniqueness.
    Only a bounded sample of issues is retained; aggregate counts are complete.
    """
    if (
        not isinstance(max_issue_samples, int)
        or isinstance(max_issue_samples, bool)
        or max_issue_samples < 0
    ):
        raise ValueError("max_issue_samples must be a non-negative integer.")

    profile = get_dataset_profile(dataset_id)
    if not isinstance(manifest, Mapping):
        raise TypeError("manifest must be a mapping.")

    manifest_issues = validate_collection_manifest(manifest, [])
    batch_id = manifest.get("collection_batch")
    id_fields = profile.get("document_id_fields") or (
        [profile["primary_key"]] if profile.get("primary_key") else []
    )

    issue_counts: Counter[str] = Counter()
    issue_samples: list[dict[str, str]] = []
    total_records = valid_records = invalid_records = 0
    seen_ids: set[str] = set()

    def record_issue(issue: Mapping[str, Any]) -> None:
        code = str(issue.get("code", "UNKNOWN_ISSUE"))
        issue_counts[code] += 1
        if len(issue_samples) < max_issue_samples:
            issue_samples.append({
                str(key): str(value)
                for key, value in issue.items()
                if value is not None
            })

    for issue in manifest_issues:
        record_issue(issue)

    for position, source_record in enumerate(records):
        total_records += 1
        row_issues: list[dict[str, str]] = []

        if not isinstance(source_record, Mapping):
            row_issues.append({
                "code": "INVALID_RECORD",
                "record_id": str(position),
                "message": "Each record must be a mapping.",
            })
        else:
            identity_values = [source_record.get(field) for field in id_fields]
            source_record_id = (
                "::".join(
                    str(value).strip()
                    for value in identity_values
                    if value is not None and str(value).strip()
                )
                or str(position)
            )

            if source_record.get("collection_batch") != batch_id:
                row_issues.append({
                    "code": "COLLECTION_BATCH_MISMATCH",
                    "field": "collection_batch",
                    "record_id": source_record_id,
                    "message": "Record collection_batch must match the manifest.",
                })

            normalized, normalization_issues = normalize_real_record(
                dataset_id, source_record, record_id=source_record_id
            )
            row_issues.extend(normalization_issues)

            if id_fields:
                key_values = [normalized.get(field) for field in id_fields]
                valid_identity = all(
                    isinstance(value, (str, int))
                    and not isinstance(value, bool)
                    and bool(str(value).strip())
                    for value in key_values
                )
                if not valid_identity:
                    row_issues.append({
                        "code": "MISSING_PRIMARY_KEY",
                        "field": ",".join(id_fields),
                        "record_id": source_record_id,
                        "message": "Registered document identity fields are required.",
                    })
                else:
                    document_id = "::".join(
                        str(value).strip() for value in key_values
                    )
                    if document_id in seen_ids:
                        row_issues.append({
                            "code": "DUPLICATE_PRIMARY_KEY",
                            "field": ",".join(id_fields),
                            "record_id": document_id,
                            "message": "Duplicate document identity in the stream.",
                        })
                    else:
                        seen_ids.add(document_id)

        if row_issues:
            invalid_records += 1
            for issue in row_issues:
                record_issue(issue)
        else:
            valid_records += 1

    issue_total = sum(issue_counts.values())
    return {
        "audit_version": 1,
        "dataset_id": dataset_id,
        "collection_batch": batch_id if isinstance(batch_id, str) else None,
        "total_records": total_records,
        "valid_records": valid_records,
        "invalid_records": invalid_records,
        "manifest_valid": not manifest_issues,
        "manifest_issue_count": len(manifest_issues),
        "issue_count": issue_total,
        "issue_counts_by_code": dict(sorted(issue_counts.items())),
        "issue_samples": issue_samples,
        "issue_samples_truncated": issue_total > len(issue_samples),
        "decision": (
            "preflight_passed"
            if not issue_total and total_records > 0
            else "rejected"
        ),
        "records_published": 0,
        "elasticsearch_write_performed": False,
        "alias_changed": False,
    }
