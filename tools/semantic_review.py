"""Durable, explicit review artifacts for semantic mapping candidates.

Artifacts contain candidate metadata and reviewer decisions only. They never
contain source record values, approve mappings by default, or authorize
ingestion.
"""
from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping, Sequence
from datetime import datetime
from typing import Any

from tools.semantic_mapping_workflow import build_reviewed_source_mapping
from tools.source_mapping import SourceMappingSpec


_REVIEW_ARTIFACT_SCHEMA_VERSION = 1
_ALLOWED_DECISIONS = {"approved", "rejected", "deferred", "ambiguous"}


def _validate_timestamp(value: Any, name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{name} must be a non-empty ISO-8601 timestamp.")
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(f"{name} must be an ISO-8601 timestamp with a timezone.") from exc
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError(f"{name} must be an ISO-8601 timestamp with a timezone.")
    return value.strip()


def _analysis_fingerprint(report: Mapping[str, Any]) -> str:
    encoded = json.dumps(
        report, ensure_ascii=False, sort_keys=True, separators=(",", ":"),
        allow_nan=False,
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _validate_analysis_report(report: Any) -> tuple[str, str, list[dict[str, Any]]]:
    if not isinstance(report, Mapping):
        raise TypeError("analysis_report must be a mapping.")
    if report.get("semantic_mapping_schema_version") != 1:
        raise ValueError("Unsupported semantic mapping report schema.")
    dataset_id, source_name = report.get("dataset_id"), report.get("source_name")
    if not isinstance(dataset_id, str) or not dataset_id.strip():
        raise ValueError("Analysis report has no valid dataset_id.")
    if not isinstance(source_name, str) or not source_name.strip():
        raise ValueError("Analysis report has no valid source_name.")
    fields = report.get("fields")
    if not isinstance(fields, list):
        raise ValueError("Analysis report fields must be a list.")

    candidates: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for field in fields:
        if not isinstance(field, Mapping):
            raise ValueError("Analysis report contains an invalid field entry.")
        source_field = field.get("source_field")
        if not isinstance(source_field, str) or not source_field.strip():
            raise ValueError("Analysis report contains an invalid source field.")
        field_candidates = field.get("candidates", [])
        if not isinstance(field_candidates, list):
            raise ValueError("Field candidates must be a list.")
        for candidate in field_candidates:
            if not isinstance(candidate, Mapping):
                raise ValueError("Analysis report contains an invalid candidate.")
            target = candidate.get("target_field")
            if (
                candidate.get("dataset_id") != dataset_id
                or not isinstance(target, str) or not target.strip()
            ):
                raise ValueError("Candidate dataset or target identity is invalid.")
            key = (source_field, target)
            if key in seen:
                raise ValueError("Analysis report contains duplicate source/target candidates.")
            seen.add(key)
            confidence = candidate.get("confidence")
            if (
                not isinstance(confidence, (int, float))
                or isinstance(confidence, bool)
            ):
                confidence = None
            candidates.append({
                "source_field": source_field,
                "target_field": target,
                "origin": candidate.get("origin"),
                "relation": candidate.get("relation"),
                "confidence": confidence,
                "direct_projection_eligible": (
                    candidate.get("direct_projection_eligible") is True
                ),
            })
    return dataset_id, source_name, candidates


def create_semantic_review_artifact(
    analysis_report: Mapping[str, Any],
    *,
    artifact_id: str,
    created_by: str,
    created_at: str,
) -> dict[str, Any]:
    """Create a JSON-serializable artifact with every candidate still pending."""
    for name, value in (("artifact_id", artifact_id), ("created_by", created_by)):
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"{name} must be a non-empty string.")
    timestamp = _validate_timestamp(created_at, "created_at")
    dataset_id, source_name, candidates = _validate_analysis_report(analysis_report)

    return {
        "review_artifact_schema_version": _REVIEW_ARTIFACT_SCHEMA_VERSION,
        "artifact_id": artifact_id.strip(),
        "created_at": timestamp,
        "created_by": created_by.strip(),
        "dataset_id": dataset_id,
        "source_name": source_name,
        "analysis_fingerprint": _analysis_fingerprint(analysis_report),
        "decision_policy": {
            "allowed_decisions": sorted(_ALLOWED_DECISIONS),
            "default_decision": "pending",
            "human_review_required": True,
            "approved_candidates_only_may_be_projected": True,
            "ingestion_authorized": False,
        },
        "decisions": [
            {
                **candidate,
                "decision": "pending",
                "decision_reason": None,
                "reviewed_by": None,
                "reviewed_at": None,
            }
            for candidate in candidates
        ],
    }


def apply_semantic_review_decisions(
    review_artifact: Mapping[str, Any],
    decisions: Sequence[Mapping[str, Any]],
    *,
    reviewed_by: str,
    reviewed_at: str,
) -> dict[str, Any]:
    """Return an updated artifact after explicit, validated reviewer decisions.

    Partial review is supported. Each decision item must identify one existing
    source/target candidate and include decision plus a non-empty reason.
    """
    if not isinstance(review_artifact, Mapping):
        raise TypeError("review_artifact must be a mapping.")
    if review_artifact.get("review_artifact_schema_version") != _REVIEW_ARTIFACT_SCHEMA_VERSION:
        raise ValueError("Unsupported review artifact schema.")
    if not isinstance(reviewed_by, str) or not reviewed_by.strip():
        raise ValueError("reviewed_by must be a non-empty string.")
    timestamp = _validate_timestamp(reviewed_at, "reviewed_at")
    if not isinstance(decisions, Sequence) or isinstance(decisions, (str, bytes)):
        raise TypeError("decisions must be a sequence of decision mappings.")

    result = json.loads(json.dumps(review_artifact, ensure_ascii=False, allow_nan=False))
    existing = {
        (item["source_field"], item["target_field"]): item
        for item in result.get("decisions", [])
    }
    submitted: set[tuple[str, str]] = set()
    for item in decisions:
        if not isinstance(item, Mapping):
            raise TypeError("Each review decision must be a mapping.")
        source_field, target_field = item.get("source_field"), item.get("target_field")
        key = (source_field, target_field)
        if not all(isinstance(value, str) and value.strip() for value in key):
            raise ValueError("Each decision requires source_field and target_field.")
        if key not in existing:
            raise ValueError(f"Decision references an unknown candidate: {source_field} -> {target_field}.")
        if key in submitted:
            raise ValueError(f"Duplicate decision for candidate: {source_field} -> {target_field}.")
        submitted.add(key)
        decision = item.get("decision")
        if not isinstance(decision, str) or decision not in _ALLOWED_DECISIONS:
            raise ValueError(f"decision must be one of: {', '.join(sorted(_ALLOWED_DECISIONS))}.")
        reason = item.get("decision_reason")
        if not isinstance(reason, str) or not reason.strip():
            raise ValueError("decision_reason must be a non-empty string.")
        existing[key].update({
            "decision": decision,
            "decision_reason": reason.strip()[:1000],
            "reviewed_by": reviewed_by.strip(),
            "reviewed_at": timestamp,
        })
    return result


def build_mapping_from_review_artifact(
    analysis_report: Mapping[str, Any],
    review_artifact: Mapping[str, Any],
    *,
    mapping_id: str,
    reviewed_by: str,
    reviewed_at: str,
    review_reference: str,
    version: int = 1,
) -> SourceMappingSpec:
    """Build a MappingSpec from approved decisions matching this exact report."""
    dataset_id, source_name, _ = _validate_analysis_report(analysis_report)
    if not isinstance(review_artifact, Mapping):
        raise TypeError("review_artifact must be a mapping.")
    if review_artifact.get("review_artifact_schema_version") != _REVIEW_ARTIFACT_SCHEMA_VERSION:
        raise ValueError("Unsupported review artifact schema.")
    if (
        review_artifact.get("dataset_id") != dataset_id
        or review_artifact.get("source_name") != source_name
    ):
        raise ValueError("Review artifact source/dataset identity does not match analysis report.")
    if review_artifact.get("analysis_fingerprint") != _analysis_fingerprint(analysis_report):
        raise ValueError("Review artifact belongs to a different or modified analysis report.")

    approved: dict[str, str] = {}
    artifact_decisions = review_artifact.get("decisions")
    if not isinstance(artifact_decisions, list):
        raise ValueError("Review artifact decisions must be a list.")
    for item in artifact_decisions:
        if not isinstance(item, Mapping):
            raise ValueError("Review artifact contains an invalid decision.")
        decision = item.get("decision")
        if decision == "pending":
            continue
        if decision not in _ALLOWED_DECISIONS:
            raise ValueError("Review artifact contains an unsupported decision.")
        if decision != "approved":
            continue
        source_field, target_field = item.get("source_field"), item.get("target_field")
        if not all(isinstance(value, str) for value in (source_field, target_field)):
            raise ValueError("Approved decision has invalid candidate identity.")
        if item.get("direct_projection_eligible") is not True:
            raise ValueError(
                f"Approved candidate '{source_field}' -> '{target_field}' is not eligible for direct projection."
            )
        if source_field in approved:
            raise ValueError(f"Multiple approved targets exist for source field '{source_field}'.")
        approved[source_field] = target_field

    if not approved:
        raise ValueError("No approved candidates are available to build a SourceMappingSpec.")

    return build_reviewed_source_mapping(
        analysis_report,
        approved,
        mapping_id=mapping_id,
        reviewed_by=reviewed_by,
        reviewed_at=reviewed_at,
        review_reference=review_reference,
        version=version,
    )
