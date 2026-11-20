"""Normalize a file using a declarative mapping and a registered index contract."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path

from tools.adapters.mapped_source import build
from tools.source_ingestion_preflight import audit_source_ingestion_preflight


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True, type=Path)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    config = json.loads(args.config.read_text(encoding="utf-8-sig"))
    batch, options = build(config, args.input, datetime.now(timezone.utc).isoformat())
    audit = audit_source_ingestion_preflight(*batch, **options)
    print(json.dumps(audit, indent=2))
    if audit["decision"] != "preflight_passed":
        raise SystemExit(1)
    if args.apply:
        from config import get_elasticsearch_client
        from tools.ingestion_run import run_ingestion_with_evidence
        with get_elasticsearch_client() as client:
            result = run_ingestion_with_evidence(client, *batch, **options, report_path=args.report)
            print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
