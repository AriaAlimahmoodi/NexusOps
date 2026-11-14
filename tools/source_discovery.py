"""Generic, bounded-memory source profiling for tabular datasets.

This module inspects source structure and observed values without knowing the
source's identity or adding source-specific field rules. It does not transform
records, infer canonical semantics, or write to Elasticsearch.
"""
from __future__ import annotations

import csv
import json
import math
from collections import Counter
from datetime import date, datetime
from pathlib import Path
from typing import Any, TextIO


DEFAULT_DELIMITERS = (",", ";", "\\t", "|")
_EXTRA_COLUMNS_KEY = "__nexusops_extra_columns__"


def _is_missing(value: Any) -> bool:
    return value is None or (isinstance(value, str) and not value.strip())


def _infer_scalar_type(value: str) -> tuple[str, Any | None]:
    """Infer a conservative physical type from one CSV cell."""
    text = value.strip()
    if not text:
        return "null", None

    lowered = text.casefold()
    if lowered in {"true", "false"}:
        return "boolean", lowered == "true"

    try:
        integer = int(text)
        return "integer", integer
    except (ValueError, OverflowError):
        pass

    try:
        number = float(text)
        if math.isfinite(number):
            return "float", number
    except (ValueError, OverflowError):
        pass

    try:
        parsed_datetime = datetime.fromisoformat(text.replace("Z", "+00:00"))
        return "datetime", parsed_datetime.isoformat()
    except ValueError:
        pass

    try:
        parsed_date = date.fromisoformat(text)
        return "date", parsed_date.isoformat()
    except ValueError:
        pass

    if text[:1] in {"{", "["}:
        try:
            parsed_json = json.loads(text)
        except (json.JSONDecodeError, TypeError):
            pass
        else:
            if isinstance(parsed_json, dict):
                return "json_object", parsed_json
            if isinstance(parsed_json, list):
                return "json_array", parsed_json

    return "string", text


def _detect_delimiter(stream: TextIO, explicit: str | None) -> str:
    if explicit is not None:
        if len(explicit) != 1:
            raise ValueError("delimiter must be exactly one character.")
        return explicit

    sample = stream.read(65536)
    stream.seek(0)
    try:
        return csv.Sniffer().sniff(sample, delimiters="".join(DEFAULT_DELIMITERS)).delimiter
    except csv.Error:
        return ","


def _new_column_stats() -> dict[str, Any]:
    return {
        "total_values": 0,
        "null_count": 0,
        "non_null_count": 0,
        "type_counts": Counter(),
        "json_object_keys": Counter(),
        "json_array_item_types": Counter(),
        "sample_values": [],
        "value_counts": Counter(),
        "distinct_values_truncated": False,
        "json_object_keys_truncated": False,
        "json_array_item_types_truncated": False,
    }


def _increment_bounded(counter: Counter, key: str, limit: int) -> bool:
    if key in counter:
        counter[key] += 1
        return True
    if len(counter) >= limit:
        return False
    counter[key] += 1
    return True


def _observe_column(
    stats: dict[str, Any],
    raw_value: Any,
    *,
    sample_limit: int,
    max_distinct_values: int,
) -> None:
    stats["total_values"] += 1
    if _is_missing(raw_value):
        stats["null_count"] += 1
        return

    value = str(raw_value).strip()
    stats["non_null_count"] += 1
    inferred_type, parsed = _infer_scalar_type(value)
    stats["type_counts"][inferred_type] += 1

    if len(stats["sample_values"]) < sample_limit:
        stats["sample_values"].append(value[:500])

    if value in stats["value_counts"]:
        stats["value_counts"][value] += 1
    elif len(stats["value_counts"]) < max_distinct_values:
        stats["value_counts"][value] = 1
    else:
        stats["distinct_values_truncated"] = True

    if inferred_type == "json_object":
        for key in parsed:
            if not _increment_bounded(
                stats["json_object_keys"], str(key), max_distinct_values
            ):
                stats["json_object_keys_truncated"] = True
    elif inferred_type == "json_array":
        for item in parsed:
            if not _increment_bounded(
                stats["json_array_item_types"], type(item).__name__,
                max_distinct_values,
            ):
                stats["json_array_item_types_truncated"] = True
            if isinstance(item, dict):
                for key in item:
                    if not _increment_bounded(
                        stats["json_object_keys"], str(key), max_distinct_values
                    ):
                        stats["json_object_keys_truncated"] = True


def _finalize_column(stats: dict[str, Any], top_values_limit: int) -> dict[str, Any]:
    type_counts: Counter = stats["type_counts"]
    inferred_type = "unknown"
    if type_counts:
        highest = max(type_counts.values())
        winners = [name for name, count in type_counts.items() if count == highest]
        inferred_type = winners[0] if len(winners) == 1 else "mixed"

    return {
        "total_values": stats["total_values"],
        "null_count": stats["null_count"],
        "non_null_count": stats["non_null_count"],
        "null_ratio": (
            stats["null_count"] / stats["total_values"]
            if stats["total_values"] else None
        ),
        "inferred_type": inferred_type,
        "type_counts": dict(stats["type_counts"].most_common()),
        "sample_values": stats["sample_values"],
        "top_values": [
            {"value": value[:200], "count": count}
            for value, count in stats["value_counts"].most_common(top_values_limit)
        ],
        "distinct_values_observed": len(stats["value_counts"]),
        "distinct_values_truncated": stats["distinct_values_truncated"],
        "json_object_keys": dict(stats["json_object_keys"].most_common()),
        "json_object_keys_truncated": stats["json_object_keys_truncated"],
        "json_array_item_types": dict(stats["json_array_item_types"].most_common()),
        "json_array_item_types_truncated": stats["json_array_item_types_truncated"],
    }


def profile_csv_stream(
    stream: TextIO,
    *,
    source_name: str = "<stream>",
    delimiter: str | None = None,
    sample_limit: int = 5,
    top_values_limit: int = 10,
    max_distinct_values: int = 1000,
) -> dict[str, Any]:
    """Profile an entire CSV stream while keeping memory bounded by column limits."""
    for name, value in (
        ("sample_limit", sample_limit),
        ("top_values_limit", top_values_limit),
        ("max_distinct_values", max_distinct_values),
    ):
        if not isinstance(value, int) or isinstance(value, bool) or value < 0:
            raise ValueError(f"{name} must be a non-negative integer.")
    if max_distinct_values < top_values_limit:
        raise ValueError("max_distinct_values must be at least top_values_limit.")

    detected_delimiter = _detect_delimiter(stream, delimiter)
    reader = csv.DictReader(
        stream,
        delimiter=detected_delimiter,
        restkey=_EXTRA_COLUMNS_KEY,
        restval=None,
    )
    headers = reader.fieldnames
    if not headers:
        raise ValueError("CSV source is empty or has no header row.")
    if any(not isinstance(header, str) or not header.strip() for header in headers):
        raise ValueError("CSV contains an empty column name.")
    if len(set(headers)) != len(headers):
        duplicates = sorted({header for header in headers if headers.count(header) > 1})
        raise ValueError(f"CSV contains duplicate column names: {duplicates}")

    column_stats = {header: _new_column_stats() for header in headers}
    row_count = 0
    rows_with_extra_columns = 0
    rows_with_missing_cells = 0
    blank_rows = 0

    for row in reader:
        if row is None or all(_is_missing(row.get(header)) for header in headers):
            blank_rows += 1
            continue

        row_count += 1
        if row.get(_EXTRA_COLUMNS_KEY):
            rows_with_extra_columns += 1

        missing_in_row = False
        for header in headers:
            value = row.get(header)
            if _is_missing(value):
                missing_in_row = True
            _observe_column(
                column_stats[header],
                value,
                sample_limit=sample_limit,
                max_distinct_values=max_distinct_values,
            )
        if missing_in_row:
            rows_with_missing_cells += 1

    columns = {
        header: _finalize_column(stats, top_values_limit)
        for header, stats in column_stats.items()
    }
    return {
        "profile_version": 1,
        "source_name": source_name,
        "format": "csv",
        "delimiter": detected_delimiter,
        "row_count": row_count,
        "column_count": len(headers),
        "blank_rows": blank_rows,
        "rows_with_extra_columns": rows_with_extra_columns,
        "rows_with_missing_cells": rows_with_missing_cells,
        "columns": columns,
    }


def profile_csv_file(
    path: str | Path,
    *,
    encoding: str = "utf-8-sig",
    delimiter: str | None = None,
    sample_limit: int = 5,
    top_values_limit: int = 10,
    max_distinct_values: int = 1000,
) -> dict[str, Any]:
    """Open and profile a CSV file without loading the whole file into memory."""
    source_path = Path(path)
    if not source_path.is_file():
        raise FileNotFoundError(f"CSV source does not exist: {source_path}")
    with source_path.open("r", encoding=encoding, newline="") as stream:
        profile = profile_csv_stream(
            stream,
            source_name=source_path.name,
            delimiter=delimiter,
            sample_limit=sample_limit,
            top_values_limit=top_values_limit,
            max_distinct_values=max_distinct_values,
        )
    profile["file_size_bytes"] = source_path.stat().st_size
    return profile
