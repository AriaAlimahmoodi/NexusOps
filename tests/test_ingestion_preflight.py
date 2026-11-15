"""Tests for read-only canonical ingestion preflight."""
import pytest

from tools.ingestion_preflight import audit_canonical_record_stream


def valid_record(record_id="LM-001", **overrides):
    value = {
        "market_record_id": record_id,
        "skill": "Python",
        "demand_score": 4.2,
        "frequency": 100,
        "source": "https://example.org/record/1",
        "observed_at": "2026-11-15T00:00:00Z",
        "collection_batch": "preflight-batch",
        "time_granularity": "monthly",
    }
    value.update(overrides)
    return value


def valid_manifest(**overrides):
    value = {
        "collection_batch": "preflight-batch",
        "source_name": "Preflight fixture",
        "source_url": "https://example.org/dataset",
        "publisher": "Test Publisher",
        "retrieved_at": "2026-11-15T00:00:00Z",
        "geographic_scope": "IR",
        "license": "CC-BY-4.0",
        "collection_method": "test fixture",
        "limitations": "Synthetic test fixture",
    }
    value.update(overrides)
    return value


def test_preflight_accepts_valid_stream_without_publishing():
    report = audit_canonical_record_stream(
        "labor_market",
        iter([valid_record(), valid_record("LM-002")]),
        valid_manifest(),
    )

    assert report["decision"] == "preflight_passed"
    assert report["total_records"] == 2
    assert report["valid_records"] == 2
    assert report["invalid_records"] == 0
    assert report["records_published"] == 0
    assert report["elasticsearch_write_performed"] is False
    assert report["alias_changed"] is False


def test_preflight_reports_normalization_and_provenance_issues():
    invalid = valid_record(demand_score="not-numeric", source="")
    report = audit_canonical_record_stream(
        "labor_market", [invalid], valid_manifest()
    )

    assert report["decision"] == "rejected"
    assert report["invalid_records"] == 1
    assert report["issue_counts_by_code"]["INVALID_FIELD_TYPE"] == 1
    assert report["issue_counts_by_code"]["MISSING_PROVENANCE_FIELD"] == 1


def test_preflight_detects_batch_mismatch_and_duplicate_identity():
    first = valid_record()
    second = valid_record(collection_batch="another-batch")
    report = audit_canonical_record_stream(
        "labor_market", [first, second], valid_manifest()
    )

    assert report["issue_counts_by_code"]["COLLECTION_BATCH_MISMATCH"] == 1
    assert report["issue_counts_by_code"]["DUPLICATE_PRIMARY_KEY"] == 1
    assert report["invalid_records"] == 1


def test_preflight_reports_manifest_issues_without_writing():
    manifest = valid_manifest()
    manifest.pop("publisher")
    report = audit_canonical_record_stream(
        "labor_market", [valid_record()], manifest
    )

    assert report["manifest_valid"] is False
    assert report["manifest_issue_count"] == 1
    assert report["decision"] == "rejected"
    assert report["records_published"] == 0


def test_preflight_bounds_issue_samples_but_keeps_complete_counts():
    records = [
        valid_record(f"LM-{index}", demand_score="bad")
        for index in range(5)
    ]
    report = audit_canonical_record_stream(
        "labor_market", records, valid_manifest(), max_issue_samples=2
    )

    assert report["issue_counts_by_code"]["INVALID_FIELD_TYPE"] == 5
    assert len(report["issue_samples"]) == 2
    assert report["issue_samples_truncated"] is True


def test_preflight_rejects_invalid_manifest_type_before_consuming_stream():
    consumed = False

    def records():
        nonlocal consumed
        consumed = True
        yield valid_record()

    with pytest.raises(TypeError, match="manifest"):
        audit_canonical_record_stream("labor_market", records(), [])
    assert consumed is False


@pytest.mark.parametrize("limit", [-1, 1.5, True])
def test_preflight_rejects_invalid_issue_sample_limit(limit):
    with pytest.raises(ValueError, match="max_issue_samples"):
        audit_canonical_record_stream(
            "labor_market", [], valid_manifest(), max_issue_samples=limit
        )


def test_preflight_rejects_unknown_dataset_before_consuming_stream():
    consumed = False

    def records():
        nonlocal consumed
        consumed = True
        yield valid_record()

    with pytest.raises(ValueError, match="not registered"):
        audit_canonical_record_stream(
            "unknown_dataset", records(), valid_manifest()
        )
    assert consumed is False
