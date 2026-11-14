"""Local Ollama-assisted semantic suggestions for source schema discovery.

The deterministic matcher remains authoritative. This module only returns
validated suggestions; it never mutates schemas, profiles, or source records.
"""
from __future__ import annotations

import json
import math
import os
from http.client import HTTPException
from typing import Any, Callable, Iterable
from urllib.error import URLError
from urllib.request import Request, urlopen


DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434"
DEFAULT_OLLAMA_MODEL = "qwen3:4b"
DEFAULT_TIMEOUT_SECONDS = 30.0

_MATCH_RELATIONS = {
    "exact_equivalent",
    "synonym",
    "related_not_equivalent",
    "not_equivalent",
    "uncertain",
}
_PAIR_RELATIONS = {
    "translation",
    "possible_translation",
    "related_not_equivalent",
    "not_equivalent",
    "uncertain",
}


def _valid_confidence(value: Any) -> bool:
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        return False
    try:
        number = float(value)
    except (OverflowError, ValueError):
        return False
    return math.isfinite(number) and 0.0 <= number <= 1.0


def _build_catalog(
    dataset_profiles: Iterable[dict[str, Any]],
) -> tuple[list[dict[str, Any]], set[tuple[str, str]]]:
    catalog: list[dict[str, Any]] = []
    allowed_targets: set[tuple[str, str]] = set()
    for profile in dataset_profiles:
        if not isinstance(profile, dict):
            continue
        dataset_id = profile.get("dataset_id")
        fields = profile.get("fields", {})
        if not isinstance(dataset_id, str) or not dataset_id or not isinstance(fields, dict):
            continue
        for field_name, config in fields.items():
            if not isinstance(field_name, str) or not isinstance(config, dict):
                continue
            target = (dataset_id, field_name)
            allowed_targets.add(target)
            roles = config.get("roles", [])
            catalog.append({
                "dataset_id": dataset_id,
                "field": field_name,
                "type": config.get("type", "unknown"),
                "roles": list(roles) if isinstance(roles, (list, tuple)) else [],
            })
    return catalog, allowed_targets


class OllamaSemanticAssistant:
    """Call a local Ollama chat endpoint and validate its JSON suggestions."""

    def __init__(
        self,
        *,
        base_url: str | None = None,
        model: str | None = None,
        timeout: float | None = None,
        opener: Callable[..., Any] | None = None,
    ) -> None:
        self.base_url = (
            base_url or os.getenv("NEXUSOPS_OLLAMA_URL", DEFAULT_OLLAMA_URL)
        ).rstrip("/")
        self.model = model or os.getenv("NEXUSOPS_OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL)
        raw_timeout = timeout
        if raw_timeout is None:
            raw_timeout = float(os.getenv(
                "NEXUSOPS_OLLAMA_TIMEOUT_SECONDS",
                str(DEFAULT_TIMEOUT_SECONDS),
            ))
        if not isinstance(raw_timeout, (int, float)) or isinstance(raw_timeout, bool):
            raise ValueError("timeout must be a positive number.")
        if not math.isfinite(float(raw_timeout)) or raw_timeout <= 0:
            raise ValueError("timeout must be a positive number.")
        if not self.base_url.startswith(("http://", "https://")):
            raise ValueError("base_url must use http or https.")
        if not isinstance(self.model, str) or not self.model.strip():
            raise ValueError("model must be a non-empty string.")
        self.timeout = float(raw_timeout)
        self._opener = opener or urlopen

    def analyze(
        self,
        source_profile: dict[str, Any],
        dataset_profiles: Iterable[dict[str, Any]],
    ) -> dict[str, Any]:
        """Return registry-validated LLM suggestions for profiled headers.

        Only source header names and inferred physical types are sent to Ollama.
        Raw records, sample values, and full column distributions are not sent.
        """
        columns = source_profile.get("columns") if isinstance(source_profile, dict) else None
        if not isinstance(columns, dict):
            raise ValueError("source_profile must contain a columns mapping.")

        source_fields = [
            {
                "field": str(name),
                "type": (
                    stats.get("inferred_type", "unknown")
                    if isinstance(stats, dict) else "unknown"
                ),
            }
            for name, stats in columns.items()
        ]
        catalog, allowed_targets = _build_catalog(dataset_profiles)
        source_names = {item["field"] for item in source_fields}
        prompt_payload = {
            "source_fields": source_fields,
            "canonical_fields": catalog,
        }
        system_prompt = (
            "You are a conservative data-schema semantic reviewer. "
            "Compare source headers with the supplied canonical registry only. "
            "Never invent a source field, dataset, or canonical field. "
            "Do not equate related but different concepts. In particular, "
            "required experience in years is not employment duration in months; "
            "job-ad academic requirements are not a graduate's own major. "
            "Identify likely Persian/English header pairs, including obvious "
            "header spelling variants, but label uncertain cases as uncertain. "
            "Return only valid JSON with exactly these top-level keys: "
            "suggestions and bilingual_pair_suggestions. Use the exact key "
            "bilingual_pair_suggestions, not an abbreviation or synonym. "
            "Each suggestion has source_field, candidate_dataset_id, "
            "candidate_field, relation, confidence, rationale. relation must be "
            "one of exact_equivalent, synonym, related_not_equivalent, "
            "not_equivalent, uncertain. Each bilingual pair has source_fields "
            "(exactly two supplied header names), relation, confidence, rationale. "
            "Pair relation must be one of translation, possible_translation, "
            "related_not_equivalent, not_equivalent, uncertain. confidence is "
            "a number from 0 to 1. Do not claim value equivalence from header names."
        )
        request_body = {
            "model": self.model,
            "stream": False,
            "format": "json",
            "options": {"temperature": 0},
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": json.dumps(prompt_payload, ensure_ascii=False),
                },
            ],
        }
        request = Request(
            f"{self.base_url}/api/chat",
            data=json.dumps(request_body, ensure_ascii=False).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with self._opener(request, timeout=self.timeout) as response:
                response_payload = json.loads(response.read().decode("utf-8"))
        except (URLError, TimeoutError, OSError, HTTPException):
            return self._unavailable("ollama_unavailable")
        except (UnicodeDecodeError, json.JSONDecodeError, AttributeError, TypeError):
            return self._unavailable("invalid_http_response")

        message = response_payload.get("message") if isinstance(response_payload, dict) else None
        content = message.get("content") if isinstance(message, dict) else None
        if not isinstance(content, str):
            return self._unavailable("invalid_model_response")
        try:
            model_output = json.loads(content)
        except json.JSONDecodeError:
            return self._unavailable("invalid_model_json")

        if not isinstance(model_output, dict):
            return self._unavailable("invalid_model_output")
        raw_suggestions = model_output.get("suggestions")

        # Qwen3 may emit the shorter "bilingual_pairs" key despite the prompt.
        # Accept it only as a compatibility alias when the canonical key is absent.
        # If both keys are present, reject the response rather than guess which wins.
        if (
            "bilingual_pair_suggestions" in model_output
            and "bilingual_pairs" in model_output
        ):
            return self._unavailable("invalid_model_output")
        if "bilingual_pair_suggestions" in model_output:
            raw_pairs = model_output["bilingual_pair_suggestions"]
        else:
            raw_pairs = model_output.get("bilingual_pairs")

        if not isinstance(raw_suggestions, list) or not isinstance(raw_pairs, list):
            return self._unavailable("invalid_model_output")

        suggestions = []
        rejected_items = 0
        for item in raw_suggestions:
            if not isinstance(item, dict):
                rejected_items += 1
                continue
            source_field = item.get("source_field")
            dataset_id = item.get("candidate_dataset_id")
            target_field = item.get("candidate_field")
            relation = item.get("relation")
            confidence = item.get("confidence")
            rationale = item.get("rationale")
            if (
                not isinstance(source_field, str)
                or source_field not in source_names
                or not isinstance(dataset_id, str)
                or not isinstance(target_field, str)
                or (dataset_id, target_field) not in allowed_targets
                or not isinstance(relation, str)
                or relation not in _MATCH_RELATIONS
                or not _valid_confidence(confidence)
                or not isinstance(rationale, str)
            ):
                rejected_items += 1
                continue
            suggestions.append({
                "source_field": source_field,
                "candidate_dataset_id": dataset_id,
                "candidate_field": target_field,
                "relation": relation,
                "confidence": float(confidence),
                "rationale": rationale[:500],
                "status": "llm_suggestion_requires_review",
                "automatically_accepted": False,
            })

        pair_suggestions = []
        for item in raw_pairs:
            if not isinstance(item, dict):
                rejected_items += 1
                continue
            pair_fields = item.get("source_fields")
            relation = item.get("relation")
            confidence = item.get("confidence")
            rationale = item.get("rationale")
            if (
                not isinstance(pair_fields, list)
                or len(pair_fields) != 2
                or any(not isinstance(field, str) for field in pair_fields)
                or pair_fields[0] == pair_fields[1]
                or any(field not in source_names for field in pair_fields)
                or not isinstance(relation, str)
                or relation not in _PAIR_RELATIONS
                or not _valid_confidence(confidence)
                or not isinstance(rationale, str)
            ):
                rejected_items += 1
                continue
            pair_suggestions.append({
                "source_fields": list(pair_fields),
                "relation": relation,
                "confidence": float(confidence),
                "rationale": rationale[:500],
                "status": "llm_pair_suggestion_requires_review",
                "value_equivalence_verified": False,
                "safe_to_drop": False,
            })

        return {
            "status": "completed",
            "model": self.model,
            "suggestions": suggestions,
            "bilingual_pair_suggestions": pair_suggestions,
            "rejected_model_items": rejected_items,
            "policy": {
                "automatic_schema_mutation": False,
                "automatic_ingestion": False,
                "automatic_acceptance": False,
                "raw_source_values_sent": False,
            },
        }

    def _unavailable(self, error_code: str) -> dict[str, Any]:
        return {
            "status": "unavailable",
            "model": self.model,
            "error_code": error_code,
            "suggestions": [],
            "bilingual_pair_suggestions": [],
            "rejected_model_items": 0,
            "policy": {
                "automatic_schema_mutation": False,
                "automatic_ingestion": False,
                "automatic_acceptance": False,
                "raw_source_values_sent": False,
            },
        }
