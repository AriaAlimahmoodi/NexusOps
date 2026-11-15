"""Tests for bounded ingestion-run evidence reporting."""
import json

import pytest

from tools.adapters.base import SourceSpec
from tools.adapters.registry import SourceAdapterRegistry
from tools.ingestion_run import IngestionRunError, run_ingestion_with_evidence
from tools.source_mapping import SourceMappingSpec


def make_manifest():
    return {
        "collection_batch": "evidence-batch-01",
        "source_name": "Evidence fixture",
        "source_url": "https://private.example/data?token=do-not-record",
        "publisher": "Test Publisher",
        "retrieved_at": "2026-11-15T00:00:00Z",
        "geographic_scope": "ES",
        "license": "CC-BY-4.0",
        "collection_method": "test fixture",
        "limitations": "Synthetic test data",
    }


def make_mapping():
    return SourceMappingSpec(
        mapping_id="evidence-map-v1",
        dataset_id="labor_market",
        source_name="Evidence fixture",
        field_mappings={"RecordID": "market_record_id"},
        reviewed_by="reviewer-1",
        reviewed_at="2026-11-15T00:00:00Z",
        review_reference="review://evidence-map-v1",
    )


class FixtureAdapter:
    format_name = "fixture"

    def __init__(self, records):
        self.records = records

    def iter_records(self, source):
        yield from self.records


def make_registry(records):
    registry = SourceAdapterRegistry()
    registry.register(FixtureAdapter(records))
    return registry


def test_successful_run_returns_and_persists_bounded_publication_evidence(
    monkeypatch, tmp_path
):
    captured = {}

    def fake_ingest(
        client, dataset_id, format_name, source, manifest, *,
        batch_size, adapter_registry, mapping_spec
    ):
        records = list(adapter_registry.iter_records(format_name, source))
        captured["records"] = records
        captured["client"] = client
        captured["batch_size"] = batch_size
        captured["mapping_spec"] = mapping_spec
        return {
            "dataset_id": dataset_id,
            "index": "labor_market_real",
            "physical_index": "labor_market_real__v_new",
            "previous_physical_index": "labor_market_real__v_old",
            "collection_batch": manifest["collection_batch"],
            "processed_records": len(records),
            "indexed_records": len(records),
            "total_records": 12,
            "publication": "atomic_alias_switch",
            "previous_version_retained": True,
        }

    monkeypatch.setattr("tools.ingestion_run.ingest_source", fake_ingest)
    client = object()
    mapping = make_mapping()
    report_path = tmp_path / "reports" / "ingestion-run.json"

    report = run_ingestion_with_evidence(
        client,
        "labor_market",
        "fixture",
        SourceSpec(
            "https://private.example/data?api_key=must-not-be-recorded",
            {"headers": {"Authorization": "Bearer secret"}},
        ),
        make_manifest(),
        batch_size=25,
        adapter_registry=make_registry([
            {"RecordID": "LM-001"},
            {"RecordID": "LM-002"},
        ]),
        mapping_spec=mapping,
        report_path=report_path,
    )

    persisted = json.loads(report_path.read_text(encoding="utf-8"))
    assert report["status"] == "published"
    assert report["records_seen"] == 2
    assert report["publication"]["processed_records"] == 2
    assert report["publication"]["physical_index"] == "labor_market_real__v_new"
    assert report["mapping"]["mapping_id"] == "evidence-map-v1"
    assert report["mapping"]["version"] == 1
    assert report["report_persisted"] is True
    assert persisted["report_persisted"] is True
    assert captured["records"] == [
        {"RecordID": "LM-001"},
        {"RecordID": "LM-002"},
    ]
    assert captured["client"] is client
    assert captured["batch_size"] == 25
    assert captured["mapping_spec"] is mapping

    serialized = report_path.read_text(encoding="utf-8")
    assert "api_key" not in serialized
    assert "must-not-be-recorded" not in serialized
    assert "Authorization" not in serialized
    assert "Bearer secret" not in serialized
    assert "do-not-record" not in serialized
    assert report["ingestion_authorized_by_report"] is False


def test_failed_run_raises_error_with_persisted_failure_evidence(
    monkeypatch, tmp_path
):
    def fake_ingest(
        client, dataset_id, format_name, source, manifest, *,
        batch_size, adapter_registry, mapping_spec
    ):
        list(adapter_registry.iter_records(format_name, source))
        error = ValueError("canonical validation failed")
        error.issues = [
            {"code": "MISSING_DATA_FIELD", "field": "skill"},
            {"code": "MISSING_DATA_FIELD", "field": "demand_score"},
            {"code": "INVALID_TIMESTAMP", "field": "observed_at"},
        ]
        raise error

    monkeypatch.setattr("tools.ingestion_run.ingest_source", fake_ingest)
    report_path = tmp_path / "failed-run.json"

    with pytest.raises(IngestionRunError) as caught:
        run_ingestion_with_evidence(
            object(),
            "labor_market",
            "fixture",
            SourceSpec("fixture://records"),
            make_manifest(),
            adapter_registry=make_registry([{"RecordID": "LM-001"}]),
            report_path=report_path,
        )

    report = caught.value.report
    persisted = json.loads(report_path.read_text(encoding="utf-8"))
    assert report["status"] == "failed"
    assert report["records_seen"] == 1
    assert report["error"]["type"] == "ValueError"
    assert report["error"]["issue_counts_by_code"] == {
        "INVALID_TIMESTAMP": 1,
        "MISSING_DATA_FIELD": 2,
    }
    assert report["report_persisted"] is True
    assert persisted["status"] == "failed"
    assert persisted["error"]["issue_counts_by_code"] == (
        report["error"]["issue_counts_by_code"]
    )


def test_report_write_failure_does_not_hide_successful_publication(monkeypatch):
    def fake_ingest(
        client, dataset_id, format_name, source, manifest, *,
        batch_size, adapter_registry, mapping_spec
    ):
        list(adapter_registry.iter_records(format_name, source))
        return {
            "index": "labor_market_real",
            "physical_index": "labor_market_real__v_new",
            "processed_records": 1,
            "indexed_records": 1,
            "total_records": 1,
            "publication": "atomic_alias_switch",
        }

    def fail_write(report, destination):
        raise OSError("disk unavailable")

    monkeypatch.setattr("tools.ingestion_run.ingest_source", fake_ingest)
    monkeypatch.setattr("tools.ingestion_run._write_json_atomically", fail_write)

    with pytest.raises(IngestionRunError) as caught:
        run_ingestion_with_evidence(
            object(),
            "labor_market",
            "fixture",
            SourceSpec("fixture://records"),
            make_manifest(),
            adapter_registry=make_registry([{"RecordID": "LM-001"}]),
            report_path="unwritable/report.json",
        )

    report = caught.value.report
    assert report["status"] == "published_evidence_write_failed"
    assert report["publication"]["publication"] == "atomic_alias_switch"
    assert report["report_persisted"] is False
    assert report["error"]["stage"] == "write_evidence_report"


def test_invalid_source_is_rejected_before_ingestion():
    with pytest.raises(TypeError, match="SourceSpec"):
        run_ingestion_with_evidence(
            object(), "labor_market", "fixture", "not-a-source-spec",
            make_manifest(),
        )
