from __future__ import annotations

import importlib


def _load_preflight(monkeypatch):
    monkeypatch.setenv("ELASTICSEARCH_PASSWORD", "test-only-not-used")
    return importlib.import_module("scripts.runtime_preflight")


class FakeIndices:
    def __init__(self, existing):
        self.existing = set(existing)
        self.checked = []

    def exists(self, *, index):
        self.checked.append(index)
        return index in self.existing


class FakeClient:
    def __init__(self, existing):
        self.indices = FakeIndices(existing)
        self.closed = False

    def info(self):
        return {
            "cluster_name": "test-cluster",
            "version": {"number": "9.5.5"},
        }

    def close(self):
        self.closed = True


def test_preflight_requires_every_registered_elasticsearch_index(monkeypatch):
    preflight = _load_preflight(monkeypatch)
    client = FakeClient({"graduates", "courses"})
    monkeypatch.setattr(preflight, "get_elasticsearch_client", lambda: client)
    monkeypatch.setattr(
        preflight,
        "list_registered_datasets",
        lambda: [
            {"dataset_id": "graduates", "index": "graduates"},
            {"dataset_id": "courses", "index": "courses"},
        ],
    )

    result = preflight.check_elasticsearch()

    assert result["ok"] is True
    assert result["cluster_name"] == "test-cluster"
    assert result["version"] == "9.5.5"
    assert result["missing_indices"] == []
    assert result["required_indices"] == {
        "graduates": {"index": "graduates", "exists": True},
        "courses": {"index": "courses", "exists": True},
    }
    assert client.indices.checked == ["graduates", "courses"]
    assert client.closed is True


def test_preflight_fails_when_a_registered_index_is_missing(monkeypatch):
    preflight = _load_preflight(monkeypatch)
    client = FakeClient({"graduates"})
    monkeypatch.setattr(preflight, "get_elasticsearch_client", lambda: client)
    monkeypatch.setattr(
        preflight,
        "list_registered_datasets",
        lambda: [
            {"dataset_id": "graduates", "index": "graduates"},
            {"dataset_id": "courses", "index": "courses"},
        ],
    )

    result = preflight.check_elasticsearch()

    assert result["ok"] is False
    assert result["missing_indices"] == ["courses"]
    assert result["required_indices"]["courses"]["exists"] is False
    assert client.closed is True


def test_preflight_reports_index_inspection_failure_and_closes_client(monkeypatch):
    preflight = _load_preflight(monkeypatch)
    client = FakeClient({"graduates"})

    def fail_exists(*, index):
        raise RuntimeError(f"cannot inspect {index}")

    client.indices.exists = fail_exists
    monkeypatch.setattr(preflight, "get_elasticsearch_client", lambda: client)
    monkeypatch.setattr(
        preflight,
        "list_registered_datasets",
        lambda: [{"dataset_id": "graduates", "index": "graduates"}],
    )

    result = preflight.check_elasticsearch()

    assert result["ok"] is False
    assert result["error_type"] == "RuntimeError"
    assert "cannot inspect graduates" in result["message"]
    assert client.closed is True
