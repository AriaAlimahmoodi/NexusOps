"""Validate or publish the original BLS and College Scorecard CSV files."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from tools.adapters.base import SourceSpec
from tools.adapters.registry import create_default_adapter_registry
from tools.adapters.us_public_csv import BLS_FIELDS, COLLEGE_FIELDS, USPublicCSVSourceAdapter
from tools.source_ingestion_preflight import audit_source_ingestion_preflight
from tools.source_mapping import SourceMappingSpec

_SOURCES = {
    "bls": (
        "us_unemployment_monthly", "bls_csv", BLS_FIELDS,
        "BLS Current Population Survey",
        "https://download.bls.gov/pub/time.series/ln/ln.data.1.AllData",
        "U.S. Bureau of Labor Statistics",
        "U.S. federal public data",
        "Series LNS14000000, national and seasonally adjusted. Missing rates stay null.",
    ),
    "college-scorecard": (
        "us_college_institutions", "college_scorecard_csv", COLLEGE_FIELDS,
        "College Scorecard institution archive (April 2023)",
        "https://zenodo.org/records/7857257",
        "U.S. Department of Education (archive deposited on Zenodo)",
        "U.S. federal public data, educational archive",
        "Institution-level archive, not a current release. Suppressed values stay null.",
    ),
}


def _file_digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def build_source(kind, path, retrieved_at):
    dataset, fmt, fields, name, url, publisher, license_name, limitations = _SOURCES[kind]
    digest = _file_digest(path)
    manifest = {
        "collection_batch": f"{dataset}-{digest}",
        "source_name": name,
        "source_url": url,
        "publisher": publisher,
        "retrieved_at": retrieved_at,
        "geographic_scope": "US",
        "license": license_name,
        "collection_method": "Public file download",
        "limitations": limitations,
    }
    registry = create_default_adapter_registry()
    registry.register(USPublicCSVSourceAdapter(fmt, manifest))
    provenance = ("source", "observed_at", "collection_batch", "time_granularity")
    mapping = SourceMappingSpec(
        mapping_id=f"{dataset}-csv-v1",
        dataset_id=dataset,
        source_name=name,
        field_mappings={**fields, **{field: field for field in provenance}},
        reviewed_by="NexusOps implementation review (Codex)",
        reviewed_at="2026-11-20T00:00:00+03:30",
        review_reference="Built-in source column contract in tools/adapters/us_public_csv.py",
    )
    return (dataset, fmt, SourceSpec(str(path), {"delimiter": ","}), manifest), {
        "adapter_registry": registry, "mapping_spec": mapping,
    }, digest


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, choices=tuple(_SOURCES))
    parser.add_argument("--input", required=True, type=Path, help="Path to the original UTF-8 CSV.")
    parser.add_argument("--retrieved-at", required=True, help="Collection timestamp in ISO-8601 with timezone.")
    parser.add_argument("--apply", action="store_true", help="Publish after preflight succeeds.")
    parser.add_argument("--report", type=Path, help="Publication evidence JSON path.")
    args = parser.parse_args()

    try:
        batch, options, digest = build_source(args.source, args.input, args.retrieved_at)
        preflight = audit_source_ingestion_preflight(*batch, **options)
        print(json.dumps(preflight, indent=2))
        if preflight["decision"] != "preflight_passed":
            return 1
        if args.apply:
            if _file_digest(args.input) != digest:
                raise ValueError("Input CSV changed during preflight.")
            from config import get_elasticsearch_client
            from tools.ingestion_run import run_ingestion_with_evidence

            client = get_elasticsearch_client()
            try:
                if not client.ping():
                    raise RuntimeError("Elasticsearch connection failed. Check the NexusOps .env settings.")
                report = run_ingestion_with_evidence(client, *batch, **options, report_path=args.report)
                print(json.dumps(report, indent=2))
            finally:
                client.close()
    except (OSError, ValueError, RuntimeError) as error:
        parser.exit(1, f"{error}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
