from urllib.parse import parse_qs, urlparse
import pytest
from tools.source_connectors import ESCOClient, RemotiveClient


def transport_for(payload, captured):
    def send(url, method, headers, body, timeout):
        captured.update(url=url, method=method, headers=headers, body=body)
        return payload
    return send


def test_esco_search_uses_documented_search_endpoint_and_parameters():
    captured = {}
    expected = {"_embedded": {"results": []}}
    client = ESCOClient(transport=transport_for(expected, captured))
    result = client.search_concepts(
        text="Python", language="en", concept_type="Skill",
        limit=15, offset=5, selected_version="1.2.1",
    )
    query = parse_qs(urlparse(captured["url"]).query)
    assert result == expected
    assert urlparse(captured["url"]).path == "/esco/api/search"
    assert query["text"] == ["Python"]
    assert query["type"] == ["Skill"]
    assert query["limit"] == ["15"]
    assert query["offset"] == ["5"]
    assert query["selectedVersion"] == ["1.2.1"]


def test_esco_bulk_fetch_requires_and_sends_scheme_uri():
    captured = {}
    client = ESCOClient(transport=transport_for({"_embedded": {}}, captured))
    client.get_concepts_by_scheme(
        scheme_uri="http://data.europa.eu/esco/concept-scheme/skills"
    )
    query = parse_qs(urlparse(captured["url"]).query)
    assert urlparse(captured["url"]).path == "/esco/api/resource/concept"
    assert query["isInScheme"] == [
        "http://data.europa.eu/esco/concept-scheme/skills"
    ]


@pytest.mark.parametrize("kwargs", [
    {"text": ""}, {"text": "Python", "limit": 0},
    {"text": "Python", "offset": -1},
])
def test_esco_search_validates_arguments(kwargs):
    with pytest.raises(ValueError):
        ESCOClient(transport=transport_for({}, {})).search_concepts(**kwargs)


def test_remotive_fetch_preserves_payload_and_filters():
    captured = {}
    expected = {"job-count": 1, "jobs": [{"id": 123, "title": "Python Engineer"}]}
    client = RemotiveClient(transport=transport_for(expected, captured))
    result = client.get_jobs(search="python", category="software-dev", limit=10)
    query = parse_qs(urlparse(captured["url"]).query)
    assert result == expected
    assert urlparse(captured["url"]).path == "/api/remote-jobs"
    assert query["search"] == ["python"]
    assert query["category"] == ["software-dev"]
    assert query["limit"] == ["10"]


def test_remotive_validates_limit_and_response_shape():
    client = RemotiveClient(transport=transport_for({"jobs": []}, {}))
    with pytest.raises(ValueError):
        client.get_jobs(limit=0)
    broken = RemotiveClient(transport=transport_for({"status": "ok"}, {}))
    with pytest.raises(Exception, match="missing the jobs array"):
        broken.get_jobs()
