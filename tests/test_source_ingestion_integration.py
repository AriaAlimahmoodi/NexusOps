from __future__ import annotations

import csv

import pytest

from tools.adapters.base import SourceSpec
from tools.data_ingestion import ingest_source
from tools.source_mapping import SourceMappingSpec
from test_atomic_data_publisher import FakeClient, install_fake_bulk


def _manifest():
    return {
        "collection_batch": "source-integration-2026-11-15",
        "source_name": "Reviewed CSV integration fixture",
        "source_url": "https://example.org/source-integration.csv",
        "publisher": "NexusOps Test Suite",
        "retrieved_at": "2026-11-15T00:00:00Z",
        "geographic_scope": "IR",
        "license": "CC-BY-4.0",
        "collection_method": "synthetic integration fixture",
        "limitations": "Test-only data; no external source or production index.",
    }


def _mapping():
    return SourceMappingSpec(
        mapping_id="labor-market-csv-integration-v1",
        dataset_id="labor_market",
        source_name="Reviewed CSV integration fixture",
        field_mappings={
            "RecordID": "market_record_id",
            "Skill": "skill",
            "DemandScore": "demand_score",
            "Frequency": "frequency",
            "SourceURL": "source",
            "ObservedAt": "observed_at",
            "Batch": "collection_batch",
            "Granularity": "time_granularity",
        },
        reviewed_by="NexusOps test",
        reviewed_at="2026-11-15T00:00:00Z",
        review_reference="automated-integration-test",
    )


def _write_csv(path, *, demand_score="4.7"):
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(
            stream,
            fieldnames=[
                "RecordID", "Skill", "DemandScore", "Frequency",
                "SourceURL", "ObservedAt", "Batch", "Granularity",
                "SalaryBand",
            ],
        )
        writer.writeheader()
        writer.writerow({
            "RecordID": "LM-CSV-001",
            "Skill": "Python",
            "DemandScore": demand_score,
            "Frequency": "125",
            "SourceURL": "https://example.org/records/LM-CSV-001",
            "ObservedAt": "2026-11-14T09:00:00Z",
            "Batch": "source-integration-2026-11-15",
            "Granularity": "daily",
            "SalaryBand": "unsupported-source-only-value",
        })


def test_csv_mapping_normalization_and_atomic_publication_end_to_end(
    tmp_path, monkeypatch
):
    install_fake_bulk(monkeypatch)
    source_path = tmp_path / "source.csv"
    _write_csv(source_path)
    client = FakeClient()

    result = ingest_source(
        client,
        "labor_market",
        "csv",
        SourceSpec(str(source_path), {"strict": True}),
        _manifest(),
        mapping_spec=_mapping(),
        batch_size=1,
    )

    assert result["publication"] == "atomic_alias_switch"
    assert result["processed_records"] == 1
    assert result["indexed_records"] == 1
    assert client.aliases["labor_market_real"] == result["physical_index"]

    stored = client.documents[result["physical_index"]]["LM-CSV-001"]
    assert stored["market_record_id"] == "LM-CSV-001"
    assert stored["skill"] == "Python"
    assert stored["demand_score"] == 4.7
    assert stored["frequency"] == 125
    assert stored["data_classification"] == "real"
    assert stored["collection_batch"] == "source-integration-2026-11-15"
    assert "SalaryBand" not in stored
    assert "salary_band" not in stored


def test_invalid_mapped_source_never_switches_alias_or_leaves_staging_index(
    tmp_path, monkeypatch
):
    install_fake_bulk(monkeypatch)
    source_path = tmp_path / "invalid-source.csv"
    _write_csv(source_path, demand_score="8.0")
    client = FakeClient()

    with pytest.raises(ValueError, match="violates the canonical dataset contract"):
        ingest_source(
            client,
            "labor_market",
            "csv",
            SourceSpec(str(source_path), {"strict": True}),
            _manifest(),
            mapping_spec=_mapping(),
            batch_size=1,
        )

    assert "labor_market_real" not in client.aliases
    assert client.documents == {}
    assert client.mappings == {}
