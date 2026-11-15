"""Streaming HTTP JSON source adapter.

The adapter performs read-only GET requests and yields raw JSON objects. It
does not paginate, map fields, normalize values, validate canonical schemas,
or publish records.
"""
from __future__ import annotations

import io
from collections.abc import Iterator, Mapping
from numbers import Real
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from typing import Any

from tools.adapters.base import SourceSpec
from tools.adapters.json_adapter import (
    JSONSourceError,
    _iter_json_array,
    _iter_json_lines,
)


class APISourceError(ValueError):
    """Raised when an HTTP JSON source cannot be read as raw records."""


class APISourceAdapter:
    """Read a JSONL or JSON-array HTTP endpoint using a streaming GET."""

    format_name = "api"
    _SUPPORTED_OPTIONS = frozenset(
        {"headers", "timeout", "mode", "encoding", "chunk_size"}
    )

    def iter_records(self, source: SourceSpec) -> Iterator[dict[str, Any]]:
        if not isinstance(source, SourceSpec):
            raise TypeError("source must be a SourceSpec instance.")

        unknown = set(source.options) - self._SUPPORTED_OPTIONS
        if unknown:
            raise ValueError(
                f"Unsupported API source option(s): {sorted(unknown)}."
            )

        parsed = urlsplit(source.uri)
        if (
            parsed.scheme not in {"http", "https"}
            or not parsed.hostname
            or parsed.username is not None
            or parsed.password is not None
        ):
            raise ValueError(
                "API source URI must be an HTTP(S) URL without embedded credentials."
            )

        headers = source.options.get("headers", {})
        if not isinstance(headers, Mapping):
            raise ValueError("API headers must be a mapping of strings.")
        normalized_headers: dict[str, str] = {
            "Accept": "application/x-ndjson, application/json"
        }
        for name, value in headers.items():
            if (
                not isinstance(name, str)
                or not name.strip()
                or not isinstance(value, str)
            ):
                raise ValueError("API header names and values must be strings.")
            normalized_headers[name] = value

        timeout = source.options.get("timeout", 30)
        if (
            isinstance(timeout, bool)
            or not isinstance(timeout, Real)
            or timeout <= 0
        ):
            raise ValueError("API timeout must be a positive number.")

        mode = source.options.get("mode", "jsonl")
        if not isinstance(mode, str) or mode not in {"jsonl", "array"}:
            raise ValueError("API mode must be 'jsonl' or 'array'.")

        encoding = source.options.get("encoding", "utf-8-sig")
        if not isinstance(encoding, str) or not encoding.strip():
            raise ValueError("API encoding must be a non-empty string.")

        chunk_size = source.options.get("chunk_size", 65536)
        if (
            isinstance(chunk_size, bool)
            or not isinstance(chunk_size, int)
            or chunk_size < 1
        ):
            raise ValueError("API chunk_size must be a positive integer.")

        request = Request(source.uri, headers=normalized_headers, method="GET")
        try:
            response = urlopen(request, timeout=float(timeout))
        except HTTPError as exc:
            status = exc.code
            if exc.fp is not None:
                exc.close()
            raise APISourceError(
                f"API source returned HTTP status {status}."
            ) from None
        except (URLError, TimeoutError, OSError) as exc:
            # Do not include exception text: it may contain credential-bearing URLs.
            raise APISourceError(
                f"API source request failed ({type(exc).__name__})."
            ) from None

        try:
            with response:
                with io.TextIOWrapper(
                    response, encoding=encoding, newline=""
                ) as stream:
                    try:
                        if mode == "jsonl":
                            yield from _iter_json_lines(stream)
                        else:
                            yield from _iter_json_array(
                                stream, chunk_size=chunk_size
                            )
                    except JSONSourceError as exc:
                        raise APISourceError(str(exc)) from exc
                    except UnicodeError as exc:
                        raise APISourceError(
                            "API response could not be decoded with the configured encoding."
                        ) from exc
        except APISourceError:
            raise
        except OSError as exc:
            raise APISourceError(
                f"API response stream failed ({type(exc).__name__})."
            ) from None
