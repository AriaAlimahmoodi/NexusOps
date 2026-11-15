"""Orchestrate semantic field suggestions and explicit human review.

This workflow combines the deterministic matcher with optional local Ollama
assistance. It produces review candidates only; it never accepts mappings,
mutates Registry schemas, transforms records, or authorizes ingestion.
"""
from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime
from typing import Any

from tools.dataset_registry import get_dataset_profile
from tools.ollama_semantic_assist import OllamaSemanticAssistant
from tools.semantic_matching import match_source_profile
from tools.source_mapping import SourceMappingSpec


_SEMANTIC_MAPPING_SCHEMA_VERSION = 1

# Phase 11 only establishes semantic equivalence. It does not perform type
# conversion; candidates needing conversion belong to Phase 12.
_DIRECT_SOURCE_TYPES_BY_TARGET: dict[str, set[str]] = {
    "keyword": {"string"},
    "text": {"string"},
    "integer": {"integer"},
    "long": {"integer"},
    "short": {"integer"},
    "byte": {"integer"},
    "float": {"integer", "float"},
    "double": {"integer", "float"},
    "scaled_float": {"integer", "float"},
    "half_float": {"integer", "float"},
    "boolean": {"boolean"},
    "date": {"date", "datetime"},
    "object": {"json_object"},
    "nested": {"json_object"},
}


def _direct_projection_check(source_type: Any, target_type: Any) -> tuple[bool, str | None]:
    if not isinstance(source_type, str) or not isinstance(target_type, str):
        return False, "unknown_physical_type"
    allowed_source_types = _DIRECT_SOURCE_TYPES_BY_TARGET.get(target_type)
    if allowed_source_types is None:
        return False, "unsupported_target_type_for_direct_projection"
    if source_type not in allowed_source_types:
        return False, "physical_type_requires_standardization"
    return True, None


def _validate_source_profile(source_profile: Any) -> tuple[str, Mapping[str, Any]]:
    if not isinstance(source_profile, Mapping):
        raise TypeError("source_profile must be a mapping.")
    columns = source_profile.get("columns")
    if not isinstance(columns, Mapping):
        raise ValueError("source_profile must contain a columns mapping.")
    if not columns:
        raise ValueError("source_profile must contain at least one source field.")
    for field_name, stats in columns.items():
        if not isinstance(field_name, str) or not field_name.strip():
            raise ValueError("source profile field names must be non-empty strings.")
        if not isinstance(stats, Mapping):
            raise ValueError(f"Statistics for source field '{field_name}' must be a mapping.")
    source_name = source_profile.get("source_name")
    if not isinstance(source_name, str) or not source_name.strip():
        raise ValueError("source_profile.source_name must be a non-empty string.")
    return source_name, columns


def analyze_source_mapping(
    source_profile: Mapping[str, Any],
    dataset_id: str,
    *,
    ollama_assistant: OllamaSemanticAssistant | None = None,
    use_ollama: bool = True,
    matcher_options: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Build a review report from deterministic and optional Ollama suggestions.

    All returned candidates require an explicit human decision. The Ollama
    assistant receives source headers and inferred physical types only.
    """
    source_name, columns = _validate_source_profile(source_profile)
    if not isinstance(dataset_id, str) or not dataset_id.strip():
        raise ValueError("dataset_id must be a non-empty string.")
    if not isinstance(use_ollama, bool):
        raise TypeError("use_ollama must be a boolean.")
    if matcher_options is not None and not isinstance(matcher_options, Mapping):
        raise TypeError("matcher_options must be a mapping when supplied.")

    dataset_profile = get_dataset_profile(dataset_id)
    options = dict(matcher_options or {})
    deterministic = match_source_profile(source_profile, [dataset_profile], **options)

    llm_result: dict[str, Any]
    if use_ollama:
        assistant = ollama_assistant or OllamaSemanticAssistant()
        llm_result = assistant.analyze(
            source_profile,
            [dataset_profile],
            existing_matches=deterministic["matches"],
            existing_bilingual_pairs=deterministic["bilingual_field_pairs"],
        )
    else:
        llm_result = {
            "status": "skipped",
            "suggestions": [],
            "bilingual_pair_suggestions": [],
            "rejected_model_items": 0,
            "duplicate_model_items": 0,
        }

    columns_by_name = {name: stats for name, stats in columns.items()}
    matches_by_name = {
        item["source_field"]: item for item in deterministic["matches"]
    }
    candidates_by_source: dict[str, list[dict[str, Any]]] = {
        name: [] for name in columns_by_name
    }

    for match in deterministic["matches"]:
        source_field = match["source_field"]
        for candidate in match.get("candidates", []):
            direct_ok, direct_reason = _direct_projection_check(
                match.get("source_type"), candidate.get("target_type")
            )
            candidates_by_source[source_field].append({
                "dataset_id": candidate["dataset_id"],
                "target_field": candidate["target_field"],
                "target_type": candidate.get("target_type"),
                "origin": "deterministic_matcher",
                "relation": "name_and_type_similarity",
                "confidence": candidate.get("confidence"),
                "rationale": "Candidate ranked by normalized field-name similarity and physical type compatibility.",
                "warning": candidate.get("warning"),
                "ambiguous": bool(match.get("ambiguous")),
                "direct_projection_eligible": direct_ok and candidate.get("warning") is None,
                "direct_projection_block_reason": (
                    candidate.get("warning") or direct_reason
                ),
                "requires_human_review": True,
                "automatically_accepted": False,
            })

    raw_llm_suggestions = llm_result.get("suggestions", [])
    if not isinstance(raw_llm_suggestions, list):
        raw_llm_suggestions = []
    for suggestion in raw_llm_suggestions:
        if not isinstance(suggestion, Mapping):
            continue
        source_field = suggestion.get("source_field")
        target_field = suggestion.get("candidate_field")
        if (
            not isinstance(source_field, str)
            or source_field not in columns_by_name
            or not isinstance(target_field, str)
        ):
            continue
        target_config = dataset_profile.get("fields", {}).get(target_field)
        if target_config is None:
            # The assistant already validates this, but keep the orchestration
            # boundary defensive if a custom assistant is injected.
            continue
        if suggestion.get("relation") not in {"exact_equivalent", "synonym"}:
            continue
        confidence = suggestion.get("confidence")
        if (
            not isinstance(confidence, (int, float))
            or isinstance(confidence, bool)
            or not 0 <= confidence <= 1
        ):
            continue
        rationale = suggestion.get("rationale")
        if not isinstance(rationale, str) or not rationale.strip():
            continue
        source_type = columns_by_name[source_field].get("inferred_type", "unknown")
        direct_ok, direct_reason = _direct_projection_check(
            source_type, target_config.get("type")
        )
        if any(
            item["dataset_id"] == dataset_id
            and item["target_field"] == target_field
            for item in candidates_by_source[source_field]
        ):
            continue
        candidates_by_source[source_field].append({
            "dataset_id": dataset_id,
            "target_field": target_field,
            "target_type": target_config.get("type"),
            "origin": "ollama",
            "relation": suggestion["relation"],
            "confidence": float(confidence),
            "rationale": rationale[:500],
            "warning": None if direct_ok else direct_reason,
            "ambiguous": bool(matches_by_name.get(source_field, {}).get("ambiguous")),
            "direct_projection_eligible": direct_ok,
            "direct_projection_block_reason": direct_reason,
            "requires_human_review": True,
            "automatically_accepted": False,
        })

    field_results = []
    for source_field, stats in columns_by_name.items():
        candidates = candidates_by_source[source_field]
        candidates.sort(
            key=lambda item: (
                item["confidence"] if isinstance(item["confidence"], (int, float)) else -1,
                item["origin"] == "deterministic_matcher",
                item["target_field"],
            ),
            reverse=True,
        )
        field_results.append({
            "source_field": source_field,
            "source_type": stats.get("inferred_type", "unknown"),
            "null_ratio": stats.get("null_ratio"),
            "status": "review_required" if candidates else "unmatched",
            "candidate_count": len(candidates),
            "candidates": candidates,
        })

    bilingual_pairs = []
    for pair in deterministic.get("bilingual_field_pairs", []):
        bilingual_pairs.append({
            **pair,
            "origin": "deterministic_matcher",
            "requires_human_review": True,
            "value_equivalence_verified": False,
            "safe_to_drop": False,
        })
    for pair in llm_result.get("bilingual_pair_suggestions", []):
        pair_names = set(pair["source_fields"])
        if any(
            set(existing.get("fields", [{}])[index].get("name") for index in range(2))
            == pair_names
            for existing in deterministic.get("bilingual_field_pairs", [])
        ):
            continue
        bilingual_pairs.append({
            **pair,
            "origin": "ollama",
            "requires_human_review": True,
            "value_equivalence_verified": False,
            "safe_to_drop": False,
        })

    ollama_status = llm_result.get("status", "unknown")
    status = (
        "completed"
        if ollama_status in {"completed", "skipped"}
        else "completed_with_ollama_unavailable"
    )
    return {
        "semantic_mapping_schema_version": _SEMANTIC_MAPPING_SCHEMA_VERSION,
        "status": status,
        "dataset_id": dataset_id,
        "source_name": source_name,
        "source_profile_summary": {
            "row_count": source_profile.get("row_count"),
            "column_count": len(columns_by_name),
        },
        "summary": {
            "source_fields": len(field_results),
            "fields_with_candidates": sum(
                item["status"] == "review_required" for item in field_results
            ),
            "unmatched_fields": sum(
                item["status"] == "unmatched" for item in field_results
            ),
            "candidate_mappings": sum(
                item["candidate_count"] for item in field_results
            ),
            "bilingual_pair_candidates": len(bilingual_pairs),
            "direct_projection_eligible_candidates": sum(
                candidate["direct_projection_eligible"]
                for item in field_results for candidate in item["candidates"]
            ),
        },
        "fields": field_results,
        "bilingual_pair_candidates": bilingual_pairs,
        "ollama": {
            "status": ollama_status,
            "model": llm_result.get("model"),
            "rejected_model_items": llm_result.get("rejected_model_items", 0),
            "duplicate_model_items": llm_result.get("duplicate_model_items", 0),
            "error_code": llm_result.get("error_code"),
        },
        "policy": {
            "human_review_required": True,
            "automatic_mapping_acceptance": False,
            "automatic_schema_mutation": False,
            "automatic_ingestion": False,
            "raw_source_values_sent_to_ollama": False,
            "source_values_in_report": False,
            "type_conversion_performed": False,
        },
    }


def build_reviewed_source_mapping(
    analysis_report: Mapping[str, Any],
    approved_mappings: Mapping[str, str],
    *,
    mapping_id: str,
    reviewed_by: str,
    reviewed_at: str,
    review_reference: str,
    version: int = 1,
) -> SourceMappingSpec:
    """Create a SourceMappingSpec only from explicit reviewer decisions.

    Every approved source/target pair must exist in the analysis report and be
    eligible for direct projection. This function does not approve or infer
    anything on behalf of the reviewer.
    """
    if not isinstance(analysis_report, Mapping):
        raise TypeError("analysis_report must be a mapping.")
    if analysis_report.get("semantic_mapping_schema_version") != _SEMANTIC_MAPPING_SCHEMA_VERSION:
        raise ValueError("Unsupported semantic mapping report schema.")
    if not isinstance(approved_mappings, Mapping) or not approved_mappings:
        raise ValueError("approved_mappings must be a non-empty mapping.")

    dataset_id = analysis_report.get("dataset_id")
    source_name = analysis_report.get("source_name")
    if not isinstance(dataset_id, str) or not isinstance(source_name, str):
        raise ValueError("Analysis report is missing dataset or source identity.")

    available: dict[str, set[str]] = {}
    eligible: dict[tuple[str, str], bool] = {}
    for field in analysis_report.get("fields", []):
        if not isinstance(field, Mapping):
            continue
        source_field = field.get("source_field")
        if not isinstance(source_field, str):
            continue
        available[source_field] = set()
        for candidate in field.get("candidates", []):
            if not isinstance(candidate, Mapping):
                continue
            target = candidate.get("target_field")
            if candidate.get("dataset_id") == dataset_id and isinstance(target, str):
                available[source_field].add(target)
                eligible[(source_field, target)] = (
                    candidate.get("direct_projection_eligible") is True
                )

    normalized: dict[str, str] = {}
    for source_field, target_field in approved_mappings.items():
        if not isinstance(source_field, str) or not isinstance(target_field, str):
            raise ValueError("Approved source and target field names must be strings.")
        if target_field not in available.get(source_field, set()):
            raise ValueError(
                f"'{source_field}' -> '{target_field}' is not a candidate in this analysis report."
            )
        if not eligible.get((source_field, target_field), False):
            raise ValueError(
                f"'{source_field}' -> '{target_field}' is not eligible for direct projection; "
                "complete the required standardization or extraction in Phase 12."
            )
        normalized[source_field] = target_field

    return SourceMappingSpec(
        mapping_id=mapping_id,
        dataset_id=dataset_id,
        source_name=source_name,
        field_mappings=normalized,
        reviewed_by=reviewed_by,
        reviewed_at=reviewed_at,
        review_reference=review_reference,
        version=version,
    )
