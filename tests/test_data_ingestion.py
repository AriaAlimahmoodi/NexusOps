import pytest

from tools.data_ingestion import (
    ingest_real_records,
    prepare_real_records,
    validate_collection_manifest,
)


def manifest():
    return {
        "collection_batch": "lm-2026-11-14-001",
        "source_name": "Example Labor Market Dataset",
        "source_url": "https://example.org/data",
        "publisher": "Example Publisher",
        "retrieved_at": "2026-11-14T00:00:00Z",
        "geographic_scope": "ES",
        "license": "CC-BY-4.0",
        "collection_method": "documented API export",
        "limitations": "Illustrative test fixture only",
    }


def record(**overrides):
    value = {
        "market_record_id": "LM0001",
        "skill": "Python",
        "demand_score": 4.5,
        "frequency": 120,
        "source": "https://example.org/data/LM0001",
        "observed_at": "2026-11-14T00:00:00Z",
        "collection_batch": "lm-2026-11-14-001",
        "time_granularity": "daily",
        "published_at": "2026-11-13T00:00:00Z",
        "valid_from": "2026-11-01T00:00:00Z",
        "valid_until": "2026-11-30T23:59:59Z",
    }
    value.update(overrides)
    return value


def test_prepare_real_records_marks_real_and_preserves_source_values():
    prepared = prepare_real_records("labor_market", [record()], manifest())
    assert prepared[0]["data_classification"] == "real"
    assert prepared[0]["market_record_id"] == "LM0001"
    assert prepared[0]["source"] == "https://example.org/data/LM0001"


def test_prepare_real_records_discards_source_only_fields():
    source = record(
        salary_range="not-supported-by-labor-market",
        remote_policy="not-supported-by-labor-market",
    )

    prepared = prepare_real_records("labor_market", [source], manifest())

    assert "salary_range" not in prepared[0]
    assert "remote_policy" not in prepared[0]
    assert prepared[0]["market_record_id"] == "LM0001"


def test_real_batch_is_rejected_atomically_when_provenance_is_missing():
    with pytest.raises(ValueError) as exc:
        prepare_real_records(
            "labor_market",
            [record(), record(market_record_id="LM0002", source="")],
            manifest(),
        )
    assert any(
        issue["code"] == "MISSING_PROVENANCE_FIELD"
        and issue["field"] == "source"
        for issue in exc.value.issues
    )


def test_batch_manifest_must_match_every_record():
    issues = validate_collection_manifest(
        manifest(),
        [record(collection_batch="different-batch")],
    )
    assert any(issue["code"] == "COLLECTION_BATCH_MISMATCH" for issue in issues)


def test_real_ingestion_routes_through_atomic_publisher(monkeypatch):
    captured = {}

    def fake_atomic(client, dataset_id, records, manifest_value):
        captured["client"] = client
        captured["dataset_id"] = dataset_id
        captured["records"] = list(records)
        captured["manifest"] = manifest_value
        return {
            "index": "labor_market_real",
            "classification": "real",
            "publication": "atomic_alias_switch",
        }

    monkeypatch.setattr(
        "tools.atomic_data_publisher.ingest_real_records_atomically",
        fake_atomic,
    )
    client = object()
    result = ingest_real_records(client, "labor_market", [record()], manifest())

    assert result["publication"] == "atomic_alias_switch"
    assert captured["client"] is client
    assert captured["dataset_id"] == "labor_market"
    assert captured["records"][0]["market_record_id"] == "LM0001"
    assert captured["manifest"]["collection_batch"] == "lm-2026-11-14-001"


def test_real_ingestion_rejects_synthetic_classification():
    with pytest.raises(ValueError) as exc:
        prepare_real_records(
            "labor_market",
            [record(data_classification="synthetic")],
            manifest(),
        )
    assert any(
        issue["code"] == "CLASSIFICATION_CONFLICT"
        for issue in exc.value.issues
    )


def test_real_ingestion_rejects_duplicate_primary_keys_in_one_batch():
    with pytest.raises(ValueError) as exc:
        prepare_real_records(
            "labor_market",
            [record(), record()],
            manifest(),
        )
    assert any(
        issue["code"] == "DUPLICATE_PRIMARY_KEY"
        for issue in exc.value.issues
    )


def test_relationship_ingestion_routes_to_atomic_publisher(monkeypatch):
    captured = {}

    def fake_atomic(client, dataset_id, records, manifest_value):
        captured["dataset_id"] = dataset_id
        captured["records"] = list(records)
        return {
            "index": "course_graduate_records_real",
            "publication": "atomic_alias_switch",
        }

    monkeypatch.setattr(
        "tools.atomic_data_publisher.ingest_real_records_atomically",
        fake_atomic,
    )
    manifest_value = manifest()
    relationship = {
        "course_id": "C001",
        "course_name": "Algorithms",
        "graduate_id": "G0001",
        "job_field": "Software",
        "related_skills": ["Python"],
        "source": "https://example.org/records/1",
        "observed_at": "2026-11-14T00:00:00Z",
        "collection_batch": manifest_value["collection_batch"],
        "time_granularity": "annual",
    }

    result = ingest_real_records(
        object(), "course_graduate_records", [relationship], manifest_value
    )

    assert result["publication"] == "atomic_alias_switch"
    assert captured["dataset_id"] == "course_graduate_records"
    assert captured["records"][0]["course_id"] == "C001"
    assert captured["records"][0]["graduate_id"] == "G0001"
