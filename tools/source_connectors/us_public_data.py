"""Read-only clients for the U.S. College Scorecard and BLS APIs.

These clients return provider payloads unchanged. They do not normalize data,
write to Elasticsearch, or modify NexusOps analytical schemas.
"""

from __future__ import annotations

import json
import re
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


class ApiRequestError(RuntimeError):
    """A safe, provider-aware error for failed external API requests."""

    def __init__(
        self,
        provider: str,
        message: str,
        *,
        status_code: int | None = None,
        details: Any = None,
    ) -> None:
        super().__init__(message)
        self.provider = provider
        self.status_code = status_code
        self.details = details


Transport = Callable[[str, str, dict[str, str], bytes | None, float], Any]


def _stdlib_transport(
    url: str,
    method: str,
    headers: dict[str, str],
    body: bytes | None,
    timeout: float,
) -> Any:
    request = Request(url, data=body, headers=headers, method=method)
    with urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _request_json(
    *,
    provider: str,
    url: str,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    body: dict[str, Any] | None = None,
    timeout: float = 20.0,
    transport: Transport | None = None,
) -> dict[str, Any]:
    if timeout <= 0:
        raise ValueError("timeout must be positive")

    encoded_body = (
        json.dumps(body).encode("utf-8") if body is not None else None
    )
    request_headers = {"Accept": "application/json"}
    if encoded_body is not None:
        request_headers["Content-Type"] = "application/json"
    if headers:
        request_headers.update(headers)

    send = transport or _stdlib_transport
    try:
        payload = send(
            url, method, request_headers, encoded_body, timeout
        )
    except HTTPError as exc:
        # Do not include the request URL: it may contain an API key.
        raise ApiRequestError(
            provider,
            f"{provider} returned HTTP {exc.code}.",
            status_code=exc.code,
        ) from exc
    except URLError as exc:
        raise ApiRequestError(
            provider, f"{provider} connection failed: {exc.reason}"
        ) from exc
    except (TimeoutError, OSError) as exc:
        raise ApiRequestError(
            provider, f"{provider} request failed: {type(exc).__name__}."
        ) from exc
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise ApiRequestError(
            provider, f"{provider} returned invalid JSON."
        ) from exc

    if not isinstance(payload, dict):
        raise ApiRequestError(
            provider, f"{provider} returned an unexpected JSON shape."
        )
    return payload


class CollegeScorecardClient:
    """Read-only client for institution-level College Scorecard API records."""

    DEFAULT_BASE_URL = (
        "https://api.data.gov/ed/collegescorecard/v1/schools"
    )

    def __init__(
        self,
        api_key: str,
        *,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = 20.0,
        transport: Transport | None = None,
    ) -> None:
        if not api_key or not api_key.strip():
            raise ValueError("College Scorecard API key is required")
        if timeout <= 0:
            raise ValueError("timeout must be positive")
        self._api_key = api_key.strip()
        self._base_url = base_url.rstrip("?")
        self._timeout = timeout
        self._transport = transport

    def get_schools(
        self,
        *,
        fields: list[str],
        page: int = 0,
        per_page: int = 100,
        filters: dict[str, str | int | float] | None = None,
        all_programs_nested: bool = False,
    ) -> dict[str, Any]:
        """Fetch one raw API page; no local transformation or persistence."""
        if not fields or any(not str(field).strip() for field in fields):
            raise ValueError("fields must contain at least one non-empty field")
        if page < 0:
            raise ValueError("page cannot be negative")
        if not 1 <= per_page <= 100:
            raise ValueError("per_page must be between 1 and 100")

        params: dict[str, Any] = {
            "api_key": self._api_key,
            "fields": ",".join(fields),
            "page": page,
            "per_page": per_page,
        }
        for key, value in (filters or {}).items():
            if key == "api_key":
                raise ValueError("api_key cannot be overridden in filters")
            if not key or value is None:
                raise ValueError("filter names and values must be non-empty")
            params[key] = value
        if all_programs_nested:
            params["all_programs_nested"] = "true"

        url = f"{self._base_url}?{urlencode(params)}"
        payload = _request_json(
            provider="College Scorecard",
            url=url,
            timeout=self._timeout,
            transport=self._transport,
        )
        if "error" in payload:
            raise ApiRequestError(
                "College Scorecard",
                "College Scorecard reported an API-level error.",
                details=payload["error"],
            )
        if not isinstance(payload.get("results"), list):
            raise ApiRequestError(
                "College Scorecard",
                "College Scorecard response is missing the results array.",
                details={"response_keys": sorted(payload.keys())},
            )
        return payload


class BLSClient:
    """Read-only client for BLS Public Data API v1/v2 time-series data."""

    BASE_URL = "https://api.bls.gov/publicAPI"

    def __init__(
        self,
        *,
        version: int = 1,
        registration_key: str | None = None,
        timeout: float = 20.0,
        transport: Transport | None = None,
    ) -> None:
        if version not in (1, 2):
            raise ValueError("BLS API version must be 1 or 2")
        if version == 2 and not (registration_key and registration_key.strip()):
            raise ValueError(
                "BLS API v2 requires a registration key; use v1 without a key"
            )
        if timeout <= 0:
            raise ValueError("timeout must be positive")
        self.version = version
        self._registration_key = (
            registration_key.strip() if registration_key else None
        )
        self._timeout = timeout
        self._transport = transport

    def get_series(
        self,
        *,
        series_ids: list[str],
        start_year: int,
        end_year: int,
        catalog: bool = False,
        calculations: bool = False,
        annualaverage: bool = False,
    ) -> dict[str, Any]:
        """Fetch raw BLS time-series response for explicitly supplied IDs."""
        if not series_ids:
            raise ValueError("series_ids must not be empty")
        if any(
            not isinstance(series_id, str)
            or not re.fullmatch(r"[A-Z0-9_#-]+", series_id)
            for series_id in series_ids
        ):
            raise ValueError("series IDs contain unsupported characters")
        if len(set(series_ids)) != len(series_ids):
            raise ValueError("series_ids must not contain duplicates")
        if start_year < 1900 or end_year < start_year:
            raise ValueError("invalid BLS year range")

        max_series = 50 if self.version == 2 else 25
        max_years = 20 if self.version == 2 else 10
        if len(series_ids) > max_series:
            raise ValueError(
                f"BLS v{self.version} allows at most {max_series} series per request"
            )
        if end_year - start_year + 1 > max_years:
            raise ValueError(
                f"BLS v{self.version} allows at most {max_years} years per request"
            )

        body: dict[str, Any] = {
            "seriesid": series_ids,
            "startyear": str(start_year),
            "endyear": str(end_year),
        }
        if self.version == 2:
            body["registrationkey"] = self._registration_key
            body["catalog"] = catalog
            body["calculations"] = calculations
            body["annualaverage"] = annualaverage

        url = f"{self.BASE_URL}/v{self.version}/timeseries/data/"
        payload = _request_json(
            provider="BLS",
            url=url,
            method="POST",
            body=body,
            timeout=self._timeout,
            transport=self._transport,
        )
        if payload.get("status") != "REQUEST_SUCCEEDED":
            raise ApiRequestError(
                "BLS",
                "BLS reported that the time-series request did not succeed.",
                details={
                    "status": payload.get("status"),
                    "message": payload.get("message", []),
                },
            )
        return payload
