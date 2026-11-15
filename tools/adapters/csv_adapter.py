"""Streaming, source-neutral CSV reader for ingestion adapters.

The reader preserves source column names and cell values. It does not infer
canonical meaning, rename columns, mutate source files, or publish data.
"""
from __future__ import annotations

import csv
from collections.abc import Iterator
from pathlib import Path
from typing import Any


_EXTRA_COLUMNS_KEY = "__nexusops_extra_columns__"
_DEFAULT_DELIMITERS = (",", ";", "\t", "|")


class CSVSourceError(ValueError):
    """Raised when a CSV source cannot be represented as consistent rows."""


def _detect_delimiter(path: Path, encoding: str, explicit: str | None) -> str:
    if explicit is not None:
        if not isinstance(explicit, str) or len(explicit) != 1:
            raise ValueError("delimiter must be exactly one character.")
        return explicit

    with path.open("r", encoding=encoding, newline="") as stream:
        sample = stream.read(65536)
    try:
        return csv.Sniffer().sniff(
            sample, delimiters="".join(_DEFAULT_DELIMITERS)
        ).delimiter
    except csv.Error:
        return ","


def iter_csv_records(
    path: str | Path,
    *,
    encoding: str = "utf-8-sig",
    delimiter: str | None = None,
    strict: bool = True,
) -> Iterator[dict[str, Any]]:
    """Yield raw CSV rows one at a time with bounded row memory.

    Original headers and string cell values are preserved. A missing trailing
    cell is represented as None; an explicitly empty cell remains an empty
    string. Rows with extra cells or missing trailing cells are rejected when
    strict=True. Completely blank rows are skipped.

    This function is deliberately a reader only: semantic mapping,
    normalization, validation, and publication belong to later pipeline steps.
    """
    source_path = Path(path)
    if not source_path.is_file():
        raise FileNotFoundError(f"CSV source does not exist: {source_path}")
    if not isinstance(encoding, str) or not encoding.strip():
        raise ValueError("encoding must be a non-empty string.")

    detected_delimiter = _detect_delimiter(source_path, encoding, delimiter)

    with source_path.open("r", encoding=encoding, newline="") as stream:
        reader = csv.DictReader(
            stream,
            delimiter=detected_delimiter,
            restkey=_EXTRA_COLUMNS_KEY,
            restval=None,
            strict=True,
        )
        headers = reader.fieldnames
        if not headers:
            raise CSVSourceError("CSV source is empty or has no header row.")
        if any(not isinstance(name, str) or not name.strip() for name in headers):
            raise CSVSourceError("CSV contains an empty column name.")
        if len(set(headers)) != len(headers):
            duplicates = sorted(
                {name for name in headers if headers.count(name) > 1}
            )
            raise CSVSourceError(
                f"CSV contains duplicate column names: {duplicates}"
            )
        if _EXTRA_COLUMNS_KEY in headers:
            raise CSVSourceError(
                f"CSV header uses reserved column name '{_EXTRA_COLUMNS_KEY}'."
            )

        try:
            for row in reader:
                if row is None:
                    continue
                extras = row.pop(_EXTRA_COLUMNS_KEY, None)
                missing = [name for name in headers if row.get(name) is None]
                if extras:
                    raise CSVSourceError(
                        f"CSV row ending at physical line {reader.line_num} "
                        f"contains {len(extras)} extra cell(s)."
                    )
                if strict and missing:
                    raise CSVSourceError(
                        f"CSV row ending at physical line {reader.line_num} "
                        f"is missing trailing cell(s): {missing}."
                    )
                if all(value in (None, "") for value in row.values()):
                    continue
                yield {name: row.get(name) for name in headers}
        except csv.Error as exc:
            raise CSVSourceError(
                f"Malformed CSV near physical line {reader.line_num}: {exc}"
            ) from exc
