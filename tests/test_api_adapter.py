from io import BytesIO
from urllib.error import HTTPError, URLError

import pytest

import tools.adapters.api_adapter as api_module
from tools.adapters.api_adapter import APISourceAdapter, APISourceError
from tools.adapters.base import SourceAdapter, SourceSpec, validate_source_adapter


class FakeResponse(BytesIO):
    pass


def install_response(monkeypatch, payload):
    calls = []

    def fake_urlopen(request, timeout):
        calls.append((request, timeout))
        return FakeResponse(payload)

    monkeypatch.setattr(api_module, "urlopen", fake_urlopen)
    return calls


def test_api_adapter_reads_jsonl_incrementally_and_preserves_values(monkeypatch):
    calls = install_response(
        monkeypatch,
        b'{"external_id":"001","active":true}\\n{"score":4.5}\\n',
    )
    adapter = APISourceAdapter()

    records = list(adapter.iter_records(SourceSpec("https://example.test/jobs")))

    assert records == [
        {"external_id": "001", "active": True},
        {"score": 4.5},
    ]
    request, timeout = calls[0]
    assert request.method == "GET"
    assert request.get_header("Accept") == "application/x-ndjson, application/json"
    assert timeout == 30.0


def test_api_adapter_reads_json_array_with_bounded_chunks(monkeypatch):
    install_response(monkeypatch, b'[{"id":1},{"id":2},{"id":3}]')

    records = list(
        APISourceAdapter().iter_records(
            SourceSpec(
                "https://example.test/jobs",
                options={"mode": "array", "chunk_size": 4},
            )
        )
    )

    assert records == [{"id": 1}, {"id": 2}, {"id": 3}]


def test_api_adapter_passes_custom_headers_and_timeout(monkeypatch):
    calls = install_response(monkeypatch, b'{"id":1}\\n')

    list(
        APISourceAdapter().iter_records(
            SourceSpec(
                "https://example.test/jobs",
                options={
                    "headers": {"Authorization": "Bearer secret", "X-Tenant": "demo"},
                    "timeout": 12,
                },
            )
        )
    )

    request, timeout = calls[0]
    assert request.get_header("Authorization") == "Bearer secret"
    assert request.get_header("X-tenant") == "demo"
    assert timeout == 12.0


def test_api_adapter_satisfies_universal_contract(monkeypatch):
    install_response(monkeypatch, b'{"raw_title":"Backend Developer"}\\n')
    adapter = APISourceAdapter()

    assert isinstance(adapter, SourceAdapter)
    validate_source_adapter(adapter)
    assert adapter.format_name == "api"
    assert list(adapter.iter_records(SourceSpec("https://example.test/jobs"))) == [
        {"raw_title": "Backend Developer"}
    ]


@pytest.mark.parametrize(
    "uri",
    [
        "file:///tmp/jobs.json",
        "ftp://example.test/jobs",
        "https:///missing-host",
        "https://user:password@example.test/jobs",
    ],
)
def test_api_adapter_rejects_unsafe_or_invalid_uri_before_request(monkeypatch, uri):
    def unexpected_request(*args, **kwargs):
        pytest.fail("No HTTP request should be made for an invalid URI.")

    monkeypatch.setattr(api_module, "urlopen", unexpected_request)

    with pytest.raises(ValueError, match="HTTP(S) URL"):
        list(APISourceAdapter().iter_records(SourceSpec(uri)))


def test_api_adapter_rejects_unknown_options_before_request(monkeypatch):
    def unexpected_request(*args, **kwargs):
        pytest.fail("No HTTP request should be made for unsupported options.")

    monkeypatch.setattr(api_module, "urlopen", unexpected_request)

    with pytest.raises(ValueError, match="Unsupported API source option"):
        list(
            APISourceAdapter().iter_records(
                SourceSpec("https://example.test/jobs", options={"paginate": True})
            )
        )


@pytest.mark.parametrize(
    ("options", "message"),
    [
        ({"headers": []}, "headers"),
        ({"headers": {"X-Test": 1}}, "header"),
        ({"timeout": 0}, "timeout"),
        ({"timeout": True}, "timeout"),
        ({"mode": []}, "mode"),
        ({"mode": "document"}, "mode"),
        ({"encoding": ""}, "encoding"),
        ({"chunk_size": 0}, "chunk_size"),
        ({"chunk_size": True}, "chunk_size"),
    ],
)
def test_api_adapter_validates_options_before_request(monkeypatch, options, message):
    def unexpected_request(*args, **kwargs):
        pytest.fail("No HTTP request should be made for invalid options.")

    monkeypatch.setattr(api_module, "urlopen", unexpected_request)

    with pytest.raises(ValueError, match=message):
        list(
            APISourceAdapter().iter_records(
                SourceSpec("https://example.test/jobs", options=options)
            )
        )


def test_api_adapter_converts_http_errors_without_exposing_url(monkeypatch):
    secret_url = "https://example.test/jobs?token=do-not-leak"

    def failed_request(request, timeout):
        raise HTTPError(request.full_url, 401, "Unauthorized", {}, None)

    monkeypatch.setattr(api_module, "urlopen", failed_request)

    with pytest.raises(APISourceError, match="HTTP status 401") as exc_info:
        list(APISourceAdapter().iter_records(SourceSpec(secret_url)))

    assert "do-not-leak" not in str(exc_info.value)


def test_api_adapter_sanitizes_transport_errors(monkeypatch):
    def failed_request(request, timeout):
        raise URLError("failed for https://example.test/?token=secret")

    monkeypatch.setattr(api_module, "urlopen", failed_request)

    with pytest.raises(APISourceError, match="request failed") as exc_info:
        list(APISourceAdapter().iter_records(SourceSpec("https://example.test/jobs")))

    assert "secret" not in str(exc_info.value)


def test_api_adapter_rejects_non_object_json_records(monkeypatch):
    install_response(monkeypatch, b'{"id":1}\\n42\\n')

    with pytest.raises(APISourceError, match="must be an object"):
        list(APISourceAdapter().iter_records(SourceSpec("https://example.test/jobs")))


def test_api_adapter_reports_malformed_json_response(monkeypatch):
    install_response(monkeypatch, b'{"id":1}\\nnot-json\\n')

    with pytest.raises(APISourceError, match="line 2"):
        list(APISourceAdapter().iter_records(SourceSpec("https://example.test/jobs")))


def test_api_adapter_rejects_array_trailing_content(monkeypatch):
    install_response(monkeypatch, b'[{"id":1}] trailing')

    with pytest.raises(APISourceError, match="after JSON array"):
        list(
            APISourceAdapter().iter_records(
                SourceSpec(
                    "https://example.test/jobs", options={"mode": "array"}
                )
            )
        )


def test_api_adapter_closes_response_when_iteration_finishes(monkeypatch):
    response = FakeResponse(b'{"id":1}\\n')
    monkeypatch.setattr(api_module, "urlopen", lambda request, timeout: response)

    assert list(
        APISourceAdapter().iter_records(SourceSpec("https://example.test/jobs"))
    ) == [{"id": 1}]
    assert response.closed
