"""CLI for a read-only, adapter-backed canonical ingestion preflight.

The command reads one explicit JSON configuration, audits the source stream,
and optionally writes the report. It never creates an Elasticsearch client or
publishes records.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from tools.adapters.base import SourceSpec
from tools.source_ingestion_preflight import audit_source_ingestion_preflight
from tools.source_mapping import SourceMappingSpec


_REQUIRED_CONFIG_KEYS = frozenset({
    "dataset_id", "format_name", "source", "manifest", "mapping_spec",
})


def _load_config(path: str | Path) -> dict[str, Any]:
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(payload, Mapping):
        raise ValueError("Preflight configuration must be a JSON object.")
    missing = _REQUIRED_CONFIG_KEYS - set(payload)
    unknown = set(payload) - _REQUIRED_CONFIG_KEYS
    if missing:
        raise ValueError(f"Missing configuration key(s): {sorted(missing)}.")
    if unknown:
        raise ValueError(f"Unsupported configuration key(s): {sorted(unknown)}.")

    dataset_id = payload["dataset_id"]
    format_name = payload["format_name"]
    if not isinstance(dataset_id, str) or not dataset_id.strip():
        raise ValueError("dataset_id must be a non-empty string.")
    if not isinstance(format_name, str) or not format_name.strip():
        raise ValueError("format_name must be a non-empty string.")

    source_payload = payload["source"]
    if not isinstance(source_payload, Mapping):
        raise ValueError("source must be a JSON object.")
    if set(source_payload) - {"uri", "options"}:
        raise ValueError("source supports only uri and options.")
    if not isinstance(source_payload.get("uri"), str) or not source_payload["uri"].strip():
        raise ValueError("source.uri must be a non-empty string.")
    source_options = source_payload.get("options", {})
    if not isinstance(source_options, Mapping):
        raise ValueError("source.options must be a JSON object.")

    manifest = payload["manifest"]
    if not isinstance(manifest, Mapping):
        raise ValueError("manifest must be a JSON object.")
    mapping_payload = payload["mapping_spec"]
    if not isinstance(mapping_payload, Mapping):
        raise ValueError("mapping_spec must be a JSON object.")

    return {
        "dataset_id": dataset_id,
        "format_name": format_name,
        "source": SourceSpec(source_payload["uri"], source_options),
        "manifest": dict(manifest),
        "mapping_spec": SourceMappingSpec(**mapping_payload),
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Run a read-only source-to-canonical preflight. "
            "No Elasticsearch publication is performed."
        )
    )
    parser.add_argument(
        "--config",
        required=True,
        help="JSON configuration containing source, manifest, and reviewed mapping.",
    )
    parser.add_argument(
        "--output",
        help="Optional path for the complete JSON preflight report.",
    )
    parser.add_argument(
        "--max-issue-samples",
        type=int,
        default=100,
        help="Maximum issue details retained in the report (default: 100).",
    )
    args = parser.parse_args()

    if args.max_issue_samples < 0:
        parser.error("--max-issue-samples must be non-negative.")

    try:
        config = _load_config(args.config)
        report = audit_source_ingestion_preflight(
            config["dataset_id"],
            config["format_name"],
            config["source"],
            config["manifest"],
            mapping_spec=config["mapping_spec"],
            max_issue_samples=args.max_issue_samples,
        )
    except (OSError, UnicodeError, ValueError, TypeError, KeyError) as error:
        parser.error(str(error))

    rendered = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        output_path = Path(args.output)
        output_path.write_text(rendered + "\n", encoding="utf-8")
        print(json.dumps({
            "status": report["decision"],
            "dataset_id": report["dataset_id"],
            "total_records": report["total_records"],
            "valid_records": report["valid_records"],
            "invalid_records": report["invalid_records"],
            "issue_count": report["issue_count"],
            "report_path": str(output_path),
            "records_published": 0,
        }, ensure_ascii=False, indent=2))
    else:
        print(rendered)

    return 0 if report["decision"] == "preflight_passed" else 1


if __name__ == "__main__":
    sys.exit(main())
