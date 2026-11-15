"""Tests for the read-only adapter-to-mapping-to-canonical preflight."""
import pytest

from tools.adapters.base import SourceSpec
from tools.adapters.registry import SourceAdapterRegistry
from tools.source_ingestion_preflight import audit_source_ingestion_preflight
from tools.source_mapping import SourceMappingSpec


def make_mapping(**overrides):
    values = {
        "mapping_id": "fixture-labor-market-v1",
        "dataset_id": "labor_market",
        "source_name": "Preflight fixture",
        "field_mappings": {
            "RecordID": "market_record_id",
            "SkillName": "skill",
            "Demand": "demand_score",
            "Frequency": "frequency",
            "Batch": "collection_batch",
            "SourceURL": "source",
            "ObservedAt": "observed_at",
            "Granularity": "time_granularity",
        },
        "reviewed_by": "test-reviewer",
        "reviewed_at": "2026-11-15T00:00:00Z",
        "review_reference": "review://fixture/labor-market-v1",
    }
    values.update(overrides)
    return SourceMappingSpec(**values)


def make_manifest(**overrides):
    value = {
        "collection_batch": "preflight-batch",
        "source_name": "Preflight fixture",
        "source_url": "https://example.org/dataset",
        "publisher": "Test Publisher",
        "retrieved_at": "2026-11-15T00:00:00Z",
        "geographic_scope": "IR",
        "license": "CC-BY-4.0",
        "collection_method": "test fixture",
        "limitations": "Synthetic fixture only",
    }
    value.update(overrides)
    return value


def make_record(record_id="LM-001", **overrides):
    value = {
        "RecordID": record_id,
        "SkillName": "Python",
        "Demand": 4.2,
        "Frequency": 100,
        "Batch": "preflight-batch",
        "SourceURL": "https://example.org/record/1",
        "ObservedAt": "2026-11-15T00:00:00Z",
        "Granularity": "monthly",
        "SourceOnlyFeature": "must be discarded",
    }
    value.update(overrides)
    return value


class FixtureAdapter:
    format_name = "fixture"

    def __init__(self, records):
        self.records = records
        self.iterations = 0

    def iter_records(self, source):
        assert isinstance(source, SourceSpec)
        self.iterations += 1
        yield from self.records


def make_registry(records):
    adapter = FixtureAdapter(records)
    registry = SourceAdapterRegistry()
    registry.register(adapter)
    return registry, adapter


def test_preflight_composes_adapter_mapping_and_canonical_audit_once():
    registry, adapter = make_registry([make_record(), make_record("LM-002")])

    report = audit_source_ingestion_preflight(
        "labor_market",
        "fixture",
        SourceSpec("fixture://records"),
        make_manifest(),
        mapping_spec=make_mapping(),
        adapter_registry=registry,
    )

    assert report["decision"] == "preflight_passed"
    assert report["total_records"] == 2
    assert report["valid_records"] == 2
    assert report["invalid_records"] == 0
    assert report["mapping_applied"] is True
    assert report["mapping_id"] == "fixture-labor-market-v1"
    assert report["mapping_version"] == 1
    assert report["preflight_scope"] == (
        "adapter_to_reviewed_mapping_to_canonical_contract"
    )
    assert report["records_published"] == 0
    assert report["ingestion_authorized"] is False
    assert report["elasticsearch_write_performed"] is False
    assert report["alias_changed"] is False
    assert adapter.iterations == 1


def test_preflight_rejects_mapping_for_another_dataset_before_reading():
    registry, adapter = make_registry([make_record()])
    wrong_mapping = make_mapping(
        dataset_id="university_courses",
        field_mappings={
            "CourseID": "course_id",
            "CourseName": "course_name",
            "Category": "course_category",
            "Credits": "credits",
            "Skills": "skills",
            "Batch": "collection_batch",
            "SourceURL": "source",
            "ObservedAt": "observed_at",
            "Granularity": "time_granularity",
        },
    )

    with pytest.raises(ValueError, match="does not match the preflight dataset"):
        audit_source_ingestion_preflight(
            "labor_market", "fixture", SourceSpec("fixture://records"),
            make_manifest(), mapping_spec=wrong_mapping,
            adapter_registry=registry,
        )

    assert adapter.iterations == 0


def test_preflight_rejects_manifest_source_name_mismatch_before_reading():
    registry, adapter = make_registry([make_record()])

    with pytest.raises(ValueError, match="source_name"):
        audit_source_ingestion_preflight(
            "labor_market", "fixture", SourceSpec("fixture://records"),
            make_manifest(source_name="Different source"),
            mapping_spec=make_mapping(), adapter_registry=registry,
        )

    assert adapter.iterations == 0


def test_preflight_requires_an_explicit_mapping_spec_before_reading():
    registry, adapter = make_registry([make_record()])

    with pytest.raises(TypeError, match="SourceMappingSpec"):
        audit_source_ingestion_preflight(
            "labor_market", "fixture", SourceSpec("fixture://records"),
            make_manifest(), mapping_spec=None, adapter_registry=registry,
        )

    assert adapter.iterations == 0


def test_preflight_rejects_invalid_source_and_manifest_before_reading():
    registry, adapter = make_registry([make_record()])

    with pytest.raises(TypeError, match="SourceSpec"):
        audit_source_ingestion_preflight(
            "labor_market", "fixture", "fixture://records",
            make_manifest(), mapping_spec=make_mapping(),
            adapter_registry=registry,
        )

    with pytest.raises(TypeError, match="manifest"):
        audit_source_ingestion_preflight(
            "labor_market", "fixture", SourceSpec("fixture://records"),
            [], mapping_spec=make_mapping(), adapter_registry=registry,
        )

    assert adapter.iterations == 0


def test_preflight_rejects_source_with_missing_required_canonical_fields():
    registry, _ = make_registry([{
        "RecordID": "LM-001",
        "SkillName": "Python",
        "Batch": "preflight-batch",
        "SourceURL": "https://example.org/record/1",
        "ObservedAt": "2026-11-15T00:00:00Z",
        "Granularity": "monthly",
    }])

    report = audit_source_ingestion_preflight(
        "labor_market", "fixture", SourceSpec("fixture://records"),
        make_manifest(), mapping_spec=make_mapping(),
        adapter_registry=registry,
    )

    assert report["decision"] == "rejected"
    assert report["invalid_records"] == 1
    assert report["issue_counts_by_code"]["MISSING_DATA_FIELD"] >= 1
    assert report["ingestion_authorized"] is False


def test_preflight_discards_unmapped_source_attributes():
    registry, _ = make_registry([make_record()])

    report = audit_source_ingestion_preflight(
        "labor_market", "fixture", SourceSpec("fixture://records"),
        make_manifest(), mapping_spec=make_mapping(),
        adapter_registry=registry,
    )

    assert report["decision"] == "preflight_passed"
    assert "SourceOnlyFeature" not in report


def test_preflight_detects_duplicate_canonical_identity_after_mapping():
    registry, _ = make_registry([make_record(), make_record()])

    report = audit_source_ingestion_preflight(
        "labor_market", "fixture", SourceSpec("fixture://records"),
        make_manifest(), mapping_spec=make_mapping(),
        adapter_registry=registry,
    )

    assert report["decision"] == "rejected"
    assert report["issue_counts_by_code"]["DUPLICATE_PRIMARY_KEY"] == 1
    assert report["invalid_records"] == 1


def test_preflight_forwards_issue_sample_limit():
    records = [
        make_record(f"LM-{index}", Demand="not-numeric")
        for index in range(5)
    ]
    registry, _ = make_registry(records)

    report = audit_source_ingestion_preflight(
        "labor_market", "fixture", SourceSpec("fixture://records"),
        make_manifest(), mapping_spec=make_mapping(),
        adapter_registry=registry, max_issue_samples=2,
    )

    assert report["issue_counts_by_code"]["INVALID_FIELD_TYPE"] == 5
    assert len(report["issue_samples"]) == 2
    assert report["issue_samples_truncated"] is True


def test_preflight_fails_fast_with_position_for_non_mapping_adapter_record():
    registry, _ = make_registry([make_record(), "invalid-record"])

    with pytest.raises(TypeError, match="position 1"):
        audit_source_ingestion_preflight(
            "labor_market", "fixture", SourceSpec("fixture://records"),
            make_manifest(), mapping_spec=make_mapping(),
            adapter_registry=registry,
        )
