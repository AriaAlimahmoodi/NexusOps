"""Offline profiling, compatibility and semantic-proposal report for saved API pages."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from tools.source_discovery import profile_record_stream
from tools.source_engine.compatibility import analyze_dataset_compatibility
from tools.source_engine.config import load_source_config
from tools.source_engine.raw_reader import iter_raw_api_records
from tools.source_engine.semantic_proposer import propose_semantic_mappings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True)
    parser.add_argument("--raw-directory", required=True)
    parser.add_argument("--dataset-id", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--allow-partial", action="store_true")
    args = parser.parse_args()

    config = load_source_config(args.config)
    records = iter_raw_api_records(
        args.raw_directory, config, allow_partial=args.allow_partial
    )
    profile = profile_record_stream(
        records, source_name=config.get("name", config["id"])
    )
    compatibility = analyze_dataset_compatibility(profile, args.dataset_id)
    proposals = propose_semantic_mappings(profile, args.dataset_id)
    report = {
        "pipeline_version": 1,
        "source_id": config["id"],
        "dataset_id": args.dataset_id,
        "acquisition": "offline_verified",
        "profile": profile,
        "compatibility": compatibility,
        "semantic_proposals": proposals,
        "human_review": {
            "status": "pending",
            "required": True,
            "mapping_spec_created": False,
            "ingestion_authorized": False,
        },
        "elasticsearch_write_performed": False,
        "alias_changed": False,
    }
    destination = Path(args.output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".tmp")
    temporary.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temporary.replace(destination)
    print(json.dumps({
        "status": "completed",
        "source_id": config["id"],
        "records_profiled": profile["row_count"],
        "compatibility": compatibility["decision"],
        "human_review": "pending",
        "output": str(destination),
        "elasticsearch_write_performed": False,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
