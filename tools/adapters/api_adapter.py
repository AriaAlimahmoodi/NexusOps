"""Configurable HTTP API source adapter.

Supports streaming JSONL/array responses, GET/POST, bounded retries, explicit
pagination, and JSON envelope extraction. It emits raw JSON objects only.
"""
from __future__ import annotations

import io
import json
import time
from collections.abc import Iterator, Mapping
from numbers import Real
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, urlencode, urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen
from typing import Any

from tools.adapters.base import SourceSpec
from tools.adapters.json_adapter import JSONSourceError, _iter_json_array, _iter_json_lines


class APISourceError(ValueError):
    """Raised when an HTTP API source cannot be read as raw records."""


class APISourceAdapter:
    """Read raw JSON objects from HTTP APIs with opt-in pagination and retries."""

    format_name = "api"
    _SUPPORTED_OPTIONS = frozenset({
        "headers", "timeout", "mode", "encoding", "chunk_size", "method",
        "body", "content_type", "retries", "retry_backoff_seconds",
        "retry_statuses", "retry_post", "pagination", "records_path",
    })
    _DEFAULT_RETRY_STATUSES = frozenset({429, 500, 502, 503, 504})

    @staticmethod
    def _validate_url(uri: str) -> None:
        parsed = urlsplit(uri)
        if (
            parsed.scheme not in {"http", "https"} or not parsed.hostname
            or parsed.username is not None or parsed.password is not None
        ):
            raise ValueError(
                "API source URI must be an HTTP(S) URL without embedded credentials."
            )

    @staticmethod
    def _resolve_path(value: Any, path: str, option_name: str) -> Any:
        current = value
        for part in path.split("."):
            if isinstance(current, Mapping) and part in current:
                current = current[part]
            elif isinstance(current, list) and part.isdigit() and int(part) < len(current):
                current = current[int(part)]
            else:
                raise APISourceError(
                    f"Configured {option_name} '{path}' does not exist."
                )
        return current

    @staticmethod
    def _same_origin(first: str, second: str) -> bool:
        a, b = urlsplit(first), urlsplit(second)
        return (
            a.scheme.lower(), a.hostname.lower() if a.hostname else None, a.port
        ) == (
            b.scheme.lower(), b.hostname.lower() if b.hostname else None, b.port
        )

    @staticmethod
    def _with_query_param(url: str, name: str, value: Any) -> str:
        parsed = urlsplit(url)
        query = [(k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True) if k != name]
        query.append((name, str(value)))
        return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urlencode(query), parsed.fragment))

    def _request(
        self, url: str, *, method: str, headers: Mapping[str, str], body: Any,
        content_type: str, timeout: float, retries: int, backoff: float,
        retry_statuses: frozenset[int], retry_allowed: bool,
    ):
        payload = json.dumps(body).encode("utf-8") if method == "POST" else None
        request_headers = dict(headers)
        if method == "POST":
            request_headers.setdefault("Content-Type", content_type)
        attempts = retries + 1 if retry_allowed else 1
        for attempt in range(attempts):
            request = Request(url, data=payload, headers=request_headers, method=method)
            try:
                return urlopen(request, timeout=timeout)
            except HTTPError as exc:
                status = exc.code
                if exc.fp is not None:
                    exc.close()
                if status not in retry_statuses or attempt + 1 >= attempts:
                    raise APISourceError(f"API source returned HTTP status {status}.") from None
            except (URLError, TimeoutError, OSError) as exc:
                if attempt + 1 >= attempts:
                    raise APISourceError(
                        f"API source request failed ({type(exc).__name__})."
                    ) from None
            time.sleep(backoff * (2 ** attempt))
        raise APISourceError("API source request failed after retry attempts.")

    def _read_stream(
        self, response: Any, *, mode: str, encoding: str, chunk_size: int
    ) -> Iterator[dict[str, Any]]:
        with response:
            with io.TextIOWrapper(response, encoding=encoding, newline="") as stream:
                try:
                    if mode == "jsonl":
                        yield from _iter_json_lines(stream)
                    else:
                        yield from _iter_json_array(stream, chunk_size=chunk_size)
                except JSONSourceError as exc:
                    raise APISourceError(str(exc)) from exc
                except UnicodeError as exc:
                    raise APISourceError(
                        "API response could not be decoded with the configured encoding."
                    ) from exc

    def _read_page(
        self, response: Any, *, encoding: str, records_path: str,
        next_url_path: str | None,
    ) -> tuple[list[dict[str, Any]], Any]:
        with response:
            with io.TextIOWrapper(response, encoding=encoding, newline="") as stream:
                try:
                    document = json.load(stream)
                except json.JSONDecodeError as exc:
                    raise APISourceError(f"Invalid JSON API envelope: {exc.msg}.") from exc
        records = self._resolve_path(document, records_path, "records_path")
        if not isinstance(records, list):
            raise APISourceError("The configured records_path must resolve to a JSON array.")
        output: list[dict[str, Any]] = []
        for index, record in enumerate(records, start=1):
            if not isinstance(record, Mapping):
                raise APISourceError(f"API record at envelope item {index} must be an object.")
            output.append(dict(record))
        next_url = (
            self._resolve_path(document, next_url_path, "next_url_path")
            if next_url_path else None
        )
        if next_url is not None and not isinstance(next_url, str):
            raise APISourceError("The configured next_url_path must resolve to a string or null.")
        return output, next_url

    def iter_records(self, source: SourceSpec) -> Iterator[dict[str, Any]]:
        if not isinstance(source, SourceSpec):
            raise TypeError("source must be a SourceSpec instance.")
        options = source.options
        unknown = set(options) - self._SUPPORTED_OPTIONS
        if unknown:
            raise ValueError(f"Unsupported API source option(s): {sorted(unknown)}.")
        self._validate_url(source.uri)

        headers = options.get("headers", {})
        if not isinstance(headers, Mapping):
            raise ValueError("API headers must be a mapping of strings.")
        request_headers = {"Accept": "application/x-ndjson, application/json"}
        for name, value in headers.items():
            if not isinstance(name, str) or not name.strip() or not isinstance(value, str):
                raise ValueError("API header names and values must be strings.")
            request_headers[name] = value

        timeout = options.get("timeout", 30)
        if isinstance(timeout, bool) or not isinstance(timeout, Real) or timeout <= 0:
            raise ValueError("API timeout must be a positive number.")
        mode = options.get("mode", "jsonl")
        if not isinstance(mode, str) or mode not in {"jsonl", "array"}:
            raise ValueError("API mode must be 'jsonl' or 'array'.")
        encoding = options.get("encoding", "utf-8-sig")
        if not isinstance(encoding, str) or not encoding.strip():
            raise ValueError("API encoding must be a non-empty string.")
        chunk_size = options.get("chunk_size", 65536)
        if isinstance(chunk_size, bool) or not isinstance(chunk_size, int) or chunk_size < 1:
            raise ValueError("API chunk_size must be a positive integer.")

        method = options.get("method", "GET")
        if not isinstance(method, str) or method not in {"GET", "POST"}:
            raise ValueError("API method must be 'GET' or 'POST'.")
        if method == "POST" and "body" not in options:
            raise ValueError("API POST requests require an explicit body option.")
        if method == "GET" and "body" in options:
            raise ValueError("API body is supported only with POST.")
        content_type = options.get("content_type", "application/json")
        if not isinstance(content_type, str) or not content_type.strip():
            raise ValueError("API content_type must be a non-empty string.")

        retries = options.get("retries", 0)
        if isinstance(retries, bool) or not isinstance(retries, int) or retries < 0:
            raise ValueError("API retries must be a non-negative integer.")
        backoff = options.get("retry_backoff_seconds", 0.5)
        if isinstance(backoff, bool) or not isinstance(backoff, Real) or backoff < 0:
            raise ValueError("API retry_backoff_seconds must be non-negative.")
        statuses = options.get("retry_statuses", self._DEFAULT_RETRY_STATUSES)
        if not isinstance(statuses, (list, tuple, set, frozenset)) or any(
            isinstance(code, bool) or not isinstance(code, int) or not 100 <= code <= 599
            for code in statuses
        ):
            raise ValueError("API retry_statuses must contain HTTP status integers.")
        statuses = frozenset(statuses)
        retry_post = options.get("retry_post", False)
        if not isinstance(retry_post, bool):
            raise ValueError("API retry_post must be a boolean.")

        records_path = options.get("records_path")
        if records_path is not None and (
            not isinstance(records_path, str) or not records_path.strip()
        ):
            raise ValueError("API records_path must be a non-empty dotted path.")
        pagination = options.get("pagination")
        if pagination is not None and not isinstance(pagination, Mapping):
            raise ValueError("API pagination must be a mapping.")
        page_config = dict(pagination or {})
        strategy = page_config.get("strategy")
        next_path = None
        if pagination is not None:
            if not records_path:
                raise ValueError("API pagination requires records_path.")
            if mode != "array":
                raise ValueError("API pagination and envelope extraction require mode='array'.")
            if strategy == "page":
                allowed = {"strategy", "page_param", "start_page", "max_pages",
                           "page_size_param", "page_size"}
                if set(page_config) - allowed:
                    raise ValueError("Unsupported API page-pagination options.")
                page_param = page_config.get("page_param", "page")
                start_page = page_config.get("start_page", 1)
                max_pages = page_config.get("max_pages", 100)
                size_param, page_size = page_config.get("page_size_param"), page_config.get("page_size")
                if not isinstance(page_param, str) or not page_param.strip():
                    raise ValueError("API pagination page_param must be a non-empty string.")
                if isinstance(start_page, bool) or not isinstance(start_page, int) or start_page < 0:
                    raise ValueError("API pagination start_page must be a non-negative integer.")
                if isinstance(max_pages, bool) or not isinstance(max_pages, int) or max_pages < 1:
                    raise ValueError("API pagination max_pages must be a positive integer.")
                if (size_param is None) != (page_size is None):
                    raise ValueError("page_size_param and page_size must be configured together.")
                if size_param is not None and (
                    not isinstance(size_param, str) or not size_param.strip()
                    or isinstance(page_size, bool) or not isinstance(page_size, int) or page_size < 1
                ):
                    raise ValueError("API pagination page size settings are invalid.")
                if page_size is None:
                    raise ValueError("Page pagination requires page_size to detect the final page.")
            elif strategy == "next_url":
                allowed = {"strategy", "next_url_path", "max_pages"}
                if set(page_config) - allowed:
                    raise ValueError("Unsupported API next-URL pagination options.")
                next_path = page_config.get("next_url_path")
                max_pages = page_config.get("max_pages", 100)
                if not isinstance(next_path, str) or not next_path.strip():
                    raise ValueError("API next-URL pagination requires next_url_path.")
                if isinstance(max_pages, bool) or not isinstance(max_pages, int) or max_pages < 1:
                    raise ValueError("API pagination max_pages must be a positive integer.")
            else:
                raise ValueError("API pagination strategy must be 'page' or 'next_url'.")
        elif records_path is not None:
            if mode != "array":
                raise ValueError("API records_path requires mode='array'.")
            if method == "POST" and not isinstance(options.get("body"), (Mapping, list)):
                raise ValueError("API POST body must be a JSON object or array.")

        retry_allowed = method == "GET" or retry_post
        if pagination is None:
            response = self._request(
                source.uri, method=method, headers=request_headers,
                body=options.get("body"), content_type=content_type,
                timeout=float(timeout), retries=retries,
                backoff=float(backoff), retry_statuses=statuses,
                retry_allowed=retry_allowed,
            )
            yield from self._read_stream(
                response, mode=mode, encoding=encoding, chunk_size=chunk_size
            )
            return

        current_url = source.uri
        seen: set[str] = set()
        for page_index in range(max_pages):
            if strategy == "page":
                current_url = self._with_query_param(
                    source.uri, page_param, start_page + page_index
                )
                if size_param:
                    current_url = self._with_query_param(current_url, size_param, page_size)
            if current_url in seen:
                raise APISourceError("API pagination encountered a repeated page URL.")
            seen.add(current_url)
            response = self._request(
                current_url, method=method, headers=request_headers,
                body=options.get("body"), content_type=content_type,
                timeout=float(timeout), retries=retries,
                backoff=float(backoff), retry_statuses=statuses,
                retry_allowed=retry_allowed,
            )
            records, next_url = self._read_page(
                response, encoding=encoding, records_path=records_path,
                next_url_path=next_path,
            )
            yield from records
            if strategy == "page":
                if len(records) < page_size:
                    return
            else:
                if not next_url:
                    return
                resolved = urljoin(current_url, next_url)
                self._validate_url(resolved)
                if not self._same_origin(source.uri, resolved):
                    raise APISourceError(
                        "API pagination next URL must remain on the original origin."
                    )
                current_url = resolved
        raise APISourceError(
            f"API pagination exceeded the configured max_pages limit ({max_pages})."
        )
