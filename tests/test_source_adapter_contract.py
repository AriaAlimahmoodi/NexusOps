import pytest

from tools.adapters.base import (
    SourceAdapter,
    SourceSpec,
    validate_source_adapter,
)
from tools.adapters.csv_adapter import CSVSourceAdapter


def test_source_spec_requires_non_empty_uri():
    with pytest.raises(ValueError, match="uri"):
        SourceSpec(" ")

    with pytest.raises(ValueError, match="mapping"):
        SourceSpec("source.csv", options=["not", "a", "mapping"])


def test_source_spec_copies_and_freezes_options():
    options = {"delimiter": ";"}
    source = SourceSpec("source.csv", options=options)
    options["delimiter"] = ","

    assert source.options["delimiter"] == ";"
    with pytest.raises(TypeError):
        source.options["delimiter"] = ","


def test_csv_adapter_satisfies_universal_contract(tmp_path):
    source_path = tmp_path / "source.csv"
    source_path.write_text(
        "external_id,raw_title\n001,Backend Developer\n",
        encoding="utf-8",
    )
    adapter = CSVSourceAdapter()
    source = SourceSpec(str(source_path))

    assert isinstance(adapter, SourceAdapter)
    validate_source_adapter(adapter)
    assert adapter.format_name == "csv"
    assert list(adapter.iter_records(source)) == [
        {"external_id": "001", "raw_title": "Backend Developer"}
    ]


def test_csv_adapter_accepts_adapter_specific_options(tmp_path):
    source_path = tmp_path / "source.csv"
    source_path.write_text("id;name\n1;Ada\n", encoding="utf-8")

    adapter = CSVSourceAdapter()
    records = adapter.iter_records(
        SourceSpec(str(source_path), options={"delimiter": ";", "strict": True})
    )

    assert list(records) == [{"id": "1", "name": "Ada"}]


def test_csv_adapter_rejects_unknown_options(tmp_path):
    source_path = tmp_path / "source.csv"
    source_path.write_text("id\n1\n", encoding="utf-8")

    with pytest.raises(ValueError, match="Unsupported CSV source option"):
        list(
            CSVSourceAdapter().iter_records(
                SourceSpec(str(source_path), options={"guess_semantics": True})
            )
        )


def test_csv_adapter_requires_source_spec():
    with pytest.raises(TypeError, match="SourceSpec"):
        list(CSVSourceAdapter().iter_records("source.csv"))


def test_csv_adapter_validates_option_types(tmp_path):
    source_path = tmp_path / "source.csv"
    source_path.write_text("id\n1\n", encoding="utf-8")

    with pytest.raises(ValueError, match="strict option"):
        list(
            CSVSourceAdapter().iter_records(
                SourceSpec(str(source_path), options={"strict": "yes"})
            )
        )


def test_adapter_validator_rejects_incomplete_implementations():
    class IncompleteAdapter:
        format_name = "json"

    with pytest.raises(TypeError, match="iter_records"):
        validate_source_adapter(IncompleteAdapter())
