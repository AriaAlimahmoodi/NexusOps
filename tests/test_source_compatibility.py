"""Tests for read-only source-to-Registry compatibility assessment."""
import pytest

from tools.adapters.base import SourceSpec
from tools.adapters.registry import SourceAdapterRegistry
from tools.source_compatibility import assess_source_compatibility


class FixtureAdapter:
    format_name = "fixture"

    def __init__(self, records):
        self.records = records
        self.iterations = 0

    def iter_records(self, source):
        assert isinstance(source, SourceSpec)
        self.iterations += 1
        yield from self.records


def test_assessment_reports_exact_matches_missing_required_and_unsupported_fields():
    adapter = FixtureAdapter([
        {
            "market_record_id": "LM-001",
            "skill": "Python",
            "demand_score": 4.2,
            "source": "https://example.org/1",
            "observed_at": "2026-11-15T00:00:00Z",
            "collection_batch": "batch-1",
            "time_granularity": "monthly",
            "JobVision_PrivateColumn": "drop-me",
        }
    ])
    registry = SourceAdapterRegistry()
    registry.register(adapter)

    report = assess_source_compatibility(
        "labor_market", "fixture", SourceSpec("fixture://records"),
        adapter_registry=registry,
    )

    assert "market_record_id" in report["exact_name_matches"]
    assert "frequency" in report["missing_required_fields"]
    assert "JobVision_PrivateColumn" in report["unsupported_source_fields"]
    assert report["decision"] == "manual_review_required"
    assert report["ingestion_authorized"] is False
    assert report["semantic_mapping_performed"] is False
    assert adapter.iterations == 1


def test_assessment_reports_compatible_and_mismatched_physical_types():
    adapter = FixtureAdapter([
        {
            "market_record_id": 123,
            "skill": "Python",
            "demand_score": "not-a-number",
            "frequency": 10,
            "source": "https://example.org/1",
            "observed_at": "2026-11-15T00:00:00Z",
            "collection_batch": "batch-1",
            "time_granularity": "monthly",
        }
    ])
    registry = SourceAdapterRegistry()
    registry.register(adapter)

    report = assess_source_compatibility(
        "labor_market", "fixture", SourceSpec("fixture://records"),
        adapter_registry=registry,
    )
    statuses = {item["field"]: item["status"] for item in report["type_assessments"]}

    assert statuses["skill"] == "compatible"
    assert statuses["demand_score"] == "mismatch"
    assert statuses["market_record_id"] == "mismatch"


def test_assessment_marks_null_only_fields_as_not_assessable():
    adapter = FixtureAdapter([
        {
            "market_record_id": None,
            "skill": None,
            "demand_score": None,
            "frequency": None,
            "source": None,
            "observed_at": None,
            "collection_batch": None,
            "time_granularity": None,
        }
    ])
    registry = SourceAdapterRegistry()
    registry.register(adapter)

    report = assess_source_compatibility(
        "labor_market", "fixture", SourceSpec("fixture://records"),
        adapter_registry=registry,
    )

    assert all(
        item["status"] == "not_assessable"
        for item in report["type_assessments"]
    )


def test_assessment_does_not_treat_same_name_as_semantic_approval():
    adapter = FixtureAdapter([
        {
            "market_record_id": "LM-001",
            "skill": "Python",
            "demand_score": 4.2,
            "frequency": 100,
            "source": "https://example.org/1",
            "observed_at": "2026-11-15T00:00:00Z",
            "collection_batch": "batch-1",
            "time_granularity": "monthly",
        }
    ])
    registry = SourceAdapterRegistry()
    registry.register(adapter)

    report = assess_source_compatibility(
        "labor_market", "fixture", SourceSpec("fixture://records"),
        adapter_registry=registry,
    )

    assert "skill" in report["exact_name_matches"]
    assert report["semantic_mapping_performed"] is False
    assert report["ingestion_authorized"] is False
    assert report["decision"] == "manual_review_required"


def test_assessment_rejects_invalid_source_spec_before_reading():
    adapter = FixtureAdapter([])
    registry = SourceAdapterRegistry()
    registry.register(adapter)

    with pytest.raises(TypeError, match="SourceSpec"):
        assess_source_compatibility(
            "labor_market", "fixture", "not-a-source",
            adapter_registry=registry,
        )
    assert adapter.iterations == 0


def test_assessment_rejects_unknown_dataset():
    adapter = FixtureAdapter([])
    registry = SourceAdapterRegistry()
    registry.register(adapter)

    with pytest.raises(ValueError, match="not registered"):
        assess_source_compatibility(
            "unknown_dataset", "fixture", SourceSpec("fixture://records"),
            adapter_registry=registry,
        )
    assert adapter.iterations == 0
