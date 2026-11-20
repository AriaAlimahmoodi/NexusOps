import hashlib
import json
import sys

from scripts import profile_raw_api_acquisition


def test_profile_cli_uses_saved_pages_and_writes_review_only_report(
    tmp_path, monkeypatch, capsys
):
    config = {
        "id": "offline-fixture",
        "name": "Offline Fixture",
        "request": {"url": "https://example.invalid/api"},
        "response": {"format": "json", "records_path": "data.items"},
        "pagination": {"strategy": "none"},
    }
    config_path = tmp_path / "source.json"
    config_path.write_text(json.dumps(config), encoding="utf-8")

    raw_directory = tmp_path / "raw"
    pages_directory = raw_directory / "pages"
    pages_directory.mkdir(parents=True)
    document = {
        "data": {
            "items": [
                {
                    "market_record_id": "M-001",
                    "skill": "Python",
                    "demand_score": 4.5,
                    "frequency": 120,
                    "source": "fixture",
                    "observed_at": "2026-01-01T00:00:00Z",
                    "collection_batch": "batch-1",
                    "time_granularity": "snapshot",
                },
                {
                    "market_record_id": "M-002",
                    "skill": "SQL",
                    "demand_score": 4.2,
                    "frequency": 80,
                    "source": "fixture",
                    "observed_at": "2026-01-02T00:00:00Z",
                    "collection_batch": "batch-1",
                    "time_granularity": "snapshot",
                },
            ]
        }
    }
    page_path = pages_directory / "page_00000000.json"
    page_path.write_text(json.dumps(document), encoding="utf-8")
    digest = hashlib.sha256(page_path.read_bytes()).hexdigest()
    fingerprint = hashlib.sha256(
        json.dumps(config, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()

    (raw_directory / "manifest.json").write_text(
        json.dumps({
            "source_id": config["id"],
            "status": "completed",
            "pages_completed_total": 1,
            "page_sha256": {"page_00000000.json": digest},
            "raw_pages_preserved": True,
        }),
        encoding="utf-8",
    )
    (raw_directory / "checkpoint.json").write_text(
        json.dumps({
            "source_id": config["id"],
            "config_fingerprint": fingerprint,
            "status": "completed",
            "pages_completed": 1,
        }),
        encoding="utf-8",
    )

    output_path = tmp_path / "reports" / "profile.json"
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "profile_raw_api_acquisition",
            "--config", str(config_path),
            "--raw-directory", str(raw_directory),
            "--dataset-id", "labor_market",
            "--output", str(output_path),
        ],
    )

    assert profile_raw_api_acquisition.main() == 0

    report = json.loads(output_path.read_text(encoding="utf-8"))
    assert report["acquisition"] == "offline_verified"
    assert report["profile"]["row_count"] == 2
    assert report["profile"]["source_name"] == "Offline Fixture"
    assert report["human_review"]["status"] == "pending"
    assert report["human_review"]["required"] is True
    assert report["human_review"]["mapping_spec_created"] is False
    assert report["human_review"]["ingestion_authorized"] is False
    assert report["elasticsearch_write_performed"] is False
    assert report["alias_changed"] is False

    summary = json.loads(capsys.readouterr().out)
    assert summary["status"] == "completed"
    assert summary["records_profiled"] == 2
    assert summary["elasticsearch_write_performed"] is False
