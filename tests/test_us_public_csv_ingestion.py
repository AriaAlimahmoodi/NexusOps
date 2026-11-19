from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from elasticsearch import ApiError

from scripts.ingest_us_public_csv import _check_elasticsearch, build_source
from test_atomic_data_publisher import FakeClient, install_fake_bulk
from tools.data_ingestion import ingest_source
from tools.source_ingestion_preflight import audit_source_ingestion_preflight


def test_bls_csv_normalizes_and_preserves_the_missing_month(tmp_path, monkeypatch):
    install_fake_bulk(monkeypatch)
    path = tmp_path / "bls.csv"
    path.write_text(
        "series_id,year,period,value,footnote_codes\n"
        "LNS14000000,2025,M09,4.4,\n"
        "LNS14000000,2025,M10,-,\n",
        encoding="utf-8",
    )
    batch, options, _ = build_source("bls", path, "2026-11-19T20:00:00Z")
    assert audit_source_ingestion_preflight(*batch, **options)["valid_records"] == 2

    client = FakeClient()
    result = ingest_source(client, *batch, **options)
    docs = client.documents[client.aliases["us_unemployment_monthly_real"]]
    assert result["indexed_records"] == 2
    assert docs["LNS14000000::2025-09-01T00:00:00"]["unemployment_rate_fraction"] == pytest.approx(0.044)
    assert docs["LNS14000000::2025-10-01T00:00:00"]["unemployment_rate_fraction"] is None


def test_scorecard_csv_calculates_difference_and_preserves_suppression(tmp_path, monkeypatch):
    install_fake_bulk(monkeypatch)
    path = tmp_path / "colleges.csv"
    path.write_text(
        "UNITID,INSTNM,CITY,STABBR,ZIP,CONTROL,PREDDEG,UGDS,TUITIONFEE_IN,TUITIONFEE_OUT\n"
        "100001,Example College,Boston,MA,02115,1,3,500,12000,14000\n"
        "100002,Other College,Boston,MA,02115,1,3,PrivacySuppressed,12000,NA\n",
        encoding="utf-8",
    )
    batch, options, _ = build_source("college-scorecard", path, "2026-11-19T20:00:00Z")
    assert audit_source_ingestion_preflight(*batch, **options)["valid_records"] == 2

    client = FakeClient()
    result = ingest_source(client, *batch, **options)
    docs = client.documents[client.aliases["us_college_institutions_real"]]
    assert result["indexed_records"] == 2
    assert docs["100001"]["postal_code"] == "02115"
    assert docs["100001"]["out_of_state_tuition_difference_usd"] == 2000
    assert docs["100002"]["undergraduate_enrollment"] is None
    assert docs["100002"]["out_of_state_tuition_difference_usd"] is None


def test_connection_check_reports_http_status_without_printing_response():
    client = Mock()
    client.info.side_effect = ApiError(
        "sensitive server response", SimpleNamespace(status=401), {}
    )
    with pytest.raises(RuntimeError, match="HTTP 401") as exc:
        _check_elasticsearch(client)
    assert "sensitive server response" not in str(exc.value)
