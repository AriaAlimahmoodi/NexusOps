"""Tests for read-only ingestion evidence verification."""
import json
from copy import deepcopy

import pytest

from tools.ingestion_evidence_verifier import verify_ingestion_run_evidence


def valid_published_report():
    return {
        "evidence_schema_version": 1,
        "run_id": "a4b2d33f-9c8e-4f2b-8d6a-4d1f7e4a9b10",
        "status": "published",
        "started_at": "2026-11-15T05:00:00+00:00",
        "finished_at": "2026-11-15T05:00:02+00:00",
        "duration_seconds": 2.0,
        "dataset_id": "labor_market",
        "format_name": "csv",
        "source_name": "Reviewed fixture",
        "collection_batch": "batch-001",
        "mapping": {
            "mapping_id": "mapping-v1",
            "version": 1,
            "source_name": "Reviewed fixture",
            "reviewed_by": "reviewer",
            "reviewed_at": "2026-11-14T12:00:00Z",
            "review_reference": "review://mapping-v1",
        },
        "records_seen": 3,
        "publication_state": "confirmed",
        "publication": {
            "index": "labor_market_real",
            "physical_index": "labor_market_real__v_new",
            "previous_physical_index": "labor_market_real__v_old",
            "collection_batch": "batch-001",
            "processed_records": 3,
            "indexed_records": 3,
            "total_records": 10,
            "publication": "atomic_alias_switch",
            "previous_version_retained": True,
        },
        "error": None,
        "report_persisted": True,
        "ingestion_authorized_by_report": False,
    }


def test_valid_published_report_is_verified_without_external_inspection():
    result = verify_ingestion_run_evidence(valid_published_report())

    assert result["valid"] is True
    assert result["decision"] == "verified"
    assert result["issue_count"] == 0
    assert result["elasticsearch_inspected"] is False
    assert result["semantic_review_verified"] is False
    assert result["ingestion_authorized"] is False


def test_valid_published_report_can_be_read_from_json_file(tmp_path):
    path = tmp_path / "evidence.json"
    path.write_text(
        json.dumps(valid_published_report()),
        encoding="utf-8",
    )

    result = verify_ingestion_run_evidence(path)

    assert result["valid"] is True
    assert result["run_id"] == valid_published_report()["run_id"]


@pytest.mark.parametrize(
    ("mutate", "expected_code"),
    [
        (lambda report: report.update(run_id="not-a-uuid"), "INVALID_RUN_ID"),
        (lambda report: report.update(records_seen=-1), "INVALID_RECORD_COUNT"),
        (lambda report: report["publication"].update(indexed_records=2), "INDEXED_COUNT_MISMATCH"),
        (lambda report: report["publication"].update(total_records=2), "TOTAL_COUNT_TOO_SMALL"),
        (lambda report: report["publication"].update(collection_batch="other"), "PUBLICATION_BATCH_MISMATCH"),
        (lambda report: report["publication"].update(previous_version_retained=False), "PREVIOUS_VERSION_FLAG_MISMATCH"),
        (lambda report: report.update(publication_state="not_confirmed"), "PUBLICATION_STATE_MISMATCH"),
        (lambda report: report.update(ingestion_authorized_by_report=True), "INVALID_AUTHORIZATION_FLAG"),
        (lambda report: report["mapping"].update(source_name="different"), "MAPPING_SOURCE_MISMATCH"),
    ],
)
def test_inconsistent_published_evidence_is_rejected(mutate, expected_code):
    report = valid_published_report()
    mutate(report)

    result = verify_ingestion_run_evidence(report)

    assert result["valid"] is False
    assert expected_code in {issue["code"] for issue in result["issues"]}


def test_failed_run_evidence_is_valid_when_publication_is_not_confirmed():
    report = valid_published_report()
    report.update({
        "status": "failed",
        "publication_state": "not_confirmed",
        "publication": None,
        "records_seen": 1,
        "error": {"type": "ValueError", "issue_counts_by_code": {"INVALID_FIELD": 1}},
    })

    result = verify_ingestion_run_evidence(report)

    assert result["valid"] is True
    assert result["publication_state"] == "not_confirmed"


def test_failed_report_does_not_claim_that_publication_definitely_did_not_happen():
    report = valid_published_report()
    report.update({
        "status": "failed",
        "publication_state": "not_confirmed",
        "publication": None,
        "error": {"type": "RuntimeError", "issue_counts_by_code": {}},
    })

    result = verify_ingestion_run_evidence(report)

    assert result["valid"] is True
    assert result["publication_state"] == "not_confirmed"


def test_evidence_write_failure_preserves_confirmed_publication_state():
    report = valid_published_report()
    report.update({
        "status": "published_evidence_write_failed",
        "report_persisted": False,
        "error": {
            "type": "OSError",
            "stage": "write_evidence_report",
        },
    })

    result = verify_ingestion_run_evidence(report)

    assert result["valid"] is True
    assert result["publication_state"] == "confirmed"


def test_running_or_unknown_status_is_rejected():
    report = valid_published_report()
    report["status"] = "running"

    result = verify_ingestion_run_evidence(report)

    assert result["valid"] is False
    assert "INVALID_FINAL_STATUS" in {issue["code"] for issue in result["issues"]}


@pytest.mark.parametrize("payload", [None, [], "not-an-object", 42])
def test_non_mapping_json_roots_are_rejected(tmp_path, payload):
    path = tmp_path / "invalid.json"
    path.write_text(json.dumps(payload), encoding="utf-8")

    result = verify_ingestion_run_evidence(path)

    assert result["valid"] is False
    assert result["issues"][0]["code"] == "UNREADABLE_REPORT"


def test_missing_required_fields_are_reported():
    result = verify_ingestion_run_evidence({"evidence_schema_version": 1})

    assert result["valid"] is False
    assert "MISSING_REQUIRED_FIELDS" in {issue["code"] for issue in result["issues"]}


def test_verification_does_not_mutate_the_input_report():
    report = valid_published_report()
    original = deepcopy(report)

    verify_ingestion_run_evidence(report)

    assert report == original
