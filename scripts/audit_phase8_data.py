from __future__ import annotations

import argparse
import json
import sys
from typing import Any

from elasticsearch.helpers import scan

from config import get_elasticsearch_client
from tools.data_governance import audit_dataset_provenance, audit_skill_mapping
from tools.dataset_registry import DATASET_PROFILES


INDEXES = tuple(profile["index"] for profile in DATASET_PROFILES.values())
REAL_INDEXES = {
    dataset_id: profile["real_index"]
    for dataset_id, profile in DATASET_PROFILES.items()
}


def _index_exists(client: Any, index: str) -> bool:
    return bool(client.indices.exists(index=index))


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
    datasets: dict[str, list[dict[str, Any]]] = {}
    provenance: dict[str, dict[str, Any]] = {}

    for dataset_id, profile in DATASET_PROFILES.items():
        synthetic_index = profile["index"]
        synthetic_records = _read_index(client, synthetic_index)
        datasets[synthetic_index] = synthetic_records
        provenance[synthetic_index] = audit_dataset_provenance(
            synthetic_records,
            dataset_id=dataset_id,
            classification="synthetic",
        )

        real_index = profile["real_index"]
        if _index_exists(client, real_index):
            real_records = _read_index(client, real_index)
            datasets[real_index] = real_records
            provenance[real_index] = audit_dataset_provenance(
                real_records,
                dataset_id=dataset_id,
                classification="real",
            )

    synthetic_mapping = audit_skill_mapping(
        datasets["skill_mapping"],
        datasets["university_courses"],
        datasets["labor_market"],
    )

    real_mapping = None
    required_real_indexes = (
        REAL_INDEXES["skill_mapping"],
        REAL_INDEXES["university_courses"],
        REAL_INDEXES["labor_market"],
    )
    if all(index in datasets for index in required_real_indexes):
        real_mapping = audit_skill_mapping(
            datasets[REAL_INDEXES["skill_mapping"]],
            datasets[REAL_INDEXES["university_courses"]],
            datasets[REAL_INDEXES["labor_market"]],
        )

    summary = {
        "total_records": sum(item["total_records"] for item in provenance.values()),
        "synthetic_records": sum(item["synthetic_records"] for item in provenance.values()),
        "verified_records": sum(item["verified_records"] for item in provenance.values()),
        "unverified_records": sum(item["unverified_records"] for item in provenance.values()),
        "invalid_records": sum(item["invalid_records"] for item in provenance.values()),
        "mapping_invalid_records": synthetic_mapping["invalid_records"] + (
            real_mapping["invalid_records"] if real_mapping else 0
        ),
    }

    return {
        "audit": "NexusOps Phase 8 Data Governance",
        "read_only": True,
        "classification_policy": {
            "synthetic_indexes": list(INDEXES),
            "real_index_suffix": "_real",
            "real_indexes_present": sorted(
                index for index in REAL_INDEXES.values() if index in datasets
            ),
        },
        "datasets": provenance,
        "skill_mapping": synthetic_mapping,
        "skill_mapping_real": real_mapping,
        "summary": summary,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Read-only audit of synthetic and real NexusOps datasets."
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Return exit code 1 when any real record lacks complete provenance.",
    )
    parser.add_argument("--output", help="Optional path for the JSON audit report.")
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
