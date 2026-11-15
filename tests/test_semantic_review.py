"""Tests for durable semantic review artifacts."""
import copy
import json

import pytest

from tools.semantic_mapping_workflow import analyze_source_mapping
from tools.semantic_review import (
    apply_semantic_review_decisions,
    build_mapping_from_review_artifact,
    create_semantic_review_artifact,
)


def _report():
    profile = {
        "source_name": "review-fixture.csv",
        "row_count": 4,
        "columns": {
            "Jobpost_RawTitle": {"inferred_type": "string", "null_ratio": 0.0},
            "UnrecognizedExternalFeature": {"inferred_type": "string", "null_ratio": 0.0},
        },
    }
    return analyze_source_mapping(profile, "labor_market", use_ollama=False)


def _artifact(report):
    return create_semantic_review_artifact(
        report,
        artifact_id="review-001",
        created_by="operator",
        created_at="2026-11-15T06:00:00Z",
    )


def test_artifact_contains_all_candidates_as_pending_and_is_json_serializable():
    report = _report()
    artifact = _artifact(report)

    assert artifact["dataset_id"] == "labor_market"
    assert artifact["source_name"] == "review-fixture.csv"
    assert artifact["analysis_fingerprint"]
    assert artifact["decision_policy"]["ingestion_authorized"] is False
    assert artifact["decisions"]
    assert all(item["decision"] == "pending" for item in artifact["decisions"])
    assert all(item["reviewed_by"] is None for item in artifact["decisions"])
    json.dumps(artifact, allow_nan=False)


def test_partial_decisions_record_reviewer_and_reason_without_auto_approval():
    report = _report()
    artifact = _artifact(report)
    updated = apply_semantic_review_decisions(
        artifact,
        [{
            "source_field": "Jobpost_RawTitle",
            "target_field": "job_title",
            "decision": "approved",
            "decision_reason": "Header meaning and source documentation reviewed.",
        }],
        reviewed_by="reviewer-1",
        reviewed_at="2026-11-15T06:10:00Z",
    )

    approved = next(
        item for item in updated["decisions"]
        if item["source_field"] == "Jobpost_RawTitle"
        and item["target_field"] == "job_title"
    )
    assert approved["decision"] == "approved"
    assert approved["reviewed_by"] == "reviewer-1"
    assert approved["decision_reason"].startswith("Header meaning")
    assert sum(item["decision"] == "approved" for item in updated["decisions"]) == 1
    assert all(
        item["decision"] == "pending"
        for item in artifact["decisions"]
    )


@pytest.mark.parametrize("decision", ["rejected", "deferred", "ambiguous"])
def test_non_approval_decisions_are_preserved_and_never_projected(decision):
    report = _report()
    artifact = _artifact(report)
    reviewed = apply_semantic_review_decisions(
        artifact,
        [{
            "source_field": "Jobpost_RawTitle",
            "target_field": "job_title",
            "decision": decision,
            "decision_reason": "Insufficient evidence for approval.",
        }],
        reviewed_by="reviewer",
        reviewed_at="2026-11-15T06:10:00Z",
    )
    assert reviewed["decisions"][0]["decision"] == decision
    with pytest.raises(ValueError, match="No approved candidates"):
        build_mapping_from_review_artifact(
            report, reviewed,
            mapping_id="mapping-1",
            reviewed_by="reviewer",
            reviewed_at="2026-11-15T06:11:00Z",
            review_reference="review://001",
        )


def test_only_explicitly_approved_eligible_candidates_build_mapping():
    report = _report()
    artifact = _artifact(report)
    reviewed = apply_semantic_review_decisions(
        artifact,
        [{
            "source_field": "Jobpost_RawTitle",
            "target_field": "job_title",
            "decision": "approved",
            "decision_reason": "Reviewed against canonical field definition.",
        }],
        reviewed_by="reviewer",
        reviewed_at="2026-11-15T06:10:00Z",
    )
    mapping = build_mapping_from_review_artifact(
        report, reviewed,
        mapping_id="mapping-1",
        reviewed_by="reviewer",
        reviewed_at="2026-11-15T06:11:00Z",
        review_reference="review://001",
    )
    assert dict(mapping.field_mappings) == {"Jobpost_RawTitle": "job_title"}


def test_artifact_cannot_be_reused_with_modified_or_different_analysis():
    report = _report()
    artifact = _artifact(report)
    modified = copy.deepcopy(report)
    modified["source_name"] = "different-source.csv"

    with pytest.raises(ValueError, match="identity does not match"):
        build_mapping_from_review_artifact(
            modified, artifact,
            mapping_id="mapping-1",
            reviewed_by="reviewer",
            reviewed_at="2026-11-15T06:11:00Z",
            review_reference="review://001",
        )

    modified = copy.deepcopy(report)
    modified["fields"][0]["candidates"][0]["confidence"] = 0.123
    with pytest.raises(ValueError, match="different or modified"):
        build_mapping_from_review_artifact(
            modified, artifact,
            mapping_id="mapping-1",
            reviewed_by="reviewer",
            reviewed_at="2026-11-15T06:11:00Z",
            review_reference="review://001",
        )


@pytest.mark.parametrize(
    "decisions, message",
    [
        ([{"source_field": "missing", "target_field": "job_title", "decision": "approved", "decision_reason": "x"}], "unknown candidate"),
        ([{"source_field": "Jobpost_RawTitle", "target_field": "job_title", "decision": "approved"}], "decision_reason"),
        ([{"source_field": "Jobpost_RawTitle", "target_field": "job_title", "decision": "maybe", "decision_reason": "x"}], "decision must be"),
        ([{"source_field": "Jobpost_RawTitle", "target_field": "job_title", "decision": "approved", "decision_reason": "x"}, {"source_field": "Jobpost_RawTitle", "target_field": "job_title", "decision": "rejected", "decision_reason": "y"}], "Duplicate decision"),
    ],
)
def test_rejects_invalid_review_decisions(decisions, message):
    with pytest.raises((TypeError, ValueError), match=message):
        apply_semantic_review_decisions(
            _artifact(_report()), decisions,
            reviewed_by="reviewer",
            reviewed_at="2026-11-15T06:10:00Z",
        )


def test_rejects_invalid_review_metadata_and_timezone():
    report = _report()
    with pytest.raises(ValueError, match="created_at"):
        create_semantic_review_artifact(
            report, artifact_id="x", created_by="operator",
            created_at="2026-11-15T06:00:00",
        )
    with pytest.raises(ValueError, match="reviewed_at"):
        apply_semantic_review_decisions(
            _artifact(report), [], reviewed_by="reviewer",
            reviewed_at="2026-11-15T06:10:00",
        )


def test_artifact_does_not_copy_raw_profile_values():
    profile = {
        "source_name": "private.csv",
        "columns": {
            "Jobpost_RawTitle": {
                "inferred_type": "string",
                "sample_values": ["PRIVATE_RAW_SAMPLE"],
            }
        },
    }
    report = analyze_source_mapping(profile, "labor_market", use_ollama=False)
    artifact = create_semantic_review_artifact(
        report, artifact_id="safe", created_by="operator",
        created_at="2026-11-15T06:00:00Z",
    )
    assert "PRIVATE_RAW_SAMPLE" not in json.dumps(artifact)
