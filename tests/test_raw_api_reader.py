import hashlib
import json

import pytest

from tools.source_engine.raw_reader import (
    RawSourceIntegrityError,
    iter_raw_api_records,
)


def _write_acquisition(tmp_path, *, status="completed", alter_page=False):
    config = {
        "id": "fixture-api",
        "name": "Fixture API",
        "response": {"records_path": "data.items", "record_key_mode": "array"},
    }
    pages = tmp_path / "pages"
    pages.mkdir()
    page = pages / "page_00000000.json"
    payload = {"data": {"items": [{"id": 1}, {"id": 2}]}}
    page.write_text(json.dumps(payload), encoding="utf-8")
    digest = hashlib.sha256(page.read_bytes()).hexdigest()
    if alter_page:
        page.write_text(json.dumps({"data": {"items": [{"id": 99}]}}), encoding="utf-8")
    fingerprint = hashlib.sha256(
        json.dumps(config, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    manifest = {
        "source_id": "fixture-api",
        "status": status,
        "pages_completed_total": 1,
        "page_sha256": {"page_00000000.json": digest},
        "raw_pages_preserved": True,
    }
    checkpoint = {
        "source_id": "fixture-api",
        "config_fingerprint": fingerprint,
        "status": status,
        "pages_completed": 1,
    }
    (tmp_path / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    (tmp_path / "checkpoint.json").write_text(json.dumps(checkpoint), encoding="utf-8")
    return config


def test_reads_verified_saved_pages_without_network(tmp_path, monkeypatch):
    config = _write_acquisition(tmp_path)

    def forbidden(*args, **kwargs):
        raise AssertionError("Network access must never occur.")

    monkeypatch.setattr("urllib.request.urlopen", forbidden)
    records = list(iter_raw_api_records(tmp_path, config))
    assert records == [{"id": 1}, {"id": 2}]


def test_rejects_partial_acquisition_by_default(tmp_path):
    config = _write_acquisition(tmp_path, status="partial")
    with pytest.raises(RawSourceIntegrityError, match="not eligible"):
        list(iter_raw_api_records(tmp_path, config))


def test_allows_partial_only_when_explicitly_requested(tmp_path):
    config = _write_acquisition(tmp_path, status="partial")
    assert len(list(iter_raw_api_records(
        tmp_path, config, allow_partial=True
    ))) == 2


def test_rejects_tampered_raw_page_hash(tmp_path):
    config = _write_acquisition(tmp_path, alter_page=True)
    with pytest.raises(RawSourceIntegrityError, match="SHA-256 mismatch"):
        list(iter_raw_api_records(tmp_path, config))


def test_rejects_config_fingerprint_mismatch(tmp_path):
    config = _write_acquisition(tmp_path)
    config["response"]["records_path"] = "items"
    with pytest.raises(RawSourceIntegrityError, match="fingerprint"):
        list(iter_raw_api_records(tmp_path, config))


def test_rejects_missing_page_from_manifest_inventory(tmp_path):
    config = _write_acquisition(tmp_path)
    (tmp_path / "pages" / "page_00000000.json").unlink()
    with pytest.raises(RawSourceIntegrityError):
        list(iter_raw_api_records(tmp_path, config))



def test_rejects_symlinked_manifest_or_checkpoint(tmp_path, monkeypatch):
    config = _write_acquisition(tmp_path)
    original_is_symlink = type(tmp_path).is_symlink

    def marked_symlink(path):
        if path.name in {"manifest.json", "checkpoint.json"}:
            return True
        return original_is_symlink(path)

    monkeypatch.setattr(type(tmp_path), "is_symlink", marked_symlink)
    with pytest.raises(RawSourceIntegrityError, match="Symlinks"):
        list(iter_raw_api_records(tmp_path, config))


def test_rejects_manifest_checkpoint_page_count_mismatch(tmp_path):
    config = _write_acquisition(tmp_path)
    checkpoint_path = tmp_path / "checkpoint.json"
    checkpoint = json.loads(checkpoint_path.read_text(encoding="utf-8"))
    checkpoint["pages_completed"] = 2
    checkpoint_path.write_text(json.dumps(checkpoint), encoding="utf-8")

    with pytest.raises(RawSourceIntegrityError, match="page counts differ"):
        list(iter_raw_api_records(tmp_path, config))
