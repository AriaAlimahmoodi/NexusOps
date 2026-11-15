"""Operator CLI for semantic analysis, review decisions, and MappingSpec export.

This CLI never ingests records or writes to Elasticsearch. Every mapping
requires an explicit approved decision in a durable review artifact.
"""
from __future__ import annotations

import argparse
import json
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from tools.semantic_mapping_workflow import analyze_source_mapping
from tools.semantic_review import (
    apply_semantic_review_decisions,
    build_mapping_from_review_artifact,
    create_semantic_review_artifact,
)


def _read_json(path: str | Path) -> Any:
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise ValueError(f"Cannot read valid JSON from '{path}': {exc}") from exc


def _write_json(path: str | Path, payload: Any) -> None:
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    rendered = json.dumps(payload, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    temporary_name = None
    try:
        with tempfile.NamedTemporaryFile(
            "w", encoding="utf-8", dir=destination.parent,
            prefix=f".{destination.name}.", suffix=".tmp", delete=False,
        ) as handle:
            temporary_name = handle.name
            handle.write(rendered)
            handle.flush()
        Path(temporary_name).replace(destination)
    except OSError:
        if temporary_name:
            Path(temporary_name).unlink(missing_ok=True)
        raise


def _mapping_payload(mapping: Any) -> dict[str, Any]:
    return {
        "mapping_id": mapping.mapping_id,
        "dataset_id": mapping.dataset_id,
        "source_name": mapping.source_name,
        "field_mappings": dict(mapping.field_mappings),
        "reviewed_by": mapping.reviewed_by,
        "reviewed_at": mapping.reviewed_at,
        "review_reference": mapping.review_reference,
        "version": mapping.version,
    }


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Analyze source headers, record human semantic review decisions, "
            "and export a reviewed MappingSpec. No ingestion or Elasticsearch writes."
        )
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    analyze = subparsers.add_parser("analyze", help="Create an analysis report and pending review artifact.")
    analyze.add_argument("--profile", required=True, help="JSON source profile produced by source profiling.")
    analyze.add_argument("--dataset", required=True, help="Existing Dataset Registry dataset ID.")
    analyze.add_argument("--report", required=True, help="Output path for the semantic analysis report.")
    analyze.add_argument("--artifact", required=True, help="Output path for the pending review artifact.")
    analyze.add_argument("--artifact-id", required=True)
    analyze.add_argument("--created-by", required=True)
    analyze.add_argument("--no-ollama", action="store_true", help="Use deterministic matching only.")

    review = subparsers.add_parser("review", help="Apply explicit reviewer decisions to an artifact.")
    review.add_argument("--artifact", required=True)
    review.add_argument("--decisions", required=True, help="JSON array of candidate decisions.")
    review.add_argument("--output", required=True, help="Output path for the updated review artifact.")
    review.add_argument("--reviewed-by", required=True)
    review.add_argument("--reviewed-at", required=True, help="Timezone-aware ISO-8601 timestamp.")

    build = subparsers.add_parser("build-mapping", help="Export MappingSpec from approved artifact decisions.")
    build.add_argument("--report", required=True)
    build.add_argument("--artifact", required=True)
    build.add_argument("--output", required=True)
    build.add_argument("--mapping-id", required=True)
    build.add_argument("--reviewed-by", required=True)
    build.add_argument("--reviewed-at", required=True, help="Timezone-aware ISO-8601 timestamp.")
    build.add_argument("--review-reference", required=True)
    build.add_argument("--version", type=int, default=1)

    return parser


def main() -> int:
    parser = _build_parser()
    args = parser.parse_args()
    try:
        if args.command == "analyze":
            profile = _read_json(args.profile)
            report = analyze_source_mapping(
                profile, args.dataset, use_ollama=not args.no_ollama,
            )
            created_at = datetime.now(timezone.utc).isoformat()
            artifact = create_semantic_review_artifact(
                report,
                artifact_id=args.artifact_id,
                created_by=args.created_by,
                created_at=created_at,
            )
            _write_json(args.report, report)
            _write_json(args.artifact, artifact)
            print(json.dumps({
                "status": report["status"],
                "dataset_id": report["dataset_id"],
                "source_name": report["source_name"],
                "candidate_mappings": report["summary"]["candidate_mappings"],
                "review_decisions": len(artifact["decisions"]),
                "report_path": str(args.report),
                "artifact_path": str(args.artifact),
                "automatic_approval": False,
                "ingestion_authorized": False,
            }, ensure_ascii=False, indent=2))
            return 0

        if args.command == "review":
            artifact = _read_json(args.artifact)
            decisions = _read_json(args.decisions)
            if not isinstance(decisions, list):
                raise ValueError("Decision input must be a JSON array.")
            updated = apply_semantic_review_decisions(
                artifact, decisions,
                reviewed_by=args.reviewed_by,
                reviewed_at=args.reviewed_at,
            )
            _write_json(args.output, updated)
            counts = {
                status: sum(item["decision"] == status for item in updated["decisions"])
                for status in ("pending", "approved", "rejected", "deferred", "ambiguous")
            }
            print(json.dumps({
                "status": "review_updated",
                "decision_counts": counts,
                "artifact_path": str(args.output),
                "ingestion_authorized": False,
            }, ensure_ascii=False, indent=2))
            return 0

        if args.command == "build-mapping":
            report = _read_json(args.report)
            artifact = _read_json(args.artifact)
            mapping = build_mapping_from_review_artifact(
                report, artifact,
                mapping_id=args.mapping_id,
                reviewed_by=args.reviewed_by,
                reviewed_at=args.reviewed_at,
                review_reference=args.review_reference,
                version=args.version,
            )
            payload = {
                "mapping_spec_schema_version": 1,
                **_mapping_payload(mapping),
                "ingestion_authorized": False,
            }
            _write_json(args.output, payload)
            print(json.dumps({
                "status": "mapping_spec_created",
                "dataset_id": mapping.dataset_id,
                "source_name": mapping.source_name,
                "mapped_fields": len(mapping.field_mappings),
                "mapping_path": str(args.output),
                "ingestion_authorized": False,
            }, ensure_ascii=False, indent=2))
            return 0

        parser.error("Unsupported command.")
    except (OSError, UnicodeError, ValueError, TypeError, KeyError) as error:
        parser.error(str(error))
    return 2


if __name__ == "__main__":
    sys.exit(main())
