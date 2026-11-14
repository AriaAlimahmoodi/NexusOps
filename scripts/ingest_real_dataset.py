from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from config import get_elasticsearch_client
from tools.atomic_data_publisher import ingest_real_records_atomically
from tools.data_ingestion import prepare_real_records


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate or atomically publish one real-data collection batch."
    )
    parser.add_argument("--dataset", required=True, help="Registered dataset ID.")
    parser.add_argument("--input", required=True, help="JSON file with manifest and records.")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Atomically publish to the dedicated real-data Registry alias.",
    )
    args = parser.parse_args()

    payload = json.loads(Path(args.input).read_text(encoding="utf-8"))
    manifest = payload.get("manifest")
    records = payload.get("records")
    if not isinstance(manifest, dict) or not isinstance(records, list):
        parser.error("Input JSON must contain an object 'manifest' and array 'records'.")

    if not args.apply:
        prepared = prepare_real_records(args.dataset, records, manifest)
        print(json.dumps({
            "status": "validated_not_written",
            "dataset_id": args.dataset,
            "classification": "real",
            "record_count": len(prepared),
            "collection_batch": manifest["collection_batch"],
        }, ensure_ascii=False, indent=2))
        return 0

    client = get_elasticsearch_client()
    try:
        result = ingest_real_records_atomically(
            client, args.dataset, iter(records), manifest
        )
    finally:
        client.close()
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
