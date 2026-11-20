"""Compute GapPriority from canonical JSON or inspect live pilot readiness."""
import argparse
from calendar import monthrange
from getpass import getpass
import json
import os
from pathlib import Path

from tools.computational_engine.gap_priority import compute_gap_priority


def pilot_inputs(client):
    from tools.computational_engine.service import answer

    evidence = answer(client, "Compare Python in JobVision and Purdue")
    scope = evidence["market"]["scope"]
    demand = evidence["market"]["postings_with_recorded_skills"]
    # Month-sized source observations are represented by their full calendar bounds.
    year, month = map(int, scope["last_activation_month"].split("-"))
    return {
        "skill_id": evidence["skill_id"],
        "market": {
            "skill_id": evidence["skill_id"],
            "role_id": "jobvision-software-and-network-pilot",
            "geography": scope["country"],
            "start_date": scope["first_activation_month"] + "-01",
            "end_date": f"{year:04d}-{month:02d}-{monthrange(year, month)[1]:02d}",
            "population": " / ".join(scope["categories"]),
            "denominator_definition": "distinct postings with recorded skills in the pilot batch",
            "source_reference": f"{scope['index']} / {scope['collection_batch']}",
            "matching_postings": demand["numerator"],
            "assessable_postings": demand["denominator"],
        },
    }, evidence["education"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group(required=True)
    modes.add_argument("--input", type=Path)
    modes.add_argument("--courses", "--pilot", action="store_true", help="Evaluate course alignment across published batches (v2)")
    parser.add_argument("--prompt-password", action="store_true")
    args = parser.parse_args()
    if args.courses:
        if args.prompt_password:
            os.environ["ELASTICSEARCH_PASSWORD"] = getpass("Elasticsearch password: ")
        from config import get_elasticsearch_client

        with get_elasticsearch_client() as client:
            from tools.computational_engine.course_alignment import live_report
            report = live_report(client)
    else:
        payload = json.loads(args.input.read_text(encoding="utf-8-sig"))
        report = compute_gap_priority(**payload)
    print(json.dumps(report, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    main()
