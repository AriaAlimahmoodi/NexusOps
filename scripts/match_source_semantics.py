"""CLI for reviewing semantic matches between a profiled source and NexusOps datasets.

Run from the repository root:
    python -m scripts.match_source_semantics jobvision-source-profile.json
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from tools.dataset_registry import DATASET_PROFILES
from tools.semantic_matching import match_source_profile


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Propose conservative source-to-NexusOps semantic field matches."
    )
    parser.add_argument("profile", help="Path to a source profile JSON file.")
    parser.add_argument(
        "--output",
        default="semantic-match-report.json",
        help="Output JSON report path (default: semantic-match-report.json).",
    )
    parser.add_argument("--auto-threshold", type=float, default=0.88)
    parser.add_argument("--review-threshold", type=float, default=0.62)
    parser.add_argument("--top-k", type=int, default=5)
    args = parser.parse_args()

    profile_path = Path(args.profile)
    if not profile_path.is_file():
        parser.error(f"source profile does not exist: {profile_path}")

    try:
        source_profile = json.loads(profile_path.read_text(encoding="utf-8"))
        report = match_source_profile(
            source_profile,
            DATASET_PROFILES.values(),
            auto_match_threshold=args.auto_threshold,
            review_threshold=args.review_threshold,
            top_k=args.top_k,
        )
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError) as error:
        parser.error(str(error))

    output_path = Path(args.output)
    output_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "status": "matched",
        **report["summary"],
        "report_path": str(output_path),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
