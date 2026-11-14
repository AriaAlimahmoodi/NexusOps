from __future__ import annotations

import argparse
import json
import sys
from typing import Any

from elasticsearch.helpers import scan

from config import get_elasticsearch_client
from tools.data_governance import audit_dataset_provenance, audit_skill_mapping


INDEXES = (
    "university_graduates",
    "university_courses",
    "course_graduate_records",
    "labor_market",
    "skill_mapping",
)


def _read_index(client: Any, index: str) -> list[dict[str, Any]]:
    return [
        {"_id": hit.get("_id"), **(hit.get("_source") or {})}
        for hit in scan(
            client,
            index=index,
            query={"query": {"match_all": {}}},
            _source=True,
        )
    ]


def build_audit_report(client: Any) -> dict[str, Any]:
    datasets = {index: _read_index(client, index) for index in INDEXES}
    provenance = {
        index: audit_dataset_provenance(records, dataset_id=index)
        for index, records in datasets.items()
    }
    mappings = audit_skill_mapping(
        datasets["skill_mapping"],
        datasets["university_courses"],
        datasets["labor_market"],
    )
    return {
        "audit": "NexusOps Phase 8 Data Governance",
        "read_only": True,
        "datasets": {
            index: {
                "total_records": report["total_records"],
                "verified_records": report["verified_records"],
                "unverified_records": report["unverified_records"],
                "invalid_records": report["invalid_records"],
                "provenance_coverage": report["provenance_coverage"],
                "issues": report["issues"],
            }
            for index, report in provenance.items()
        },
        "skill_mapping": mappings,
        "summary": {
            "total_records": sum(item["total_records"] for item in provenance.values()),
            "verified_records": sum(item["verified_records"] for item in provenance.values()),
            "unverified_records": sum(item["unverified_records"] for item in provenance.values()),
            "invalid_records": sum(item["invalid_records"] for item in provenance.values()),
            "mapping_invalid_records": mappings["invalid_records"],
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Read-only provenance and skill-mapping audit for NexusOps Phase 8."
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Return exit code 1 when any record lacks complete provenance.",
    )
    parser.add_argument(
        "--output",
        help="Optional path for writing the JSON audit report.",
    )
    args = parser.parse_args()

    client = get_elasticsearch_client()
    try:
        report = build_audit_report(client)
    finally:
        client.close()

    rendered = json.dumps(report, ensure_ascii=False, indent=2)
    print(rendered)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as handle:
            handle.write(rendered + "\n")

    summary = report["summary"]
    if summary["invalid_records"] or summary["mapping_invalid_records"]:
        return 1
    if args.strict and summary["unverified_records"]:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
