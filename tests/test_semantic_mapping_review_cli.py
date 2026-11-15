"""Tests for the semantic mapping review operator CLI."""
import json
import sys

import pytest

from scripts import semantic_mapping_review as cli


def _profile():
    return {
        "source_name": "cli-fixture.csv",
        "row_count": 3,
        "columns": {
            "Jobpost_RawTitle": {
                "inferred_type": "string",
                "null_ratio": 0.0,
                "sample_values": ["MUST_NOT_APPEAR_IN_REPORT"],
            },
        },
    }


def _run(monkeypatch, argv):
    monkeypatch.setattr(sys, "argv", ["semantic_mapping_review", *argv])
    return cli.main()


def test_analyze_command_writes_report_and_pending_artifact(tmp_path, monkeypatch, capsys):
    profile_path = tmp_path / "profile.json"
    report_path = tmp_path / "analysis.json"
    artifact_path = tmp_path / "review.json"
    profile_path.write_text(json.dumps(_profile()), encoding="utf-8")

    assert _run(monkeypatch, [
        "analyze", "--profile", str(profile_path),
        "--dataset", "labor_market",
        "--report", str(report_path),
        "--artifact", str(artifact_path),
        "--artifact-id", "artifact-1",
        "--created-by", "operator",
        "--no-ollama",
    ]) == 0

    report = json.loads(report_path.read_text(encoding="utf-8"))
    artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
    summary = json.loads(capsys.readouterr().out)
    assert report["dataset_id"] == "labor_market"
    assert artifact["decisions"]
    assert all(item["decision"] == "pending" for item in artifact["decisions"])
    assert "MUST_NOT_APPEAR_IN_REPORT" not in report_path.read_text(encoding="utf-8")
    assert summary["automatic_approval"] is False
    assert summary["ingestion_authorized"] is False


def test_review_command_applies_decisions_and_preserves_partial_pending_state(
    tmp_path, monkeypatch, capsys
):
    profile_path = tmp_path / "profile.json"
    report_path = tmp_path / "analysis.json"
    artifact_path = tmp_path / "review.json"
    decisions_path = tmp_path / "decisions.json"
    output_path = tmp_path / "reviewed.json"
    profile_path.write_text(json.dumps(_profile()), encoding="utf-8")

    _run(monkeypatch, [
        "analyze", "--profile", str(profile_path), "--dataset", "labor_market",
        "--report", str(report_path), "--artifact", str(artifact_path),
        "--artifact-id", "artifact-1", "--created-by", "operator", "--no-ollama",
    ])
    capsys.readouterr()
    artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
    candidate = next(
        item for item in artifact["decisions"]
        if item["source_field"] == "Jobpost_RawTitle"
        and item["target_field"] == "job_title"
    )
    decisions_path.write_text(json.dumps([{
        "source_field": candidate["source_field"],
        "target_field": candidate["target_field"],
        "decision": "approved",
        "decision_reason": "Verified against the canonical field definition.",
    }]), encoding="utf-8")

    assert _run(monkeypatch, [
        "review", "--artifact", str(artifact_path),
        "--decisions", str(decisions_path), "--output", str(output_path),
        "--reviewed-by", "reviewer", "--reviewed-at", "2026-11-15T06:20:00Z",
    ]) == 0
    reviewed = json.loads(output_path.read_text(encoding="utf-8"))
    assert sum(item["decision"] == "approved" for item in reviewed["decisions"]) == 1
    assert sum(item["decision"] == "pending" for item in reviewed["decisions"]) == (
        len(reviewed["decisions"]) - 1
    )
    assert json.loads(capsys.readouterr().out)["ingestion_authorized"] is False


def test_build_mapping_command_exports_only_approved_candidates(tmp_path, monkeypatch, capsys):
    profile_path = tmp_path / "profile.json"
    report_path = tmp_path / "analysis.json"
    artifact_path = tmp_path / "review.json"
    decisions_path = tmp_path / "decisions.json"
    reviewed_path = tmp_path / "reviewed.json"
    mapping_path = tmp_path / "mapping.json"
    profile_path.write_text(json.dumps(_profile()), encoding="utf-8")

    _run(monkeypatch, [
        "analyze", "--profile", str(profile_path), "--dataset", "labor_market",
        "--report", str(report_path), "--artifact", str(artifact_path),
        "--artifact-id", "artifact-1", "--created-by", "operator", "--no-ollama",
    ])
    artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
    candidate = next(
        item for item in artifact["decisions"]
        if item["source_field"] == "Jobpost_RawTitle"
        and item["target_field"] == "job_title"
    )
    decisions_path.write_text(json.dumps([{
        "source_field": candidate["source_field"],
        "target_field": candidate["target_field"],
        "decision": "approved",
        "decision_reason": "Verified.",
    }]), encoding="utf-8")
    _run(monkeypatch, [
        "review", "--artifact", str(artifact_path),
        "--decisions", str(decisions_path), "--output", str(reviewed_path),
        "--reviewed-by", "reviewer", "--reviewed-at", "2026-11-15T06:20:00Z",
    ])
    capsys.readouterr()

    assert _run(monkeypatch, [
        "build-mapping", "--report", str(report_path),
        "--artifact", str(reviewed_path), "--output", str(mapping_path),
        "--mapping-id", "mapping-1", "--reviewed-by", "reviewer",
        "--reviewed-at", "2026-11-15T06:21:00Z",
        "--review-reference", "review://cli-fixture",
    ]) == 0
    mapping = json.loads(mapping_path.read_text(encoding="utf-8"))
    assert mapping["field_mappings"] == {"Jobpost_RawTitle": "job_title"}
    assert mapping["ingestion_authorized"] is False
    assert json.loads(capsys.readouterr().out)["status"] == "mapping_spec_created"


def test_build_mapping_rejects_artifact_without_approved_candidates(tmp_path, monkeypatch):
    profile_path = tmp_path / "profile.json"
    report_path = tmp_path / "analysis.json"
    artifact_path = tmp_path / "review.json"
    mapping_path = tmp_path / "mapping.json"
    profile_path.write_text(json.dumps(_profile()), encoding="utf-8")
    _run(monkeypatch, [
        "analyze", "--profile", str(profile_path), "--dataset", "labor_market",
        "--report", str(report_path), "--artifact", str(artifact_path),
        "--artifact-id", "artifact-1", "--created-by", "operator", "--no-ollama",
    ])

    with pytest.raises(SystemExit) as error:
        _run(monkeypatch, [
            "build-mapping", "--report", str(report_path),
            "--artifact", str(artifact_path), "--output", str(mapping_path),
            "--mapping-id", "mapping-1", "--reviewed-by", "reviewer",
            "--reviewed-at", "2026-11-15T06:21:00Z",
            "--review-reference", "review://cli-fixture",
        ])
    assert error.value.code == 2
    assert not mapping_path.exists()


def test_review_command_rejects_non_array_decision_input(tmp_path, monkeypatch):
    artifact_path = tmp_path / "artifact.json"
    decisions_path = tmp_path / "decisions.json"
    artifact_path.write_text("{}", encoding="utf-8")
    decisions_path.write_text("{}", encoding="utf-8")
    output_path = tmp_path / "out.json"

    with pytest.raises(SystemExit) as error:
        _run(monkeypatch, [
            "review", "--artifact", str(artifact_path),
            "--decisions", str(decisions_path), "--output", str(output_path),
            "--reviewed-by", "reviewer", "--reviewed-at", "2026-11-15T06:20:00Z",
        ])
    assert error.value.code == 2
    assert not output_path.exists()


def test_cli_parser_requires_subcommand(monkeypatch):
    with pytest.raises(SystemExit) as error:
        _run(monkeypatch, [])
    assert error.value.code == 2
