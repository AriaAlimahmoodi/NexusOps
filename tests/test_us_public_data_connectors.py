import json
from urllib.parse import parse_qs, urlparse

import pytest

from tools.source_connectors.us_public_data import (
    ApiRequestError,
    BLSClient,
    CollegeScorecardClient,
)


class FakeTransport:
    def __init__(self, payload):
        self.payload = payload
        self.calls = []

    def __call__(self, url, method, headers, body, timeout):
        self.calls.append(
            {
                "url": url,
                "method": method,
                "headers": headers,
                "body": body,
                "timeout": timeout,
            }
        )
        return self.payload


def test_college_scorecard_sends_key_fields_filters_and_pagination():
    transport = FakeTransport({
        "metadata": {"total": 1, "page": 0, "per_page": 10},
        "results": [{"id": 1, "school.name": "Example University"}],
    })
    client = CollegeScorecardClient("test-secret", transport=transport)

    result = client.get_schools(
        fields=["id", "school.name"],
        page=0,
        per_page=10,
        filters={"school.state": "CA"},
    )

    call = transport.calls[0]
    query = parse_qs(urlparse(call["url"]).query)
    assert query["api_key"] == ["test-secret"]
    assert query["fields"] == ["id,school.name"]
    assert query["school.state"] == ["CA"]
    assert query["per_page"] == ["10"]
    assert result["results"][0]["id"] == 1


def test_college_scorecard_requires_key_and_valid_page_size():
    with pytest.raises(ValueError, match="API key"):
        CollegeScorecardClient("")
    client = CollegeScorecardClient("key", transport=FakeTransport({"results": []}))
    with pytest.raises(ValueError, match="per_page"):
        client.get_schools(fields=["id"], per_page=101)


def test_college_scorecard_rejects_provider_error_payload():
    client = CollegeScorecardClient(
        "key",
        transport=FakeTransport({"error": {"code": 401}}),
    )
    with pytest.raises(ApiRequestError, match="API-level error"):
        client.get_schools(fields=["id"])


def test_bls_v1_posts_raw_series_request_without_registration_key():
    transport = FakeTransport({
        "status": "REQUEST_SUCCEEDED",
        "Results": {"series": [{"seriesID": "LNS14000000", "data": []}]},
    })
    client = BLSClient(version=1, transport=transport)

    result = client.get_series(
        series_ids=["LNS14000000"],
        start_year=2020,
        end_year=2024,
    )

    call = transport.calls[0]
    assert call["method"] == "POST"
    assert call["url"].endswith("/v1/timeseries/data/")
    body = json.loads(call["body"])
    assert body["seriesid"] == ["LNS14000000"]
    assert body["startyear"] == "2020"
    assert "registrationkey" not in body
    assert result["status"] == "REQUEST_SUCCEEDED"


def test_bls_v2_includes_registration_key_and_optional_flags():
    transport = FakeTransport({
        "status": "REQUEST_SUCCEEDED",
        "Results": {"series": []},
    })
    client = BLSClient(
        version=2,
        registration_key="bls-key",
        transport=transport,
    )
    client.get_series(
        series_ids=["LNS14000000"],
        start_year=2010,
        end_year=2025,
        catalog=True,
        calculations=True,
        annualaverage=True,
    )
    body = json.loads(transport.calls[0]["body"])
    assert body["registrationkey"] == "bls-key"
    assert body["catalog"] is True
    assert body["calculations"] is True
    assert body["annualaverage"] is True


def test_bls_enforces_version_limits_and_requires_v2_key():
    with pytest.raises(ValueError, match="registration key"):
        BLSClient(version=2)
    client = BLSClient(version=1, transport=FakeTransport({}))
    with pytest.raises(ValueError, match="at most 10 years"):
        client.get_series(
            series_ids=["LNS14000000"],
            start_year=2010,
            end_year=2020,
        )
    with pytest.raises(ValueError, match="at most 25 series"):
        client.get_series(
            series_ids=[f"SERIES{i}" for i in range(26)],
            start_year=2020,
            end_year=2020,
        )


def test_bls_rejects_failed_provider_status():
    client = BLSClient(
        version=1,
        transport=FakeTransport({
            "status": "REQUEST_FAILED",
            "message": ["Invalid series"],
        }),
    )
    with pytest.raises(ApiRequestError, match="did not succeed"):
        client.get_series(
            series_ids=["LNS14000000"],
            start_year=2020,
            end_year=2020,
        )


def test_connectors_do_not_write_or_transform_provider_records():
    scorecard_payload = {
        "metadata": {"total": 1, "page": 0, "per_page": 1},
        "results": [{"id": 1, "school.name": "Example University"}],
    }
    transport = FakeTransport(scorecard_payload)
    client = CollegeScorecardClient("key", transport=transport)
    assert client.get_schools(fields=["id"]) is scorecard_payload
