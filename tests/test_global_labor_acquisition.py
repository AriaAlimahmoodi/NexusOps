import json
from pathlib import Path

import pytest

from scripts import acquire_global_labor_datasets as acquisition


class FakeESCOClient:
    def __init__(self, pages):
        self.pages = pages
        self.calls = []

    def get_skills_by_scheme(self, **kwargs):
        self.calls.append(("skills", kwargs))
        return self.pages["skills"][kwargs["offset"]]

    def get_occupations_by_scheme(self, **kwargs):
        self.calls.append(("occupations", kwargs))
        return self.pages["occupations"][kwargs["offset"]]


def test_embedded_items_extracts_hal_collection():
    payload = {"_embedded": {"skills": [{"uri": "esco:1"}, {"uri": "esco:2"}]}}
    assert len(acquisition.embedded_items(payload)) == 2


def test_embedded_items_extracts_esco_uri_keyed_collection():
    payload = {
        "_embedded": {
            "http://data.europa.eu/esco/skill/one": {"uri": "esco:one", "title": "one"},
            "http://data.europa.eu/esco/skill/two": {"uri": "esco:two", "title": "two"},
        }
    }
    assert [item["uri"] for item in acquisition.embedded_items(payload)] == [
        "esco:one", "esco:two"
    ]


def test_embedded_items_rejects_unknown_response_shape():
    with pytest.raises(ValueError, match="missing object '_embedded'"):
        acquisition.embedded_items({"unexpected": []})


def test_acquire_esco_pages_by_page_number_and_writes_raw_pages(tmp_path, monkeypatch):
    pages = {
        "skills": {
            0: {"_embedded": {"skills": [{"uri": "s1"}, {"uri": "s2"}]}},
            2: {"_embedded": {"skills": [{"uri": "s3"}]}},
        },
        "occupations": {
            0: {"_embedded": {"occupations": [{"uri": "o1"}]}},
        },
    }
    fake = FakeESCOClient(pages)
    monkeypatch.setattr(acquisition, "ESCOClient", lambda: fake)
    monkeypatch.setattr(acquisition, "RAW_ROOT", tmp_path)
    result = acquisition.acquire_esco(page_size=2, delay_seconds=0)

    assert result["skills"]["complete"] is True
    assert result["skills"]["records_processed_this_run"] == 3
    assert result["occupations"]["complete"] is True
    assert (tmp_path / "esco/api-default/en/skills/page_00000.json").exists()
    assert (tmp_path / "esco/api-default/en/occupations/manifest.json").exists()
    assert [call[1]["offset"] for call in fake.calls if call[0] == "skills"] == [0, 2]


def test_acquire_remotive_reuses_existing_snapshot_without_request(
    tmp_path, monkeypatch
):
    raw_dir = tmp_path / "remotive"
    raw_dir.mkdir()
    payload = {"job-count": 1, "jobs": [{"id": 42, "url": "https://remotive.com/42"}]}
    (raw_dir / "remote_jobs.json").write_text(
        json.dumps(payload), encoding="utf-8"
    )
    monkeypatch.setattr(acquisition, "RAW_ROOT", tmp_path)

    class ForbiddenClient:
        def __init__(self):
            raise AssertionError("Remotive request should not be made")

    monkeypatch.setattr(acquisition, "RemotiveClient", ForbiddenClient)
    result = acquisition.acquire_remotive()
    assert result["records_saved"] == 1
    assert result["complete_for_provider_response"] is True
    assert (raw_dir / "manifest.json").exists()
