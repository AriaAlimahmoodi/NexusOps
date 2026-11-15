"""Tests for explicit, reviewed source-to-canonical field projection."""
import pytest

from tools.adapters.base import SourceSpec
from tools.adapters.registry import SourceAdapterRegistry
from tools.data_ingestion import ingest_source
from tools.source_mapping import (
    SourceMappingSpec,
    iter_mapped_records,
    map_source_record,
)


def mapping_spec(**overrides):
    values = {
        "mapping_id": "fixture-labor-market-v1",
        "dataset_id": "labor_market",
        "source_name": "Reviewed fixture",
        "field_mappings": {
            "JobTitle": "job_title",
            "SkillName": "skill",
            "Demand": "demand_score",
            "Batch": "collection_batch",
            "SourceURL": "source",
            "ObservedAt": "observed_at",
            "Granularity": "time_granularity",
        },
        "reviewed_by": "data-governance-review",
        "reviewed_at": "2026-11-15T00:00:00Z",
        "review_reference": "review://mapping/fixture-labor-market-v1",
        "version": 1,
    }
    values.update(overrides)
    return SourceMappingSpec(**values)


def test_map_source_record_copies_only_explicitly_mapped_values():
    record = {
        "JobTitle": "Backend Developer",
        "SkillName": "Python",
        "Demand": "4.5",
        "UnregisteredSourceFeature": {"keep": False},
    }

    mapped = map_source_record(record, mapping_spec())

    assert mapped == {
        "job_title": "Backend Developer",
        "skill": "Python",
        "demand_score": "4.5",
    }
    assert "UnregisteredSourceFeature" not in mapped


def test_missing_source_fields_remain_absent_and_are_not_filled_with_null():
    mapped = map_source_record({"SkillName": "Python"}, mapping_spec())

    assert mapped == {"skill": "Python"}
    assert "job_title" not in mapped
    assert "demand_score" not in mapped


def test_explicit_null_is_copied_without_interpretation():
    mapped = map_source_record({"SkillName": None}, mapping_spec())
    assert mapped == {"skill": None}


def test_mapping_spec_is_immutable():
    spec = mapping_spec()
    with pytest.raises(TypeError):
        spec.field_mappings["Other"] = "job_title"


def test_mapping_rejects_targets_outside_dataset_and_provenance_contract():
    with pytest.raises(ValueError, match="not part"):
        mapping_spec(field_mappings={"NewSourceField": "new_canonical_field"})


def test_mapping_rejects_duplicate_canonical_targets():
    with pytest.raises(ValueError, match="Multiple source fields"):
        mapping_spec(field_mappings={"Title": "job_title", "Position": "job_title"})


def test_mapping_rejects_data_classification_target():
    with pytest.raises(ValueError, match="data_classification"):
        mapping_spec(field_mappings={"Class": "data_classification"})


@pytest.mark.parametrize("version", [0, -1, True, 1.5])
def test_mapping_rejects_invalid_version(version):
    with pytest.raises(ValueError, match="version"):
        mapping_spec(version=version)


@pytest.mark.parametrize(
    "reviewed_at",
    ["", "2026-11-15T00:00:00", "not-a-timestamp"],
)
def test_mapping_requires_timezone_aware_review_timestamp(reviewed_at):
    with pytest.raises(ValueError, match="reviewed_at"):
        mapping_spec(reviewed_at=reviewed_at)


def test_iter_mapped_records_is_lazy_and_preserves_stream_order():
    consumed = []

    def records():
        for item in ({"SkillName": "Python"}, {"SkillName": "SQL"}):
            consumed.append(item["SkillName"])
            yield item

    mapped = iter_mapped_records(records(), mapping_spec())
    assert consumed == []
    assert list(mapped) == [{"skill": "Python"}, {"skill": "SQL"}]
    assert consumed == ["Python", "SQL"]


def test_iter_mapped_records_reports_non_mapping_record_position():
    with pytest.raises(TypeError, match="position 1"):
        list(iter_mapped_records(
            [{"SkillName": "Python"}, "invalid"], mapping_spec()
        ))


def test_ingest_source_applies_explicit_mapping_before_canonical_ingestion(monkeypatch):
    class FixtureAdapter:
        format_name = "fixture"

        def iter_records(self, source):
            assert isinstance(source, SourceSpec)
            yield {
                "SkillName": "Python",
                "Demand": 4.5,
                "Batch": "batch-001",
                "SourceURL": "https://example.org/record/1",
                "ObservedAt": "2026-11-15T00:00:00Z",
                "Granularity": "monthly",
                "UnregisteredSourceFeature": "discard",
            }

    registry = SourceAdapterRegistry()
    registry.register(FixtureAdapter())
    captured = {}

    def fake_ingest(client, dataset_id, records, manifest_value, *, batch_size):
        captured["records"] = list(records)
        captured["dataset_id"] = dataset_id
        return {"publication": "atomic_alias_switch"}

    monkeypatch.setattr("tools.data_ingestion.ingest_real_records", fake_ingest)

    result = ingest_source(
        object(),
        "labor_market",
        "fixture",
        SourceSpec("fixture://source"),
        {"collection_batch": "batch-001", "source_name": "Reviewed fixture"},
        adapter_registry=registry,
        mapping_spec=mapping_spec(),
    )

    assert result["publication"] == "atomic_alias_switch"
    assert captured["dataset_id"] == "labor_market"
    assert captured["records"] == [{
        "skill": "Python",
        "demand_score": 4.5,
        "collection_batch": "batch-001",
        "source": "https://example.org/record/1",
        "observed_at": "2026-11-15T00:00:00Z",
        "time_granularity": "monthly",
    }]


def test_ingest_source_rejects_mapping_for_a_different_dataset_before_reading():
    class FixtureAdapter:
        format_name = "fixture"

        def iter_records(self, source):
            raise AssertionError("Source must not be read.")

    registry = SourceAdapterRegistry()
    registry.register(FixtureAdapter())

    with pytest.raises(ValueError, match="does not match dataset"):
        ingest_source(
            object(),
            "university_courses",
            "fixture",
            SourceSpec("fixture://source"),
            {},
            adapter_registry=registry,
            mapping_spec=mapping_spec(),
        )

def test_ingest_source_rejects_mapping_when_manifest_source_name_differs(monkeypatch):
    class FixtureAdapter:
        format_name = "fixture"

        def iter_records(self, source):
            raise AssertionError("Source must not be read.")

    registry = SourceAdapterRegistry()
    registry.register(FixtureAdapter())

    with pytest.raises(ValueError, match="source_name"):
        ingest_source(
            object(),
            "labor_market",
            "fixture",
            SourceSpec("fixture://source"),
            {"source_name": "Different source"},
            adapter_registry=registry,
            mapping_spec=mapping_spec(),
        )
