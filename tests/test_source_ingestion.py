"""Tests for streaming source-to-ingestion orchestration."""
import pytest

from tools.adapters.base import SourceSpec
from tools.adapters.registry import SourceAdapterRegistry
from tools.data_ingestion import ingest_source


def manifest():
    return {
        "collection_batch": "batch-001",
        "source_name": "Reviewed canonical fixture",
        "source_url": "https://example.org/data",
        "publisher": "Example Publisher",
        "retrieved_at": "2026-11-15T00:00:00Z",
        "geographic_scope": "ES",
        "license": "CC-BY-4.0",
        "collection_method": "documented export",
        "limitations": "Test fixture",
    }


class FixtureAdapter:
    format_name = "fixture"

    def __init__(self, records):
        self.records = records
        self.iterated = False

    def iter_records(self, source):
        assert isinstance(source, SourceSpec)
        self.iterated = True
        yield from self.records


def test_ingest_source_dispatches_explicit_format_and_preserves_iterator(
    monkeypatch,
):
    adapter = FixtureAdapter([{"market_record_id": "LM0001"}])
    registry = SourceAdapterRegistry()
    registry.register(adapter)
    captured = {}

    def fake_ingest(client, dataset_id, records, manifest_value, *, batch_size):
        captured["client"] = client
        captured["dataset_id"] = dataset_id
        captured["records_is_iterator"] = iter(records) is records
        captured["records"] = list(records)
        captured["manifest"] = manifest_value
        captured["batch_size"] = batch_size
        return {"publication": "atomic_alias_switch"}

    monkeypatch.setattr("tools.data_ingestion.ingest_real_records", fake_ingest)
    client = object()
    source = SourceSpec("fixture://source")

    result = ingest_source(
        client,
        "labor_market",
        "FIXTURE",
        source,
        manifest(),
        batch_size=37,
        adapter_registry=registry,
    )

    assert result["publication"] == "atomic_alias_switch"
    assert adapter.iterated is True
    assert captured["client"] is client
    assert captured["dataset_id"] == "labor_market"
    assert captured["records_is_iterator"] is True
    assert captured["records"] == [{"market_record_id": "LM0001"}]
    assert captured["manifest"]["collection_batch"] == "batch-001"
    assert captured["batch_size"] == 37


def test_ingest_source_uses_default_registry_when_not_supplied(monkeypatch):
    adapter = FixtureAdapter([{"id": "one"}])
    registry = SourceAdapterRegistry()
    registry.register(adapter)
    captured = {}

    monkeypatch.setattr(
        "tools.adapters.registry.create_default_adapter_registry",
        lambda: registry,
    )
    monkeypatch.setattr(
        "tools.data_ingestion.ingest_real_records",
        lambda client, dataset_id, records, manifest_value, *, batch_size:
            captured.update(records=list(records), batch_size=batch_size) or {
                "publication": "atomic_alias_switch"
            },
    )

    result = ingest_source(
        object(), "labor_market", "fixture", SourceSpec("fixture://source"),
        manifest(),
    )

    assert result["publication"] == "atomic_alias_switch"
    assert captured["records"] == [{"id": "one"}]
    assert captured["batch_size"] == 500


def test_ingest_source_rejects_non_source_spec_before_dispatch(monkeypatch):
    called = False

    def unexpected_registry():
        nonlocal called
        called = True
        raise AssertionError("Registry must not be created for invalid source.")

    monkeypatch.setattr(
        "tools.adapters.registry.create_default_adapter_registry",
        unexpected_registry,
    )

    with pytest.raises(TypeError, match="SourceSpec"):
        ingest_source(
            object(), "labor_market", "csv", "not-a-source-spec", manifest()
        )

    assert called is False


def test_ingest_source_rejects_unknown_explicit_format():
    with pytest.raises(KeyError, match="No source adapter is registered"):
        ingest_source(
            object(),
            "labor_market",
            "unknown",
            SourceSpec("unknown://source"),
            manifest(),
            adapter_registry=SourceAdapterRegistry(),
        )
