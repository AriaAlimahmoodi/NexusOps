"""Read-only content-level audit of bilingual source columns.

This complements audit_source_semantic_coverage.py by examining distinct
Persian/English value pairs and comma-delimited token alignment. It does not
modify source files, schemas, or Elasticsearch data.

Example:
    python -m scripts.audit_bilingual_content jobvision-source-profile.json \\
        --csv "D:/data/JobVision_Jobposts_Dataset.csv" \\
        --output jobvision-bilingual-content-audit.json
"""
from __future__ import annotations

import argparse
import csv
import json
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from scripts.audit_source_semantic_coverage import build_audit


_VALUE_PAIR_LIMIT = 1000
_TOKEN_PAIR_LIMIT = 5000
_CONFLICT_VALUE_LIMIT = 100
_MISMATCH_PAIR_LIMIT = 50


def _display(value: str | None) -> str:
    if value is None:
        return ""
    value = unicodedata.normalize("NFKC", value)
    return " ".join(value.replace("\\r", " ").replace("\\n", " ").split())


def _norm(value: str | None) -> str:
    return _display(value).casefold()


def _split_tokens(value: str | None) -> list[str]:
    """Split the source's comma-delimited multi-value representation."""
    normalized = _display(value)
    if not normalized:
        return []
    return [token.strip() for token in normalized.split(",") if token.strip()]


def _new_pair_state() -> dict[str, Any]:
    return {
        "rows": 0,
        "both": 0,
        "both_null": 0,
        "left_only_null": 0,
        "right_only_null": 0,
        "value_pairs": Counter(),
        "value_pair_display": {},
        "token_pairs": Counter(),
        "token_pair_display": {},
        "left_to_right": defaultdict(set),
        "right_to_left": defaultdict(set),
        "left_token_display": {},
        "right_token_display": {},
        "token_count_pairs": Counter(),
        "mismatch_value_pairs": Counter(),
        "mismatch_display": {},
        "rows_with_delimiter": 0,
        "rows_tokenized": 0,
    }


def _consume_row(
    state: dict[str, Any],
    row: dict[str, str],
    left_name: str,
    right_name: str,
) -> None:
    state["rows"] += 1
    left_raw = row.get(left_name)
    right_raw = row.get(right_name)
    left_display = _display(left_raw)
    right_display = _display(right_raw)
    left = _norm(left_raw)
    right = _norm(right_raw)

    if not left and not right:
        state["both_null"] += 1
        return
    if not left:
        state["left_only_null"] += 1
        return
    if not right:
        state["right_only_null"] += 1
        return

    state["both"] += 1
    value_key = (left, right)
    state["value_pairs"][value_key] += 1
    state["value_pair_display"].setdefault(value_key, (left_display, right_display))

    if "," in left_display or "," in right_display:
        state["rows_with_delimiter"] += 1

    left_tokens_display = _split_tokens(left_raw)
    right_tokens_display = _split_tokens(right_raw)
    left_tokens = [_norm(token) for token in left_tokens_display]
    right_tokens = [_norm(token) for token in right_tokens_display]
    state["token_count_pairs"][(len(left_tokens), len(right_tokens))] += 1

    for token, display in zip(left_tokens, left_tokens_display):
        state["left_token_display"].setdefault(token, display)
    for token, display in zip(right_tokens, right_tokens_display):
        state["right_token_display"].setdefault(token, display)

    if len(left_tokens) != len(right_tokens):
        state["mismatch_value_pairs"][value_key] += 1
        state["mismatch_display"].setdefault(value_key, (left_display, right_display))
        return

    state["rows_tokenized"] += 1
    # Positional pairing is evidence only: it assumes both languages keep
    # the same item order. It is not an automatic translation approval.
    for left_token, right_token, left_label, right_label in zip(
        left_tokens, right_tokens, left_tokens_display, right_tokens_display
    ):
        token_key = (left_token, right_token)
        state["token_pairs"][token_key] += 1
        state["token_pair_display"].setdefault(token_key, (left_label, right_label))
        state["left_to_right"][left_token].add(right_token)
        state["right_to_left"][right_token].add(left_token)


def _top_pairs(
    counter: Counter[tuple[str, str]],
    display_values: dict[tuple[str, str], tuple[str, str]],
    limit: int,
) -> tuple[list[dict[str, Any]], bool]:
    ordered = counter.most_common(limit)
    result = [
        {
            "left_value": display_values[key][0],
            "right_value": display_values[key][1],
            "row_count": count,
        }
        for key, count in ordered
    ]
    return result, len(counter) > limit


def _finish_pair(
    state: dict[str, Any],
    left_name: str,
    right_name: str,
) -> dict[str, Any]:
    left_conflicts = {
        key: values for key, values in state["left_to_right"].items() if len(values) > 1
    }
    right_conflicts = {
        key: values for key, values in state["right_to_left"].items() if len(values) > 1
    }
    token_pair_rows, token_pairs_truncated = _top_pairs(
        state["token_pairs"], state["token_pair_display"], _TOKEN_PAIR_LIMIT
    )
    value_pair_rows, value_pairs_truncated = _top_pairs(
        state["value_pairs"], state["value_pair_display"], _VALUE_PAIR_LIMIT
    )
    mismatch_rows, mismatch_truncated = _top_pairs(
        state["mismatch_value_pairs"], state["mismatch_display"], _MISMATCH_PAIR_LIMIT
    )
    token_count_pairs = state["token_count_pairs"]

    return {
        "fields": [left_name, right_name],
        "rows": state["rows"],
        "both_non_null_rows": state["both"],
        "both_null_rows": state["both_null"],
        "left_null_right_present_rows": state["left_only_null"],
        "right_null_left_present_rows": state["right_only_null"],
        "distinct_left_values": len({key[0] for key in state["value_pairs"]}),
        "distinct_right_values": len({key[1] for key in state["value_pairs"]}),
        "distinct_observed_value_pairs": len(state["value_pairs"]),
        "observed_value_pairs": value_pair_rows,
        "observed_value_pairs_truncated": value_pairs_truncated,
        "comma_delimited_rows": state["rows_with_delimiter"],
        "token_count_pair_distribution": [
            {"left_token_count": left_count, "right_token_count": right_count, "rows": count}
            for (left_count, right_count), count in sorted(token_count_pairs.items())
        ],
        "rows_with_token_count_mismatch": sum(
            count for (left_count, right_count), count in token_count_pairs.items()
            if left_count != right_count
        ),
        "rows_with_equal_token_count": state["rows_tokenized"],
        "distinct_left_tokens": len(state["left_token_display"]),
        "distinct_right_tokens": len(state["right_token_display"]),
        "distinct_positional_token_pairs": len(state["token_pairs"]),
        "positional_token_pair_candidates": token_pair_rows,
        "positional_token_pair_candidates_truncated": token_pairs_truncated,
        "left_tokens_with_multiple_right_candidates": len(left_conflicts),
        "right_tokens_with_multiple_left_candidates": len(right_conflicts),
        "left_token_conflicts": [
            {
                "left_token": state["left_token_display"].get(token, token),
                "right_candidates": sorted(
                    state["right_token_display"].get(value, value) for value in values
                ),
            }
            for token, values in list(sorted(left_conflicts.items()))[:_CONFLICT_VALUE_LIMIT]
        ],
        "right_token_conflicts": [
            {
                "right_token": state["right_token_display"].get(token, token),
                "left_candidates": sorted(
                    state["left_token_display"].get(value, value) for value in values
                ),
            }
            for token, values in list(sorted(right_conflicts.items()))[:_CONFLICT_VALUE_LIMIT]
        ],
        "value_pairs_with_token_count_mismatch": mismatch_rows,
        "value_pairs_with_token_count_mismatch_truncated": mismatch_truncated,
        "interpretation": (
            "Token pairs are positional candidates only. They assume source item order "
            "is aligned and require semantic review; they are not verified translations."
        ),
    }


def build_content_audit(
    source_profile: dict[str, Any],
    csv_path: Path,
) -> dict[str, Any]:
    columns = source_profile.get("columns")
    if not isinstance(columns, dict):
        raise ValueError("Source profile must contain a columns object.")
    if not csv_path.is_file():
        raise ValueError(f"CSV file does not exist: {csv_path}")

    # Reuse the exact bilingual pair inventory already established by the
    # previous audit; do not create a second, divergent pair detector.
    base_audit = build_audit(source_profile)
    pairs = [item["fields"] for item in base_audit["bilingual_pair_candidates"]]
    states = {tuple(pair): _new_pair_state() for pair in pairs}

    with csv_path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        headers = reader.fieldnames or []
        missing = sorted(set(columns) - set(headers))
        if missing:
            raise ValueError(f"CSV is missing profiled columns: {missing}")
        row_count = 0
        for row in reader:
            row_count += 1
            for left_name, right_name in pairs:
                _consume_row(states[(left_name, right_name)], row, left_name, right_name)

    pair_results = [
        _finish_pair(states[(left_name, right_name)], left_name, right_name)
        for left_name, right_name in pairs
    ]
    return {
        "audit_version": 1,
        "source": {
            "name": source_profile.get("source_name"),
            "profiled_row_count": source_profile.get("row_count"),
            "rows_read": row_count,
            "column_count": len(columns),
            "row_count_matches_profile": row_count == source_profile.get("row_count"),
        },
        "pair_count": len(pair_results),
        "bilingual_content_audit": pair_results,
        "policy": {
            "read_only": True,
            "schema_mutation": False,
            "source_data_mutation": False,
            "ingestion": False,
            "automatic_translation_acceptance": False,
            "automatic_column_dropping": False,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Read-only content-level audit of bilingual source columns."
    )
    parser.add_argument("profile", help="Source profile JSON.")
    parser.add_argument("--csv", required=True, help="Local source CSV.")
    parser.add_argument("--output", default="bilingual-content-audit.json")
    args = parser.parse_args()

    try:
        profile = json.loads(Path(args.profile).read_text(encoding="utf-8"))
        report = build_content_audit(profile, Path(args.csv))
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError, csv.Error) as error:
        parser.error(str(error))

    output_path = Path(args.output)
    output_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "status": "completed",
        "source_rows": report["source"]["rows_read"],
        "bilingual_pairs": report["pair_count"],
        "row_count_matches_profile": report["source"]["row_count_matches_profile"],
        "report_path": str(output_path),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
