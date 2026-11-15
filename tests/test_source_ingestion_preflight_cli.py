from __future__ import annotations

import json
import sys

import pytest

from scripts import audit_source_ingestion_preflight as cli


def _config() -> dict:
    return {
        "dataset_id": "labor_market",
        "format_name": "csv",
        "source": {
            "uri": "sample.csv",
            "options": {"encoding": "utf-8-sig", "strict": True},
        },
        "manifest": {
            "collection_batch": "batch-001",
            "source_name": "sample-source",
        },
        "mapping_spec": {
            "mapping_id": "sample-map-v1",
            "dataset_id": "labor_market",
            "source_name": "sample-source",
            "field_mappings": {
                "RecordID": "market_record_id",
                "Batch": "collection_batch",
                "Source": "source",
                "ObservedAt": "observed_at",
                "Granularity": "time_granularity",
            },
            "reviewed_by": "reviewer",
            "reviewed_at": "2026-11-15T00:00:00+00:00",
            "review_reference": "review-001",
        },
    }


def test_cli_writes_complete_report_and_returns_success(tmp_path, monkeypatch, capsys):
    config_path = tmp_path / "preflight.json"
    output_path = tmp_path / "report.json"
    config_path.write_text(json.dumps(_config()), encoding="utf-8")
    expected = {
        "decision": "preflight_passed",
        "dataset_id": "labor_market",
        "total_records": 2,
        "valid_records": 2,
        "invalid_records": 0,
        "issue_count": 0,
        "records_published": 0,
    }
    captured = {}

    def fake_audit(dataset_id, format_name, source, manifest, **kwargs):
        captured.update({
            "dataset_id": dataset_id,
            "format_name": format_name,
            "source_uri": source.uri,
            "manifest": manifest,
            "mapping_id": kwargs["mapping_spec"].mapping_id,
            "max_issue_samples": kwargs["max_issue_samples"],
        })
        return expected

    monkeypatch.setattr(cli, "audit_source_ingestion_preflight", fake_audit)
    monkeypatch.setattr(
        sys, "argv",
        ["audit_source_ingestion_preflight", "--config", str(config_path),
         "--output", str(output_path), "--max-issue-samples", "7"],
    )

    assert cli.main() == 0
    assert json.loads(output_path.read_text(encoding="utf-8")) == expected
    summary = json.loads(capsys.readouterr().out)
    assert summary["status"] == "preflight_passed"
    assert summary["records_published"] == 0
    assert captured == {
        "dataset_id": "labor_market",
        "format_name": "csv",
        "source_uri": "sample.csv",
        "manifest": _config()["manifest"],
        "mapping_id": "sample-map-v1",
        "max_issue_samples": 7,
    }


def test_cli_returns_nonzero_when_preflight_rejects_source(
    tmp_path, monkeypatch, capsys
):
    config_path = tmp_path / "preflight.json"
    config_path.write_text(json.dumps(_config()), encoding="utf-8")
    monkeypatch.setattr(
        cli, "audit_source_ingestion_preflight",
        lambda *args, **kwargs: {
            "decision": "rejected",
            "dataset_id": "labor_market",
            "issue_count": 1,
            "records_published": 0,
        },
    )
    monkeypatch.setattr(
        sys, "argv",
        ["audit_source_ingestion_preflight", "--config", str(config_path)],
    )

    assert cli.main() == 1
    assert json.loads(capsys.readouterr().out)["decision"] == "rejected"


def test_cli_rejects_unknown_configuration_keys(tmp_path, monkeypatch):
    config = _config()
    config["auto_ingest"] = True
    config_path = tmp_path / "preflight.json"
    config_path.write_text(json.dumps(config), encoding="utf-8")
    monkeypatch.setattr(
        sys, "argv",
        ["audit_source_ingestion_preflight", "--config", str(config_path)],
    )

    with pytest.raises(SystemExit) as error:
        cli.main()
    assert error.value.code == 2


def test_cli_rejects_negative_issue_sample_limit(monkeypatch):
    monkeypatch.setattr(
        sys, "argv",
        ["audit_source_ingestion_preflight", "--config", "unused.json",
         "--max-issue-samples", "-1"],
    )

    with pytest.raises(SystemExit) as error:
        cli.main()
    assert error.value.code == 2
