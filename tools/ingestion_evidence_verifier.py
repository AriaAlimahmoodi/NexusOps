"""Read-only verification of persisted ingestion-run evidence reports.

This module validates the internal consistency of evidence artifacts. It does
not contact Elasticsearch, inspect source data, or establish that a publication
actually occurred beyond the assertions recorded by the ingestion runner.
"""
from __future__ import annotations

import json
import uuid
from collections.abc import Mapping
from datetime import datetime
from pathlib import Path
from typing import Any


_REQUIRED_TOP_LEVEL = {
    "evidence_schema_version",
    "run_id",
    "status",
    "started_at",
    "finished_at",
    "duration_seconds",
    "dataset_id",
    "format_name",
    "source_name",
    "collection_batch",
    "mapping",
    "records_seen",
    "publication_state",
    "publication",
    "error",
    "report_persisted",
    "ingestion_authorized_by_report",
}
_PUBLICATION_FIELDS = {
    "index",
    "physical_index",
    "previous_physical_index",
    "collection_batch",
    "processed_records",
    "indexed_records",
    "total_records",
    "publication",
    "previous_version_retained",
}


def _issue(code: str, message: str) -> dict[str, str]:
    return {"code": code, "message": message}


def _is_nonempty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _is_nonnegative_int(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool) and value >= 0


def _parse_timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        return None
    return parsed


def _load_report(report: Mapping[str, Any] | str | Path) -> tuple[Mapping[str, Any] | None, str | None]:
    if isinstance(report, Mapping):
        return report, None
    if not isinstance(report, (str, Path)):
        return None, "report must be a mapping or a JSON file path."
    try:
        with Path(report).open("r", encoding="utf-8") as handle:
            loaded = json.load(handle)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        return None, f"could not read evidence JSON ({type(exc).__name__})."
    if not isinstance(loaded, Mapping):
        return None, "evidence JSON root must be an object."
    return loaded, None


def verify_ingestion_run_evidence(
    report: Mapping[str, Any] | str | Path,
) -> dict[str, Any]:
    """Verify a run report object or JSON path without side effects.

    The result contains all detected issues (the evidence report itself is
    expected to be small and bounded). A valid report is structurally
    consistent; this verifier cannot independently prove Elasticsearch state,
    source truth, human review, or publication authorization.
    """
    data, load_error = _load_report(report)
    if load_error is not None:
        return {
            "verification_schema_version": 1,
            "valid": False,
            "decision": "rejected",
            "issue_count": 1,
            "issues": [_issue("UNREADABLE_REPORT", load_error)],
            "publication_state": "unknown",
            "elasticsearch_inspected": False,
        }

    issues: list[dict[str, str]] = []

    def add(code: str, message: str) -> None:
        issues.append(_issue(code, message))

    missing = sorted(_REQUIRED_TOP_LEVEL - set(data))
    if missing:
        add("MISSING_REQUIRED_FIELDS", "Missing fields: " + ", ".join(missing))

    if data.get("evidence_schema_version") != 1 or isinstance(
        data.get("evidence_schema_version"), bool
    ):
        add("UNSUPPORTED_SCHEMA_VERSION", "evidence_schema_version must be 1.")

    try:
        uuid.UUID(str(data.get("run_id")))
    except (ValueError, TypeError, AttributeError):
        add("INVALID_RUN_ID", "run_id must be a valid UUID.")

    for field in ("dataset_id", "format_name", "source_name", "collection_batch"):
        if not _is_nonempty_string(data.get(field)):
            add("INVALID_IDENTITY_FIELD", f"{field} must be a non-empty string.")

    started = _parse_timestamp(data.get("started_at"))
    finished = _parse_timestamp(data.get("finished_at"))
    if started is None:
        add("INVALID_STARTED_AT", "started_at must be a timezone-aware ISO-8601 timestamp.")
    if finished is None:
        add("INVALID_FINISHED_AT", "finished_at must be a timezone-aware ISO-8601 timestamp.")
    if started is not None and finished is not None and finished < started:
        add("INVALID_TIME_ORDER", "finished_at must not precede started_at.")

    duration = data.get("duration_seconds")
    if (
        not isinstance(duration, (int, float))
        or isinstance(duration, bool)
        or duration < 0
    ):
        add("INVALID_DURATION", "duration_seconds must be a non-negative number.")

    records_seen = data.get("records_seen")
    if not _is_nonnegative_int(records_seen):
        add("INVALID_RECORD_COUNT", "records_seen must be a non-negative integer.")

    if data.get("report_persisted") is not True and data.get("report_persisted") is not False:
        add("INVALID_PERSISTENCE_FLAG", "report_persisted must be a boolean.")
    if data.get("ingestion_authorized_by_report") is not False:
        add("INVALID_AUTHORIZATION_FLAG", "Evidence reports must not authorize ingestion.")

    mapping = data.get("mapping")
    if mapping is not None:
        if not isinstance(mapping, Mapping):
            add("INVALID_MAPPING_METADATA", "mapping must be null or an object.")
        else:
            for field in (
                "mapping_id", "source_name", "reviewed_by",
                "reviewed_at", "review_reference",
            ):
                if not _is_nonempty_string(mapping.get(field)):
                    add("INVALID_MAPPING_METADATA", f"mapping.{field} must be a non-empty string.")
            version = mapping.get("version")
            if not isinstance(version, int) or isinstance(version, bool) or version < 1:
                add("INVALID_MAPPING_VERSION", "mapping.version must be a positive integer.")
            if _parse_timestamp(mapping.get("reviewed_at")) is None:
                add("INVALID_MAPPING_TIMESTAMP", "mapping.reviewed_at must be timezone-aware.")
            if mapping.get("source_name") != data.get("source_name"):
                add("MAPPING_SOURCE_MISMATCH", "mapping.source_name must match report source_name.")

    status = data.get("status")
    publication_state = data.get("publication_state")
    publication = data.get("publication")
    error = data.get("error")

    if status == "published":
        if publication_state != "confirmed":
            add("PUBLICATION_STATE_MISMATCH", "published status requires confirmed publication_state.")
        if not isinstance(publication, Mapping):
            add("MISSING_PUBLICATION_DETAILS", "published status requires publication details.")
        else:
            missing_publication = sorted(_PUBLICATION_FIELDS - set(publication))
            if missing_publication:
                add(
                    "INCOMPLETE_PUBLICATION_DETAILS",
                    "Missing publication fields: " + ", ".join(missing_publication),
                )
            for field in ("index", "physical_index", "publication"):
                if not _is_nonempty_string(publication.get(field)):
                    add("INVALID_PUBLICATION_FIELD", f"publication.{field} must be a non-empty string.")
            if publication.get("publication") != "atomic_alias_switch":
                add("UNKNOWN_PUBLICATION_METHOD", "publication.publication must be atomic_alias_switch.")
            for field in ("processed_records", "indexed_records", "total_records"):
                if not _is_nonnegative_int(publication.get(field)):
                    add("INVALID_PUBLICATION_COUNT", f"publication.{field} must be a non-negative integer.")
            processed = publication.get("processed_records")
            indexed = publication.get("indexed_records")
            total = publication.get("total_records")
            if _is_nonnegative_int(processed) and processed == 0:
                add("EMPTY_PUBLICATION", "A successful publication must process at least one record.")
            if _is_nonnegative_int(processed) and _is_nonnegative_int(indexed) and processed != indexed:
                add("INDEXED_COUNT_MISMATCH", "processed_records must equal indexed_records.")
            if _is_nonnegative_int(indexed) and _is_nonnegative_int(total) and total < indexed:
                add("TOTAL_COUNT_TOO_SMALL", "total_records cannot be smaller than indexed_records.")
            if _is_nonnegative_int(records_seen) and _is_nonnegative_int(processed) and records_seen != processed:
                add("RECORD_COUNT_MISMATCH", "records_seen must equal processed_records on success.")
            if publication.get("collection_batch") != data.get("collection_batch"):
                add("PUBLICATION_BATCH_MISMATCH", "Publication collection_batch must match the run report.")
            previous = publication.get("previous_physical_index")
            retained = publication.get("previous_version_retained")
            if previous is not None and not _is_nonempty_string(previous):
                add("INVALID_PREVIOUS_INDEX", "previous_physical_index must be null or a non-empty string.")
            if retained is not (previous is not None):
                add("PREVIOUS_VERSION_FLAG_MISMATCH", "previous_version_retained must reflect previous_physical_index.")
        if error is not None:
            add("UNEXPECTED_SUCCESS_ERROR", "A published report must not contain an error.")
    elif status == "failed":
        if publication_state != "not_confirmed":
            add("PUBLICATION_STATE_MISMATCH", "failed status requires not_confirmed publication_state.")
        if publication is not None:
            add("UNEXPECTED_PUBLICATION_DETAILS", "failed status must not claim publication details.")
        if not isinstance(error, Mapping) or not _is_nonempty_string(error.get("type")):
            add("MISSING_FAILURE_DETAILS", "failed status requires an error object with a type.")
    elif status == "published_evidence_write_failed":
        if publication_state != "confirmed":
            add("PUBLICATION_STATE_MISMATCH", "published_evidence_write_failed requires confirmed publication_state.")
        if not isinstance(publication, Mapping):
            add("MISSING_PUBLICATION_DETAILS", "Confirmed publication requires publication details.")
        if data.get("report_persisted") is not False:
            add("PERSISTENCE_STATE_MISMATCH", "Evidence-write failure requires report_persisted=false.")
        if not isinstance(error, Mapping) or not isinstance(error.get("evidence_write_error"), Mapping):
            add("MISSING_EVIDENCE_WRITE_ERROR", "Evidence-write failure requires error.evidence_write_error.")
        elif error["evidence_write_error"].get("stage") != "write_evidence_report":
            add("INVALID_EVIDENCE_WRITE_STAGE", "Evidence write error has an unexpected stage.")
    else:
        add("INVALID_FINAL_STATUS", "status must be published, failed, or published_evidence_write_failed.")

    return {
        "verification_schema_version": 1,
        "valid": not issues,
        "decision": "verified" if not issues else "rejected",
        "issue_count": len(issues),
        "issues": issues,
        "run_id": data.get("run_id"),
        "dataset_id": data.get("dataset_id"),
        "status": status,
        "publication_state": publication_state,
        "records_seen": records_seen,
        "elasticsearch_inspected": False,
        "semantic_review_verified": False,
        "ingestion_authorized": False,
    }
