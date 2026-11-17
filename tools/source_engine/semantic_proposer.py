"""Deterministic semantic proposal facade; all candidates remain review-only."""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from tools.semantic_mapping_workflow import analyze_source_mapping


def propose_semantic_mappings(
    source_profile: Mapping[str, Any], dataset_id: str
) -> dict[str, Any]:
    """Reuse Phase 11 deterministic matching without invoking Ollama."""
    report = analyze_source_mapping(
        source_profile, dataset_id, use_ollama=False
    )
    report["proposal_policy"] = {
        "engine": "phase11_deterministic_matcher",
        "human_review_required": True,
        "automatic_acceptance": False,
        "mapping_spec_created": False,
    }
    return report
