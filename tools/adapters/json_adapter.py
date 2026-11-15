"""Streaming JSON and JSON Lines source adapter.

Only JSON objects are emitted as raw records. No field mapping, type
normalization, canonical validation, or publication is performed here.
"""
from __future__ import annotations

import json
from collections.abc import Iterator, Mapping
from pathlib import Path
from typing import Any, TextIO

from tools.adapters.base import SourceSpec


class JSONSourceError(ValueError):
    """Raised when a JSON source cannot be represented as raw records."""


def _require_object(value: Any, *, location: str) -> dict[str, Any]:
    if not isinstance(value, Mapping):
        raise JSONSourceError(
            f"JSON record at {location} must be an object, "
            f"not {type(value).__name__}."
        )
    return dict(value)


def _iter_json_lines(stream: TextIO) -> Iterator[dict[str, Any]]:
    for line_number, line in enumerate(stream, start=1):
        if not line.strip():
            continue
        try:
            value = json.loads(line)
        except json.JSONDecodeError as exc:
            raise JSONSourceError(
                f"Invalid JSON Lines record at line {line_number}: {exc.msg}."
            ) from exc
        yield _require_object(value, location=f"line {line_number}")


def _iter_json_array(stream: TextIO, *, chunk_size: int) -> Iterator[dict[str, Any]]:
    decoder = json.JSONDecoder()
    buffer = ""
    position = 0
    eof = False

    def read_more() -> None:
        nonlocal buffer, eof
        chunk = stream.read(chunk_size)
        if chunk:
            buffer += chunk
        else:
            eof = True

    def skip_whitespace() -> None:
        nonlocal buffer, position
        while True:
            while position < len(buffer) and buffer[position].isspace():
                position += 1
            if position < len(buffer) or eof:
                return
            buffer = ""
            position = 0
            read_more()

    def next_value() -> Any:
        nonlocal buffer, position
        while True:
            try:
                value, end = decoder.raw_decode(buffer, position)
                position = end
                return value
            except json.JSONDecodeError as exc:
                if eof:
                    raise JSONSourceError(
                        f"Malformed JSON array near character {position}: {exc.msg}."
                    ) from exc
                # A value may simply be split across input chunks.
                if position:
                    buffer = buffer[position:]
                    position = 0
                read_more()

    skip_whitespace()
    if position >= len(buffer):
        raise JSONSourceError("JSON array source is empty.")
    if buffer[position] != "[":
        raise JSONSourceError("JSON array mode requires a top-level array.")
    position += 1

    record_index = 0
    while True:
        skip_whitespace()
        if position >= len(buffer):
            raise JSONSourceError("Unexpected end of JSON array.")
        if buffer[position] == "]":
            if record_index:
                raise JSONSourceError("Trailing comma in JSON array.")
            position += 1
            skip_whitespace()
            if position < len(buffer):
                raise JSONSourceError("Unexpected content after JSON array.")
            if not eof:
                read_more()
                skip_whitespace()
                if position < len(buffer):
                    raise JSONSourceError("Unexpected content after JSON array.")
            return

        value = next_value()
        record_index += 1
        yield _require_object(value, location=f"array item {record_index}")

        skip_whitespace()
        if position >= len(buffer):
            raise JSONSourceError("Unexpected end of JSON array.")
        separator = buffer[position]
        position += 1
        if separator == ",":
            continue
        if separator == "]":
            skip_whitespace()
            if position < len(buffer):
                raise JSONSourceError("Unexpected content after JSON array.")
            if not eof:
                read_more()
                skip_whitespace()
                if position < len(buffer):
                    raise JSONSourceError("Unexpected content after JSON array.")
            return
        raise JSONSourceError(
            f"Expected ',' or ']' after array item {record_index}."
        )


def iter_json_records(
    path: str | Path,
    *,
    encoding: str = "utf-8-sig",
    mode: str = "jsonl",
    chunk_size: int = 65536,
) -> Iterator[dict[str, Any]]:
    """Yield JSON object records incrementally from JSON Lines or a JSON array.

    JSON Lines mode reads one physical line at a time. Array mode incrementally
    decodes a top-level JSON array, retaining only the current input buffer and
    current record. Blank JSON Lines are skipped; non-object values are rejected.
    """
    source_path = Path(path)
    if not source_path.is_file():
        raise FileNotFoundError(f"JSON source does not exist: {source_path}")
    if not isinstance(encoding, str) or not encoding.strip():
        raise ValueError("encoding must be a non-empty string.")
    if not isinstance(mode, str) or mode not in {"jsonl", "array"}:
        raise ValueError("JSON mode must be 'jsonl' or 'array'.")
    if isinstance(chunk_size, bool) or not isinstance(chunk_size, int) or chunk_size < 1:
        raise ValueError("chunk_size must be a positive integer.")

    with source_path.open("r", encoding=encoding, newline="") as stream:
        if mode == "jsonl":
            yield from _iter_json_lines(stream)
        else:
            yield from _iter_json_array(stream, chunk_size=chunk_size)


class JSONSourceAdapter:
    """JSON implementation of the universal source adapter contract."""

    format_name = "json"
    _SUPPORTED_OPTIONS = frozenset({"encoding", "mode", "chunk_size"})

    def iter_records(self, source: SourceSpec) -> Iterator[dict[str, Any]]:
        if not isinstance(source, SourceSpec):
            raise TypeError("source must be a SourceSpec instance.")

        unknown = set(source.options) - self._SUPPORTED_OPTIONS
        if unknown:
            raise ValueError(
                f"Unsupported JSON source option(s): {sorted(unknown)}."
            )

        encoding = source.options.get("encoding", "utf-8-sig")
        mode = source.options.get("mode", "jsonl")
        chunk_size = source.options.get("chunk_size", 65536)

        if not isinstance(encoding, str) or not encoding.strip():
            raise ValueError("JSON encoding must be a non-empty string.")
        if mode not in {"jsonl", "array"}:
            raise ValueError("JSON mode must be 'jsonl' or 'array'.")
        if (
            isinstance(chunk_size, bool)
            or not isinstance(chunk_size, int)
            or chunk_size < 1
        ):
            raise ValueError("JSON chunk_size must be a positive integer.")

        return iter_json_records(
            source.uri,
            encoding=encoding,
            mode=mode,
            chunk_size=chunk_size,
        )
