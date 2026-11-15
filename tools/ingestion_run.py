"""Execution evidence for explicitly invoked real-data ingestion runs.

The report records bounded operational metadata only. It never stores source
records, source URIs, request headers, credentials, or manifest source URLs.
"""
from __future__ import annotations

import json
import os
import tempfile
import time
import uuid
from collections import Counter
from collections.abc import Mapping
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from tools.adapters.base import SourceSpec
from tools.adapters.registry import create_default_adapter_registry
from tools.data_ingestion import ingest_source


class IngestionRunError(RuntimeError):
    """Raised after a failed run, carrying its finalized evidence report."""

    def __init__(self, report: Mapping[str, Any]):
        self.report = dict(report)
        error_type = self.report.get("error", {}).get("type", "UnknownError")
        super().__init__(
            f"Ingestion run {self.report.get('run_id')} failed ({error_type})."
        )


class _CountingRegistry:
    """Delegate adapter dispatch while counting records without buffering."""

    def __init__(self, registry: Any):
        self._registry = registry
        self.records_seen = 0

    def iter_records(self, format_name: str, source: SourceSpec):
        records = self._registry.iter_records(format_name, source)

        def counted():
            for record in records:
                self.records_seen += 1
                yield record

        return counted()


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _issue_counts(error: BaseException) -> dict[str, int]:
    issues = getattr(error, "issues", None)
    if not isinstance(issues, list):
        return {}
    counts: Counter[str] = Counter()
    for issue in issues:
        if isinstance(issue, Mapping):
            code = issue.get("code")
            if isinstance(code, str) and code:
                counts[code] += 1
    return dict(sorted(counts.items()))


def _write_json_atomically(
    report: Mapping[str, Any], destination: str | os.PathLike
) -> None:
    path = Path(destination)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            newline="\n",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as handle:
            temporary_path = Path(handle.name)
            json.dump(report, handle, ensure_ascii=False, indent=2, sort_keys=True)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary_path, path)
    finally:
        if temporary_path is not None and temporary_path.exists():
            temporary_path.unlink()


def run_ingestion_with_evidence(
    client: Any,
    dataset_id: str,
    format_name: str,
    source: SourceSpec,
    manifest: Mapping[str, Any],
    *,
    batch_size: int = 500,
    adapter_registry: Any = None,
    mapping_spec: Any = None,
    report_path: str | os.PathLike | None = None,
) -> dict[str, Any]:
    """Execute the existing ingestion path and return a bounded evidence report.

    A failed publication raises IngestionRunError; its report attribute
    contains the finalized failure evidence. If report_path is supplied, both
    successful and failed run reports are atomically written there.

    The report deliberately excludes source.uri, manifest.source_url, record
    values, adapter options, and request headers because they may contain
    credentials or sensitive source details. This function is an evidence
    wrapper, not an approval mechanism; callers remain responsible for
    explicitly authorizing a real-data publication before invoking it.
    """
    if not isinstance(source, SourceSpec):
        raise TypeError("source must be a SourceSpec instance.")
    if not isinstance(manifest, Mapping):
        raise TypeError("manifest must be a mapping.")
    if report_path is not None and not isinstance(report_path, (str, os.PathLike)):
        raise TypeError("report_path must be a string or path-like value.")

    registry = (
        create_default_adapter_registry()
        if adapter_registry is None
        else adapter_registry
    )
    counting_registry = _CountingRegistry(registry)
    started_clock = time.perf_counter()
    report: dict[str, Any] = {
        "evidence_schema_version": 1,
        "run_id": str(uuid.uuid4()),
        "status": "running",
        "started_at": _utc_now(),
        "finished_at": None,
        "duration_seconds": None,
        "dataset_id": dataset_id,
        "format_name": format_name,
        "source_name": manifest.get("source_name"),
        "collection_batch": manifest.get("collection_batch"),
        "mapping": None,
        "records_seen": 0,
        "publication": None,
        "error": None,
        "report_persisted": False,
        "ingestion_authorized_by_report": False,
    }

    if mapping_spec is not None:
        report["mapping"] = {
            "mapping_id": getattr(mapping_spec, "mapping_id", None),
            "version": getattr(mapping_spec, "version", None),
            "source_name": getattr(mapping_spec, "source_name", None),
            "reviewed_by": getattr(mapping_spec, "reviewed_by", None),
            "reviewed_at": getattr(mapping_spec, "reviewed_at", None),
            "review_reference": getattr(mapping_spec, "review_reference", None),
        }

    failure: BaseException | None = None
    try:
        publication = ingest_source(
            client,
            dataset_id,
            format_name,
            source,
            manifest,
            batch_size=batch_size,
            adapter_registry=counting_registry,
            mapping_spec=mapping_spec,
        )
        report["status"] = "published"
        report["publication"] = {
            key: publication.get(key)
            for key in (
                "index",
                "physical_index",
                "previous_physical_index",
                "collection_batch",
                "processed_records",
                "indexed_records",
                "total_records",
                "publication",
                "previous_version_retained",
            )
            if key in publication
        }
    except Exception as error:
        failure = error
        report["status"] = "failed"
        report["error"] = {
            "type": type(error).__name__,
            "issue_counts_by_code": _issue_counts(error),
        }
    finally:
        report["records_seen"] = counting_registry.records_seen
        report["finished_at"] = _utc_now()
        report["duration_seconds"] = round(
            max(0.0, time.perf_counter() - started_clock), 6
        )

    if report_path is not None:
        try:
            report["report_persisted"] = True
            _write_json_atomically(report, report_path)
        except Exception as error:
            report["report_persisted"] = False
            persistence_error = {
                "type": type(error).__name__,
                "stage": "write_evidence_report",
            }
            if report["error"] is None:
                report["error"] = persistence_error
            else:
                report["error"]["evidence_write_error"] = persistence_error
            if failure is None:
                report["status"] = "published_evidence_write_failed"

    if failure is not None:
        raise IngestionRunError(report) from failure
    if report["status"] == "published_evidence_write_failed":
        raise IngestionRunError(report)
    return report
