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
        *,
        existing_matches: Iterable[dict[str, Any]] = (),
        existing_bilingual_pairs: Iterable[dict[str, Any]] = (),
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

        existing_mapping_keys: set[tuple[str, str, str]] = set()
        existing_mapping_context = []
        for match in existing_matches:
            if not isinstance(match, dict):
                continue
            source_name = match.get("source_field")
            candidate = match.get("best_candidate")
            if not isinstance(candidate, dict):
                candidate = match
            dataset_id = candidate.get("dataset_id", candidate.get("candidate_dataset_id"))
            target_field = candidate.get("target_field", candidate.get("candidate_field"))
            if (
                isinstance(source_name, str)
                and isinstance(dataset_id, str)
                and isinstance(target_field, str)
            ):
                key = (source_name, dataset_id, target_field)
                existing_mapping_keys.add(key)
                existing_mapping_context.append({
                    "source_field": source_name,
                    "candidate_dataset_id": dataset_id,
                    "candidate_field": target_field,
                })

        existing_pair_keys: set[tuple[str, str]] = set()
        existing_pair_context = []
        for pair in existing_bilingual_pairs:
            if not isinstance(pair, dict):
                continue
            fields = pair.get("fields", pair.get("source_fields"))
            if (
                isinstance(fields, list)
                and len(fields) == 2
                and all(isinstance(field, str) for field in fields)
            ):
                key = tuple(sorted(fields))
                existing_pair_keys.add(key)
                existing_pair_context.append({"source_fields": list(fields)})

        prompt_payload = {
            "source_fields": source_fields,
            "canonical_fields": catalog,
            "already_identified_mappings": existing_mapping_context,
            "already_identified_bilingual_pairs": existing_pair_context,
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
            "Use this exact structure and include every required key: "
            '{"suggestions":[{"source_field":"<supplied header>",'
            '"candidate_dataset_id":"<registry dataset_id>",'
            '"candidate_field":"<registry field>","relation":"synonym",'
            '"confidence":0.8,"rationale":"brief reason"}],'
            '"bilingual_pair_suggestions":[{"source_fields":["<header Fa>",'
            '"<header En>"],"relation":"possible_translation",'
            '"confidence":0.8,"rationale":"brief reason"}]}. '
            "Do not use candidate_dataset; the exact key is candidate_dataset_id. "
            "Every suggestion MUST include rationale. Every bilingual pair MUST "
            "include both confidence and rationale. If no new item exists, return "
            "an empty array. Do not repeat any item listed in "
            "already_identified_mappings or already_identified_bilingual_pairs. "
            "The application also removes duplicates after generation. "
            "Each suggestion relation must be one of exact_equivalent, synonym, "
            "related_not_equivalent, not_equivalent, uncertain. Each pair relation "
            "must be one of translation, possible_translation, "
            "related_not_equivalent, not_equivalent, uncertain. confidence is "
            "a finite number from 0 to 1. Do not claim value equivalence from "
            "header names."
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
        pair_suggestions = []
        rejection_details = []
        duplicate_details = []

        for index, item in enumerate(raw_suggestions):
            reasons = []
            if not isinstance(item, dict):
                reasons.append("item_not_object")
            else:
                source_field = item.get("source_field")
                dataset_id = item.get("candidate_dataset_id")
                target_field = item.get("candidate_field")
                relation = item.get("relation")
                confidence = item.get("confidence")
                rationale = item.get("rationale")
                if not isinstance(source_field, str) or source_field not in source_names:
                    reasons.append("unknown_or_invalid_source_field")
                if not isinstance(dataset_id, str):
                    reasons.append("missing_or_invalid_candidate_dataset_id")
                if not isinstance(target_field, str):
                    reasons.append("missing_or_invalid_candidate_field")
                elif isinstance(dataset_id, str) and (dataset_id, target_field) not in allowed_targets:
                    reasons.append("candidate_target_not_in_registry")
                if not isinstance(relation, str) or relation not in _MATCH_RELATIONS:
                    reasons.append("invalid_relation")
                if not _valid_confidence(confidence):
                    reasons.append("invalid_confidence")
                if not isinstance(rationale, str) or not rationale.strip():
                    reasons.append("missing_or_invalid_rationale")

            if reasons:
                rejection_details.append({
                    "kind": "suggestion", "index": index, "reasons": reasons,
                })
                continue

            mapping_key = (source_field, dataset_id, target_field)
            if mapping_key in existing_mapping_keys:
                duplicate_details.append({
                    "kind": "suggestion", "index": index,
                    "reason": "already_identified_by_deterministic_matcher",
                })
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

        for index, item in enumerate(raw_pairs):
            reasons = []
            if not isinstance(item, dict):
                reasons.append("item_not_object")
            else:
                pair_fields = item.get("source_fields")
                relation = item.get("relation")
                confidence = item.get("confidence")
                rationale = item.get("rationale")
                if (
                    not isinstance(pair_fields, list)
                    or len(pair_fields) != 2
                    or any(not isinstance(field, str) for field in pair_fields)
                ):
                    reasons.append("source_fields_must_contain_exactly_two_strings")
                elif (
                    pair_fields[0] == pair_fields[1]
                    or any(field not in source_names for field in pair_fields)
                ):
                    reasons.append("unknown_or_duplicate_source_field_in_pair")
                if not isinstance(relation, str) or relation not in _PAIR_RELATIONS:
                    reasons.append("invalid_pair_relation")
                if not _valid_confidence(confidence):
                    reasons.append("invalid_confidence")
                if not isinstance(rationale, str) or not rationale.strip():
                    reasons.append("missing_or_invalid_rationale")

            if reasons:
                rejection_details.append({
                    "kind": "bilingual_pair", "index": index, "reasons": reasons,
                })
                continue

            pair_key = tuple(sorted(pair_fields))
            if pair_key in existing_pair_keys:
                duplicate_details.append({
                    "kind": "bilingual_pair", "index": index,
                    "reason": "already_identified_by_deterministic_matcher",
                })
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
            "rejected_model_items": len(rejection_details),
            "rejection_details": rejection_details,
            "duplicate_model_items": len(duplicate_details),
            "duplicate_details": duplicate_details,
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
