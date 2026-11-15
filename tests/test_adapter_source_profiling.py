"""Tests for adapter-backed, bounded-memory source profiling."""
import pytest

from tools.adapters.base import SourceSpec
from tools.adapters.registry import SourceAdapterRegistry
from tools.source_discovery import profile_record_stream, profile_source


class FixtureAdapter:
    format_name = "fixture"

    def __init__(self, records):
        self.records = records

    def iter_records(self, source):
        assert isinstance(source, SourceSpec)
        yield from self.records


def test_profile_record_stream_tracks_union_of_fields_and_missing_values():
    report = profile_record_stream(
        iter([
            {"id": 1, "active": True},
            {"id": 2, "name": "Ada"},
            {"id": 3, "name": "Linus", "active": False},
        ])
    )

    assert report["row_count"] == 3
    assert report["column_count"] == 3
    assert report["columns"]["id"]["inferred_type"] == "integer"
    assert report["columns"]["name"]["null_count"] == 1
    assert report["columns"]["name"]["non_null_count"] == 2
    assert report["columns"]["active"]["type_counts"] == {"boolean": 2}
    assert report["columns"]["active"]["null_count"] == 1


def test_profile_record_stream_observes_nested_json_without_mapping_fields():
    report = profile_record_stream([
        {"payload": [{"skill": "Python", "level": "advanced"}]},
        {"payload": [{"skill": "SQL", "level": "basic"}]},
    ])

    payload = report["columns"]["payload"]
    assert payload["inferred_type"] == "json_array"
    assert payload["json_object_keys"] == {"skill": 2, "level": 2}


def test_profile_record_stream_keeps_distinct_value_memory_bounded():
    report = profile_record_stream(
        ({"value": value} for value in ["a", "b", "c", "a"]),
        top_values_limit=2,
        max_distinct_values=2,
    )

    value = report["columns"]["value"]
    assert value["distinct_values_observed"] == 2
    assert value["distinct_values_truncated"] is True
    assert value["top_values"] == [
        {"value": "a", "count": 2},
        {"value": "b", "count": 1},
    ]


def test_profile_record_stream_rejects_non_mapping_records_and_invalid_keys():
    with pytest.raises(ValueError, match="not a mapping"):
        profile_record_stream([["not", "a", "mapping"]])

    with pytest.raises(ValueError, match="field name"):
        profile_record_stream([{"": "invalid"}])


def test_profile_source_dispatches_through_explicit_adapter_registry():
    registry = SourceAdapterRegistry()
    registry.register(FixtureAdapter([{"id": 1}, {"id": 2}]))

    report = profile_source(
        "FIXTURE",
        SourceSpec("fixture://source"),
        adapter_registry=registry,
    )

    assert report["source_name"] == "<FIXTURE-source>"
    assert report["format"] == "records"
    assert report["row_count"] == 2
    assert report["columns"]["id"]["inferred_type"] == "integer"


def test_profile_source_rejects_invalid_source_spec():
    with pytest.raises(TypeError, match="SourceSpec"):
        profile_source("csv", "path.csv")
