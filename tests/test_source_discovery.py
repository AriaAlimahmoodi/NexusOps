import csv
import json
from io import StringIO

import pytest

from tools.source_discovery import profile_csv_stream


def test_profiles_csv_columns_types_nulls_and_top_values():
    source = StringIO(
        "name,age,active,score\n"
        "Ada,37,true,4.5\n"
        "Linus,54,false,4.5\n"
        "Grace,,true,\n"
    )

    report = profile_csv_stream(source, source_name="people.csv")

    assert report["row_count"] == 3
    assert report["column_count"] == 4
    assert report["columns"]["age"]["inferred_type"] == "integer"
    assert report["columns"]["age"]["null_count"] == 1
    assert report["columns"]["active"]["inferred_type"] == "boolean"
    assert report["columns"]["score"]["inferred_type"] == "float"
    assert report["columns"]["score"]["top_values"] == [{"value": "4.5", "count": 2}]


def test_profiles_nested_json_without_source_specific_field_rules():
    source = StringIO()
    writer = csv.writer(source)
    writer.writerow(["post_id", "attributes"])
    writer.writerow(["1", json.dumps([{"name": "Python", "level": "advanced"}])])
    writer.writerow(["2", json.dumps([{"name": "SQL", "level": "basic"}])])
    source.seek(0)

    report = profile_csv_stream(source)

    attributes = report["columns"]["attributes"]
    assert attributes["inferred_type"] == "json_array"
    assert attributes["json_object_keys"] == {"name": 2, "level": 2}
    assert attributes["json_array_item_types"] == {"dict": 2}


def test_profiles_delimited_source_with_explicit_separator():
    source = StringIO("id;region\n1;Madrid\n2;Tehran\n")

    report = profile_csv_stream(source, delimiter=";")

    assert report["delimiter"] == ";"
    assert report["row_count"] == 2


def test_bounds_distinct_value_memory():
    source = StringIO("value\na\nb\nc\na\n")

    report = profile_csv_stream(
        source,
        top_values_limit=2,
        max_distinct_values=2,
    )

    column = report["columns"]["value"]
    assert column["distinct_values_observed"] == 2
    assert column["distinct_values_truncated"] is True
    assert column["top_values"] == [
        {"value": "a", "count": 2},
        {"value": "b", "count": 1},
    ]


def test_rejects_duplicate_or_empty_headers():
    with pytest.raises(ValueError, match="duplicate column"):
        profile_csv_stream(StringIO("id,id\n1,2\n"))

    with pytest.raises(ValueError, match="empty column"):
        profile_csv_stream(StringIO("id,\n1,2\n"))


def test_rejects_invalid_memory_limits():
    with pytest.raises(ValueError, match="max_distinct_values"):
        profile_csv_stream(
            StringIO("value\na\n"),
            top_values_limit=5,
            max_distinct_values=2,
        )


def test_auto_detects_tab_delimited_files():
    source = StringIO(
        "id" + "\t" + "region" + "\n"
        + "1" + "\t" + "Madrid" + "\n"
        + "2" + "\t" + "Tehran" + "\n"
    )

    report = profile_csv_stream(source)

    assert report["delimiter"] == "\t"
    assert report["row_count"] == 2


def test_bounds_nested_json_key_cardinality():
    source = StringIO()
    writer = csv.writer(source)
    writer.writerow(["payload"])
    writer.writerow([json.dumps([{"alpha": 1, "beta": 2}])])
    source.seek(0)

    report = profile_csv_stream(
        source,
        top_values_limit=1,
        max_distinct_values=1,
    )

    column = report["columns"]["payload"]
    assert len(column["json_object_keys"]) == 1
    assert column["json_object_keys_truncated"] is True
