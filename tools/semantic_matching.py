"""Deterministic semantic matching between profiled source fields and NexusOps schemas.

This module proposes mappings only. It never mutates dataset profiles, ingests data,
or changes Elasticsearch mappings. Ambiguous and type-incompatible matches require review.
"""
from __future__ import annotations

import re
import unicodedata
from typing import Any, Iterable


# Explicit domain aliases are deliberately conservative. Add aliases only when
# the source and target represent the same business concept, not merely related data.
_FIELD_ALIASES: dict[str, tuple[str, ...]] = {
    "job_title": (
        "jobpost_rawtitle", "raw job title", "عنوان شغلی", "عنوان شغل",
        "عنوان سمت", "عنوان موقعیت شغلی", "job title", "position title",
        "job position", "position name",
    ),
    "job_field": (
        "jobpost_mainjobcategory", "main job category", "job category",
        "occupational category", "occupational field", "حوزه شغلی",
        "حوزه حرفه ای", "دسته بندی شغلی", "طبقه بندی شغلی",
    ),
    "skill": (
        "jobpost_softwareskills", "software skills", "مهارت نرم افزاری",
        "مهارت های نرم افزاری", "مهارت تخصصی", "توانمندی فنی",
        "technical skills", "technical competencies",
    ),
    "additional_skills": (
        "jobpost_softwareskills", "software skills", "مهارت نرم افزاری",
        "مهارت های نرم افزاری", "technical skills",
    ),
    "related_skills": (
        "jobpost_softwareskills", "software skills", "مهارت نرم افزاری",
        "مهارت های نرم افزاری", "technical skills",
    ),
    "major": (
        "major", "رشته تحصیلی", "رشته دانشگاهی", "field of study",
        "academic major",
    ),
    "course_name": ("course name", "نام درس", "عنوان درس"),
    "course_id": ("course id", "شناسه درس", "کد درس"),
    "graduation_year": ("graduation year", "سال فارغ التحصیلی"),
    "study_level": (
        "study level", "degree level", "academic degree",
        "educational level", "مقطع تحصیلی", "مقطع دانشگاهی",
    ),
    "employment_months": ("employment months", "مدت اشتغال به ماه"),
    "career_relevance": (
        "career relevance", "job major relevance", "field job alignment",
        "ارتباط شغل با رشته", "ارتباط شغل و رشته",
    ),
    "demand_score": ("demand score", "امتیاز تقاضای بازار"),
    "frequency": ("frequency", "فراوانی"),
}


_NUMERIC_TYPES = {"integer", "float"}
_TEXT_TYPES = {"string"}
_ARRAY_TYPES = {"json_array"}
_BOOLEAN_TYPES = {"boolean"}


def normalize_semantic_text(value: str) -> str:
    """Normalize Persian/English identifiers without transliterating meaning."""
    text = unicodedata.normalize("NFKC", str(value)).casefold()
    text = text.replace("ي", "ی").replace("ك", "ک")
    # Remove Arabic/Persian vowel marks before punctuation cleanup; otherwise
    # combining marks are converted to spaces and split a single word.
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    text = re.sub(r"[_\-./\\]+", " ", text)
    text = re.sub(r"[^\w\s]", " ", text, flags=re.UNICODE)
    return " ".join(text.split())


def detect_bilingual_field_pairs(source_columns: dict[str, Any]) -> list[dict[str, Any]]:
    """Identify likely Fa/En header pairs without claiming their values are equal.

    A matching base name and language suffix indicate a conceptual pair only.
    Value-level equivalence must be checked against source records separately.
    """
    language_suffix = re.compile(
        r"(?:[_\-\s]|(?<=[a-z0-9]))(fa|en|persian|english)$", flags=re.IGNORECASE
    )
    grouped: dict[str, dict[str, list[tuple[str, dict[str, Any]]]]] = {}

    for raw_name, stats in source_columns.items():
        match = language_suffix.search(str(raw_name))
        if not match:
            continue
        language = match.group(1).casefold()
        language = "fa" if language in {"fa", "persian"} else "en"
        base = normalize_semantic_text(str(raw_name)[:match.start()])
        if not base:
            continue
        grouped.setdefault(base, {}).setdefault(language, []).append(
            (str(raw_name), stats if isinstance(stats, dict) else {})
        )

    pairs = []
    for base, languages in sorted(grouped.items()):
        if not languages.get("fa") or not languages.get("en"):
            continue
        for fa_name, fa_stats in languages["fa"]:
            for en_name, en_stats in languages["en"]:
                fa_type = fa_stats.get("inferred_type", "unknown")
                en_type = en_stats.get("inferred_type", "unknown")
                pairs.append({
                    "normalized_base": base,
                    "fields": [
                        {"name": fa_name, "language": "fa", "inferred_type": fa_type},
                        {"name": en_name, "language": "en", "inferred_type": en_type},
                    ],
                    "status": "bilingual_semantic_pair_candidate",
                    "physical_types_compatible": (
                        fa_type == en_type
                        or fa_type in {"unknown", "mixed"}
                        or en_type in {"unknown", "mixed"}
                    ),
                    "value_equivalence_verified": False,
                    "safe_to_drop": False,
                    "requires_value_level_validation": True,
                })
    return pairs


def _tokens(value: str) -> set[str]:
    return {token for token in normalize_semantic_text(value).split() if len(token) > 1}


def _alias_score(source_name: str, target_field: str) -> float:
    source = normalize_semantic_text(source_name)
    aliases = (target_field, *_FIELD_ALIASES.get(target_field, ()))
    normalized_aliases = {normalize_semantic_text(item) for item in aliases}
    if source in normalized_aliases:
        return 1.0
    source_tokens = _tokens(source)
    best = 0.0
    for alias in normalized_aliases:
        alias_tokens = _tokens(alias)
        if source_tokens and alias_tokens:
            overlap = len(source_tokens & alias_tokens) / len(source_tokens | alias_tokens)
            best = max(best, overlap)
    return best


def _type_compatibility(source_type: str, target_type: str) -> tuple[float, str | None]:
    if source_type in {"unknown", "mixed"}:
        return 0.5, "source_type_uncertain"
    if source_type == target_type:
        return 1.0, None
    if source_type in _NUMERIC_TYPES and target_type in _NUMERIC_TYPES:
        return 0.95, None
    # A JSON array can be projected into a keyword multi-value field, but only
    # through an explicit extraction step; it is not a direct field copy.
    if source_type in _ARRAY_TYPES and target_type == "keyword":
        return 0.85, "requires_nested_value_extraction"
    if source_type in _TEXT_TYPES and target_type == "keyword":
        return 0.9, None
    if source_type in _BOOLEAN_TYPES and target_type == "boolean":
        return 1.0, None
    return 0.0, "incompatible_physical_type"


def _candidate_score(name_score: float, type_score: float) -> float:
    if type_score == 0:
        return 0.0
    return round((0.8 * name_score) + (0.2 * type_score), 4)


def match_source_profile(
    source_profile: dict[str, Any],
    dataset_profiles: Iterable[dict[str, Any]],
    *,
    auto_match_threshold: float = 0.88,
    review_threshold: float = 0.62,
    top_k: int = 5,
) -> dict[str, Any]:
    """Rank source-to-canonical-field candidates without changing either schema."""
    if not 0 <= review_threshold <= auto_match_threshold <= 1:
        raise ValueError("thresholds must satisfy 0 <= review <= auto <= 1")
    if top_k < 1:
        raise ValueError("top_k must be at least 1")

    source_columns = source_profile.get("columns")
    if not isinstance(source_columns, dict):
        raise ValueError("source_profile must contain a columns mapping")

    targets: list[tuple[str, str, dict[str, Any]]] = []
    for profile in dataset_profiles:
        dataset_id = profile.get("dataset_id")
        fields = profile.get("fields", {})
        if not dataset_id or not isinstance(fields, dict):
            continue
        for field_name, config in fields.items():
            targets.append((dataset_id, field_name, config))

    bilingual_pairs = detect_bilingual_field_pairs(source_columns)

    results = []
    for source_name, source_stats in source_columns.items():
        source_type = source_stats.get("inferred_type", "unknown")
        candidates = []
        for dataset_id, target_name, target_config in targets:
            name_score = _alias_score(source_name, target_name)
            if name_score <= 0:
                continue
            type_score, warning = _type_compatibility(
                source_type, target_config.get("type", "unknown")
            )
            score = _candidate_score(name_score, type_score)
            if score < review_threshold:
                continue
            candidates.append({
                "dataset_id": dataset_id,
                "target_field": target_name,
                "target_type": target_config.get("type"),
                "target_roles": list(target_config.get("roles", [])),
                "name_score": round(name_score, 4),
                "type_score": round(type_score, 4),
                "confidence": score,
                "warning": warning,
            })

        candidates.sort(
            key=lambda item: (
                item["confidence"],
                item["name_score"],
                item["dataset_id"],
                item["target_field"],
            ),
            reverse=True,
        )
        candidates = candidates[:top_k]
        best = candidates[0] if candidates else None
        tied_candidates = [
            item for item in candidates
            if best and item["confidence"] == best["confidence"]
        ]
        is_ambiguous = len({
            (item["dataset_id"], item["target_field"])
            for item in tied_candidates
        }) > 1
        if best and best["confidence"] >= auto_match_threshold and not best["warning"] and not is_ambiguous:
            status = "auto_match_candidate"
        elif best:
            status = "manual_review"
            if is_ambiguous:
                warnings = ["ambiguous_top_candidates"]
                if best.get("warning"):
                    warnings.append(best["warning"])
                best = {**best, "warnings": warnings}
        else:
            status = "unmatched"

        results.append({
            "source_field": source_name,
            "source_type": source_type,
            "null_ratio": source_stats.get("null_ratio"),
            "status": status,
            "best_candidate": best,
            "ambiguous": is_ambiguous,
            "candidates": candidates,
        })

    summary = {
        "source_name": source_profile.get("source_name"),
        "row_count": source_profile.get("row_count"),
        "column_count": len(source_columns),
        "auto_match_candidates": sum(item["status"] == "auto_match_candidate" for item in results),
        "manual_review": sum(item["status"] == "manual_review" for item in results),
        "unmatched": sum(item["status"] == "unmatched" for item in results),
        "bilingual_field_pair_candidates": len(bilingual_pairs),
    }
    return {
        "matching_version": 2,
        "policy": {
            "auto_match_threshold": auto_match_threshold,
            "review_threshold": review_threshold,
            "automatic_schema_mutation": False,
            "automatic_ingestion": False,
        },
        "summary": summary,
        "bilingual_field_pairs": bilingual_pairs,
        "matches": results,
    }
