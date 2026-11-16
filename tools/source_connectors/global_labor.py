"""Read-only ESCO and Remotive API clients; no persistence or normalization."""
from __future__ import annotations

from typing import Any
from urllib.parse import urlencode

from tools.source_connectors.us_public_data import ApiRequestError, Transport, _request_json


class ESCOClient:
    """Client for the documented ESCO legacy web-service API.

    ESCO has announced an OpenAPI migration with future API-key authentication.
    Keep this base URL configurable until the Commission publishes the final
    endpoint and authentication contract.
    """
    DEFAULT_BASE_URL = "https://ec.europa.eu/esco/api"

    def __init__(self, *, base_url: str = DEFAULT_BASE_URL, timeout: float = 20.0,
                 transport: Transport | None = None) -> None:
        if not base_url or not base_url.strip():
            raise ValueError("ESCO base_url must be non-empty")
        if timeout <= 0:
            raise ValueError("timeout must be positive")
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._transport = transport

    def search_concepts(self, *, text: str, language: str = "en",
                        concept_type: str = "Skill", limit: int = 20,
                        offset: int = 0, full: bool = False,
                        selected_version: str | None = None,
                        view_obsolete: bool = False) -> dict[str, Any]:
        if not text or not text.strip():
            raise ValueError("text must be non-empty")
        if not language or not language.strip():
            raise ValueError("language must be non-empty")
        if not concept_type or not concept_type.strip():
            raise ValueError("concept_type must be non-empty")
        if not 1 <= limit <= 100:
            raise ValueError("limit must be between 1 and 100")
        if offset < 0:
            raise ValueError("offset cannot be negative")
        params: dict[str, Any] = {
            "text": text.strip(), "language": language.strip(),
            "type": concept_type.strip(), "offset": offset, "limit": limit,
            "full": str(full).lower(), "viewObsolete": str(view_obsolete).lower(),
        }
        if selected_version:
            params["selectedVersion"] = selected_version
        return _request_json(
            provider="ESCO",
            url=f"{self._base_url}/search?{urlencode(params)}",
            timeout=self._timeout,
            transport=self._transport,
        )

    def _get_by_scheme(self, *, resource_type: str, scheme_uri: str,
                       language: str, limit: int, offset: int,
                       selected_version: str | None,
                       view_obsolete: bool) -> dict[str, Any]:
        if resource_type not in {"concept", "skill", "occupation"}:
            raise ValueError("Unsupported ESCO resource_type")
        if not scheme_uri or not scheme_uri.strip():
            raise ValueError("scheme_uri must be non-empty")
        if not language or not language.strip():
            raise ValueError("language must be non-empty")
        if not 1 <= limit <= 100:
            raise ValueError("limit must be between 1 and 100")
        if offset < 0:
            raise ValueError("offset cannot be negative")
        params: dict[str, Any] = {
            "isInScheme": scheme_uri.strip(), "language": language.strip(),
            "offset": offset, "limit": limit,
            "viewObsolete": str(view_obsolete).lower(),
        }
        if selected_version:
            params["selectedVersion"] = selected_version
        return _request_json(
            provider="ESCO",
            url=f"{self._base_url}/resource/{resource_type}?{urlencode(params)}",
            timeout=self._timeout,
            transport=self._transport,
        )

    def get_concepts_by_scheme(self, *, scheme_uri: str, language: str = "en",
                               limit: int = 100, offset: int = 0,
                               selected_version: str | None = None,
                               view_obsolete: bool = False) -> dict[str, Any]:
        return self._get_by_scheme(
            resource_type="concept", scheme_uri=scheme_uri, language=language,
            limit=limit, offset=offset, selected_version=selected_version,
            view_obsolete=view_obsolete,
        )

    def get_skills_by_scheme(self, *, scheme_uri: str, language: str = "en",
                             limit: int = 100, offset: int = 0,
                             selected_version: str | None = None,
                             view_obsolete: bool = False) -> dict[str, Any]:
        return self._get_by_scheme(
            resource_type="skill", scheme_uri=scheme_uri, language=language,
            limit=limit, offset=offset, selected_version=selected_version,
            view_obsolete=view_obsolete,
        )

    def get_occupations_by_scheme(self, *, scheme_uri: str, language: str = "en",
                                  limit: int = 100, offset: int = 0,
                                  selected_version: str | None = None,
                                  view_obsolete: bool = False) -> dict[str, Any]:
        return self._get_by_scheme(
            resource_type="occupation", scheme_uri=scheme_uri, language=language,
            limit=limit, offset=offset, selected_version=selected_version,
            view_obsolete=view_obsolete,
        )


class RemotiveClient:
    """Client for Remotive's public active remote-jobs endpoint."""
    DEFAULT_BASE_URL = "https://remotive.com/api"

    def __init__(self, *, base_url: str = DEFAULT_BASE_URL, timeout: float = 20.0,
                 transport: Transport | None = None) -> None:
        if not base_url or not base_url.strip():
            raise ValueError("Remotive base_url must be non-empty")
        if timeout <= 0:
            raise ValueError("timeout must be positive")
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._transport = transport

    def get_jobs(self, *, search: str | None = None,
                 category: str | None = None,
                 company_name: str | None = None,
                 limit: int | None = None) -> dict[str, Any]:
        """Fetch active jobs. Remotive advises a maximum of four API calls/day."""
        if limit is not None and not 1 <= limit <= 1000:
            raise ValueError("limit must be between 1 and 1000")
        params: dict[str, Any] = {}
        for key, value in (("search", search), ("category", category),
                           ("company_name", company_name)):
            if value is not None:
                if not value.strip():
                    raise ValueError(f"{key} must be non-empty when provided")
                params[key] = value.strip()
        if limit is not None:
            params["limit"] = limit
        query = f"?{urlencode(params)}" if params else ""
        payload = _request_json(
            provider="Remotive",
            url=f"{self._base_url}/remote-jobs{query}",
            timeout=self._timeout,
            transport=self._transport,
        )
        if not isinstance(payload.get("jobs"), list):
            raise ApiRequestError(
                "Remotive", "Remotive response is missing the jobs array.",
                details={"response_keys": sorted(payload.keys())},
            )
        return payload
