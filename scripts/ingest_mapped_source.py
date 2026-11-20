"""Normalize a file using a declarative mapping and a registered index contract."""
import argparse
from contextlib import ExitStack
from getpass import getpass
import os
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
    parser.add_argument("--prompt-password", action="store_true",
                        help="Prompt for the Elasticsearch password when publishing.")
    args = parser.parse_args()
    if args.prompt_password and not args.apply:
        parser.error("--prompt-password requires --apply")
    config = json.loads(args.config.read_text(encoding="utf-8-sig"))
    with ExitStack() as stack:
        if args.apply:
            if args.prompt_password:
                os.environ["ELASTICSEARCH_PASSWORD"] = getpass("Elasticsearch password: ")
            from config import get_elasticsearch_client
            from elasticsearch import AuthenticationException

            client = stack.enter_context(get_elasticsearch_client())
            try:
                client.info()
            except AuthenticationException:
                parser.exit(1, "Elasticsearch rejected the credentials (HTTP 401). "
                            "Check the password for the configured user and endpoint. "
                            "The CSV has not been processed.\n")

        batch, options = build(config, args.input, datetime.now(timezone.utc).isoformat())
        audit = audit_source_ingestion_preflight(*batch, **options)
        print(json.dumps(audit, indent=2))
        if audit["decision"] != "preflight_passed":
            raise SystemExit(1)
        if args.apply:
            from tools.ingestion_run import run_ingestion_with_evidence
            result = run_ingestion_with_evidence(client, *batch, **options, report_path=args.report)
            print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
