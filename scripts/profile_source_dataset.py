"""Command-line entry point for generic source dataset profiling."""
from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

from tools.source_discovery import profile_csv_file


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Profile a CSV source using bounded memory; no data is ingested."
    )
    parser.add_argument("input", help="Path to the source CSV file.")
    parser.add_argument("--encoding", default="utf-8-sig")
    parser.add_argument("--delimiter", default=None)
    parser.add_argument("--sample-values", type=int, default=5)
    parser.add_argument("--top-values", type=int, default=10)
    parser.add_argument("--max-distinct-values", type=int, default=1000)
    parser.add_argument("--output", default=None, help="Optional JSON report path.")
    args = parser.parse_args()

    try:
        report = profile_csv_file(
            args.input,
            encoding=args.encoding,
            delimiter=args.delimiter,
            sample_limit=args.sample_values,
            top_values_limit=args.top_values,
            max_distinct_values=args.max_distinct_values,
        )
    except (OSError, UnicodeError, ValueError, csv.Error) as error:
        parser.error(str(error))

    rendered = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        output_path = Path(args.output)
        output_path.write_text(rendered + "\n", encoding="utf-8")
        print(json.dumps({
            "status": "profiled",
            "source_name": report["source_name"],
            "row_count": report["row_count"],
            "column_count": report["column_count"],
            "report_path": str(output_path),
        }, ensure_ascii=False, indent=2))
    else:
        print(rendered)
    return 0


if __name__ == "__main__":
    sys.exit(main())
