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


def test_real_ingestion_only_targets_real_index(monkeypatch):
    captured = {}

    def fake_bulk(client, actions, **kwargs):
        captured["actions"] = list(actions)
        captured["kwargs"] = kwargs
        return len(captured["actions"]), []

    monkeypatch.setattr("tools.data_ingestion.bulk", fake_bulk)
    result = ingest_real_records(object(), "labor_market", [record()], manifest())

    assert result["index"] == "labor_market_real"
    assert result["classification"] == "real"
    assert captured["actions"][0]["_index"] == "labor_market_real"
    assert captured["actions"][0]["_id"] == "LM0001"
    assert captured["actions"][0]["_source"]["data_classification"] == "real"
    assert captured["kwargs"]["raise_on_error"] is False


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
