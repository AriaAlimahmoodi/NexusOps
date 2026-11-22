from unittest.mock import MagicMock

import pytest
from elasticsearch import NotFoundError
from fastapi.testclient import TestClient

from tools.computational_engine.indicators import fpga_indicators
from tools.computational_engine.published_fpga import ALIAS, SCHEMA
from tools.persian_ui import datasets
from tools.persian_ui.app import create_app


class EvidenceStore:
    """Capture Elasticsearch calls at the boundary without a production cluster."""

    def __init__(self):
        self.indices = MagicMock()
        self.documents = {}
        report = fpga_indicators()
        report["competency_scope"] = {"course_id": "525.677.81"}
        self.documents[ALIAS, "fpga"] = {
            "schema": SCHEMA, "classification": "real", "approval_sha256": "fixture", "report": report,
        }

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return None

    def create(self, *, index, id, document, refresh):
        assert index == datasets.INDEX and refresh
        assert (index, id) not in self.documents
        self.documents[index, id] = document

    def get(self, *, index, id):
        from elastic_transport import ApiResponseMeta, NodeConfig

        if (index, id) not in self.documents:
            raise NotFoundError("missing", ApiResponseMeta(404, "1.1", {}, 0, NodeConfig("http", "localhost", 9200)), {})
        return {"_source": self.documents[index, id]}


@pytest.mark.parametrize("kind", ["csv", "json", "api"])
def test_existing_and_new_evidence_in_one_app_session(kind, monkeypatch):
    store = EvidenceStore()
    client = TestClient(create_app(lambda: store))
    assert 'lang="fa" dir="rtl"' in client.get("/").text
    previous = client.post("/api/chat", json={
        "question": "با شواهد منتشرشده FPGA مهارت پرتقاضا و پیشنهاد بازنگری را نشان بده",
    })
    assert "87/120" in previous.json()["answer"]
    rows = b'{"items":[{"name":"VHDL","class":"RTL"},{"name":"vhdl","class":"Digital"},{"name":"MATLAB"}]}'
    if kind == "api":
        monkeypatch.setattr(datasets, "fetch_api", lambda url: (rows, "data.example"))
        intake = client.post("/api/intake/source", json={"url": "https://data.example/skills", "records_path": "items"})
    else:
        data = b"name,class\nVHDL,RTL\nvhdl,Digital\nMATLAB,\n" if kind == "csv" else rows
        intake = client.post(f"/api/intake/file?kind={kind}&records_path=items", content=data,
                             headers={"content-type": "application/octet-stream"})
    assert intake.status_code == 200
    draft = intake.json()
    assert draft["row_count"] == 3 and draft["columns"] == ["class", "name"]
    reviewed = client.post("/api/review", json={
        "draft_id": draft["draft_id"], "dataset_id": "fresh-skills", "title": "دادهٔ تازه",
        "skill_field": "name", "course_field": "class",
    }).json()
    assert reviewed["sample"][0]["skill"] == "vhdl"
    query = {"question": "پرتکرارترین مهارت این دیتاست چیست؟", "dataset_id": "fresh-skills"}
    assert client.post("/api/chat", json=query).status_code == 404
    assert client.post("/api/publish", json={"review_id": reviewed["review_id"], "approved": False}).status_code == 422
    assert (datasets.INDEX, "fresh-skills") not in store.documents
    response = client.post("/api/publish", json={"review_id": reviewed["review_id"], "approved": True})
    assert response.json() == {"dataset_id": "fresh-skills", "row_count": 3}
    result = client.post("/api/chat", json=query).json()
    assert "2 از 3" in result["answer"]
    assert result["evidence"]["skills"]["vhdl"]["source_rows"] == [1, 2]
    assert result["source"]["kind"] == kind


def test_api_rejects_unapproved_origin_before_network(monkeypatch):
    monkeypatch.setenv("NEXUSOPS_INGEST_API_HOSTS", "data.example")
    for url in ("http://data.example", "https://other.example", "https://data.example:9200", "https://user@data.example"):
        with pytest.raises(ValueError, match="HTTPS"):
            datasets.fetch_api(url)
