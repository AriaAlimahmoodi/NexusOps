import csv

import pytest

from tools.adapters.csv_adapter import (
    CSVSourceError,
    iter_csv_records,
)


def test_streams_rows_and_preserves_original_headers_and_values(tmp_path):
    source = tmp_path / "source.csv"
    source.write_text(
        "Jobpost_RawTitle,Jobpost_SoftwareSkills\n"
        '"Backend Developer","[{""TitleEn"": ""Python""}]"\n'
        '"Data Engineer","[{""TitleEn"": ""SQL""}]"\n',
        encoding="utf-8",
    )

    records = iter_csv_records(source)

    assert next(records) == {
        "Jobpost_RawTitle": "Backend Developer",
        "Jobpost_SoftwareSkills": '[{"TitleEn": "Python"}]',
    }
    assert next(records) == {
        "Jobpost_RawTitle": "Data Engineer",
        "Jobpost_SoftwareSkills": '[{"TitleEn": "SQL"}]',
    }
    with pytest.raises(StopIteration):
        next(records)


def test_detects_semicolon_delimiter_and_keeps_empty_cells(tmp_path):
    source = tmp_path / "source.csv"
    source.write_text("id;description\n1;\n2;hello\n", encoding="utf-8")

    assert list(iter_csv_records(source)) == [
        {"id": "1", "description": ""},
        {"id": "2", "description": "hello"},
    ]


def test_utf8_sig_is_supported_by_default(tmp_path):
    source = tmp_path / "source.csv"
    source.write_text("name\nÁlvaro\n", encoding="utf-8-sig")

    assert list(iter_csv_records(source)) == [{"name": "Álvaro"}]


def test_skips_completely_blank_rows(tmp_path):
    source = tmp_path / "source.csv"
    source.write_text("id,name\n1,Ada\n,\n2,Linus\n", encoding="utf-8")

    assert list(iter_csv_records(source)) == [
        {"id": "1", "name": "Ada"},
        {"id": "2", "name": "Linus"},
    ]


def test_rejects_duplicate_and_empty_headers(tmp_path):
    duplicate = tmp_path / "duplicate.csv"
    duplicate.write_text("id,id\n1,2\n", encoding="utf-8")
    with pytest.raises(CSVSourceError, match="duplicate"):
        list(iter_csv_records(duplicate))

    empty = tmp_path / "empty-header.csv"
    empty.write_text("id,\n1,2\n", encoding="utf-8")
    with pytest.raises(CSVSourceError, match="empty column"):
        list(iter_csv_records(empty))


def test_strict_mode_rejects_extra_cells(tmp_path):
    source = tmp_path / "extra.csv"
    source.write_text("id,name\n1,Ada,unexpected\n", encoding="utf-8")

    with pytest.raises(CSVSourceError, match="extra cell"):
        list(iter_csv_records(source))


def test_strict_mode_rejects_missing_trailing_cells(tmp_path):
    source = tmp_path / "missing.csv"
    source.write_text("id,name,city\n1,Ada\n", encoding="utf-8")

    with pytest.raises(CSVSourceError, match="missing trailing"):
        list(iter_csv_records(source))


def test_non_strict_mode_retains_missing_and_extra_row_shape(tmp_path):
    missing = tmp_path / "missing.csv"
    missing.write_text("id,name\n1\n", encoding="utf-8")
    assert list(iter_csv_records(missing, strict=False)) == [
        {"id": "1", "name": None}
    ]

    extra = tmp_path / "extra.csv"
    extra.write_text("id,name\n1,Ada,ignored\n", encoding="utf-8")
    assert list(iter_csv_records(extra, strict=False)) == [
        {"id": "1", "name": "Ada"}
    ]


def test_rejects_reserved_internal_header(tmp_path):
    source = tmp_path / "reserved.csv"
    source.write_text(
        f"id,__nexusops_extra_columns__\n1,2\n", encoding="utf-8"
    )
    with pytest.raises(CSVSourceError, match="reserved"):
        list(iter_csv_records(source))


def test_rejects_missing_source(tmp_path):
    with pytest.raises(FileNotFoundError):
        list(iter_csv_records(tmp_path / "missing.csv"))
