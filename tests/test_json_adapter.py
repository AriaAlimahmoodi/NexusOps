import pytest

from tools.adapters.base import SourceAdapter, SourceSpec, validate_source_adapter
from tools.adapters.json_adapter import (
    JSONSourceAdapter,
    JSONSourceError,
    iter_json_records,
)


def test_reads_json_lines_incrementally_and_preserves_raw_values(tmp_path):
    path = tmp_path / "records.jsonl"
    path.write_text(
        '{"external_id":"001","active":true}\n'
        '\n'
        '{"external_id":"002","score":4.5,"tags":["a","b"]}\n',
        encoding="utf-8",
    )

    assert list(iter_json_records(path)) == [
        {"external_id": "001", "active": True},
        {"external_id": "002", "score": 4.5, "tags": ["a", "b"]},
    ]


def test_reads_json_array_with_small_chunks(tmp_path):
    path = tmp_path / "records.json"
    path.write_text(
        '[{"id":1,"nested":{"x":true}}, {"id":2}, {"id":3}]',
        encoding="utf-8",
    )

    assert list(iter_json_records(path, mode="array", chunk_size=5)) == [
        {"id": 1, "nested": {"x": True}},
        {"id": 2},
        {"id": 3},
    ]


def test_json_array_supports_utf8_bom(tmp_path):
    path = tmp_path / "records.json"
    path.write_text('[{"name":"آریا"}]', encoding="utf-8-sig")

    assert list(iter_json_records(path, mode="array")) == [{"name": "آریا"}]


def test_json_lines_reports_invalid_line(tmp_path):
    path = tmp_path / "records.jsonl"
    path.write_text('{"id":1}\nnot-json\n', encoding="utf-8")

    with pytest.raises(JSONSourceError, match="line 2"):
        list(iter_json_records(path))


@pytest.mark.parametrize(
    "payload",
    ["[1,2]", '[{"id":1}, null]', '["not-an-object"]'],
)
def test_array_rejects_non_object_records(tmp_path, payload):
    path = tmp_path / "records.json"
    path.write_text(payload, encoding="utf-8")

    with pytest.raises(JSONSourceError, match="must be an object"):
        list(iter_json_records(path, mode="array"))


def test_array_rejects_trailing_content(tmp_path):
    path = tmp_path / "records.json"
    path.write_text('[{"id":1}] trailing', encoding="utf-8")

    with pytest.raises(JSONSourceError, match="after JSON array"):
        list(iter_json_records(path, mode="array"))


def test_array_rejects_trailing_comma(tmp_path):
    path = tmp_path / "records.json"
    path.write_text('[{"id":1},]', encoding="utf-8")

    with pytest.raises(JSONSourceError):
        list(iter_json_records(path, mode="array"))


def test_json_adapter_satisfies_universal_contract(tmp_path):
    path = tmp_path / "records.jsonl"
    path.write_text('{"raw_title":"Backend Developer"}\n', encoding="utf-8")
    adapter = JSONSourceAdapter()

    assert isinstance(adapter, SourceAdapter)
    validate_source_adapter(adapter)
    assert adapter.format_name == "json"
    assert list(adapter.iter_records(SourceSpec(str(path)))) == [
        {"raw_title": "Backend Developer"}
    ]


def test_json_adapter_accepts_array_mode_and_rejects_unknown_options(tmp_path):
    path = tmp_path / "records.json"
    path.write_text('[{"id":1}]', encoding="utf-8")
    adapter = JSONSourceAdapter()

    assert list(
        adapter.iter_records(
            SourceSpec(str(path), options={"mode": "array", "chunk_size": 4})
        )
    ) == [{"id": 1}]

    with pytest.raises(ValueError, match="Unsupported JSON source option"):
        list(
            adapter.iter_records(
                SourceSpec(str(path), options={"infer_schema": True})
            )
        )


def test_json_adapter_validates_mode_and_chunk_size(tmp_path):
    path = tmp_path / "records.jsonl"
    path.write_text('{"id":1}\n', encoding="utf-8")

    with pytest.raises(ValueError, match="mode"):
        list(
            JSONSourceAdapter().iter_records(
                SourceSpec(str(path), options={"mode": "document"})
            )
        )

    with pytest.raises(ValueError, match="mode"):
        list(
            JSONSourceAdapter().iter_records(
                SourceSpec(str(path), options={"mode": []})
            )
        )

    with pytest.raises(ValueError, match="chunk_size"):
        list(
            JSONSourceAdapter().iter_records(
                SourceSpec(str(path), options={"chunk_size": 0})
            )
        )


def test_json_lines_rejects_non_object_values(tmp_path):
    path = tmp_path / "records.jsonl"
    path.write_text('{"id":1}\n42\n', encoding="utf-8")

    with pytest.raises(JSONSourceError, match="must be an object"):
        list(iter_json_records(path))


def test_empty_json_array_yields_no_records(tmp_path):
    path = tmp_path / "empty.json"
    path.write_text("[]", encoding="utf-8")

    assert list(iter_json_records(path, mode="array", chunk_size=1)) == []


def test_json_array_requires_top_level_array(tmp_path):
    path = tmp_path / "object.json"
    path.write_text('{"id":1}', encoding="utf-8")

    with pytest.raises(JSONSourceError, match="top-level array"):
        list(iter_json_records(path, mode="array"))
