from __future__ import annotations

import argparse
import json
import re
import statistics
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BENCHMARK_PATH = ROOT / "benchmarks" / "phase7_quality_cases.json"
REPORT_DEFAULT = ROOT / "reports" / "phase7-quality-benchmark.json"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.run_agent_e2e import find_webhook_id, post_chat


ERROR_MARKERS = re.compile(
    r"\b(error|exception|traceback|partial_failure|incomplete)\b|خطای اجرایی|خطا در اجرای|درخواست نامعتبر",
    re.IGNORECASE,
)


def normalize_digits(value: str) -> str:
    value = value.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789"))
    value = value.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789"))
    return value.replace("٫", ".").replace("٬", ",")


def numeric_tokens(text: str) -> list[float]:
    normalized = normalize_digits(text).replace(",", "")
    tokens = re.findall(r"(?<![\w.])-?\d+(?:\.\d+)?(?![\w.])", normalized)
    values: list[float] = []
    for token in tokens:
        try:
            values.append(float(token))
        except ValueError:
            continue
    return values


def language_matches(text: str, expected: str) -> bool:
    persian = len(re.findall(r"[\u0600-\u06FF]", text))
    latin = len(re.findall(r"[A-Za-z]", text))
    if expected == "fa":
        return persian > 0
    if expected == "en":
        return persian == 0 and latin > 0
    return False


def ranked_entry_count(text: str) -> int:
    text = normalize_digits(text)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    numbered = [
        line for line in lines
        if re.match(r"^(?:[-*]\s*)?\d{1,2}[.)]\s+\S", line)
    ]
    bullets = [line for line in lines if re.match(r"^[-*]\s+\S", line)]
    table_rows = [
        line for line in lines
        if line.startswith("|")
        and line.count("|") >= 3
        and not re.match(r"^\|\s*:?-{2,}", line)
        and not re.search(r"\b(skill|rank)\b|مهارت|رتبه", line, re.IGNORECASE)
    ]
    return max(len(numbered), len(bullets), len(table_rows))


def evaluate_criterion(criterion: dict[str, Any], text: str) -> dict[str, Any]:
    kind = criterion.get("type")
    passed = False
    observed: Any = None

    if kind == "contains_all":
        values = criterion.get("values", [])
        observed = [value for value in values if str(value).casefold() in text.casefold()]
        passed = len(observed) == len(values)
    elif kind == "contains_any":
        values = criterion.get("values", [])
        observed = [value for value in values if str(value).casefold() in text.casefold()]
        passed = bool(observed)
    elif kind == "contains_none":
        values = criterion.get("values", [])
        observed = [value for value in values if str(value).casefold() in text.casefold()]
        passed = not observed
    elif kind == "regex":
        pattern = criterion.get("pattern", "")
        passed = bool(re.search(pattern, text, re.IGNORECASE | re.MULTILINE))
        observed = pattern
    elif kind == "numeric_only":
        normalized = normalize_digits(text).strip()
        compact = re.sub(r"[\\s*!.]", "", normalized)
        expected = str(criterion.get("expected"))
        passed = compact == expected
        observed = {"expected": expected, "normalized": compact}
    elif kind == "language":
        expected = criterion.get("expected")
        passed = language_matches(text, expected)
        observed = {"expected": expected}
    elif kind == "numeric_values":
        expected = criterion.get("values", [])
        actual = numeric_tokens(text)
        tolerance = float(criterion.get("tolerance", 0))
        unmatched = list(actual)
        missing = []
        for value in expected:
            match_index = next(
                (index for index, actual_value in enumerate(unmatched)
                 if abs(actual_value - float(value)) <= tolerance),
                None,
            )
            if match_index is None:
                missing.append(value)
            else:
                unmatched.pop(match_index)
        passed = not missing
        observed = {"missing_values": missing, "numeric_tokens": actual}
    elif kind == "entity_numeric_pairs":
        tolerance = float(criterion.get("tolerance", 0))
        missing_pairs = []
        observed_pairs = []
        for pair in criterion.get("pairs", []):
            entity = str(pair.get("entity", ""))
            entity_lines = [line for line in text.splitlines() if entity.casefold() in line.casefold()]
            actual_values = [value for line in entity_lines for value in numeric_tokens(line)]
            unmatched = list(actual_values)
            missing_values = []
            for expected_value in pair.get("values", []):
                match_index = next(
                    (index for index, actual_value in enumerate(unmatched)
                     if abs(actual_value - float(expected_value)) <= tolerance),
                    None,
                )
                if match_index is None:
                    missing_values.append(expected_value)
                else:
                    unmatched.pop(match_index)
            if missing_values or not entity_lines:
                missing_pairs.append({"entity": entity, "missing_values": missing_values})
            observed_pairs.append({"entity": entity, "values": actual_values})
        passed = not missing_pairs
        observed = {"missing_pairs": missing_pairs, "observed_pairs": observed_pairs}
    elif kind == "table_present":
        table_lines = [line for line in text.splitlines() if line.strip().startswith("|") and line.count("|") >= 3]
        passed = len(table_lines) >= 3
        observed = {"table_lines": len(table_lines)}
    elif kind == "ranked_entries_min":
        count = ranked_entry_count(text)
        passed = count >= int(criterion.get("minimum", 1))
        observed = {"ranked_entries": count, "minimum": criterion.get("minimum")}
    else:
        raise ValueError(f"Unsupported benchmark criterion type: {kind!r}")

    return {
        "id": criterion.get("id"),
        "dimension": criterion.get("dimension", "uncategorized"),
        "description": criterion.get("description", ""),
        "points": float(criterion.get("points", 0)),
        "critical": criterion.get("critical") is True,
        "status": "PASS" if passed else "FAIL",
        "observed": observed,
    }


def evaluate_case(case: dict[str, Any], status_code: int, response_text: str) -> dict[str, Any]:
    text = response_text.strip()
    criteria = case.get("criteria")
    if not isinstance(criteria, list) or not criteria:
        raise ValueError(f"Benchmark case {case.get('id')} has no criteria.")

    if not 200 <= status_code < 300:
        checks = [{
            "id": "http_status",
            "dimension": "reliability",
            "description": "Chat Trigger returned a successful HTTP status.",
            "points": 100.0,
            "critical": True,
            "status": "FAIL",
            "observed": {"http_status": status_code, "response_excerpt": text[:500]},
        }]
    elif not text:
        checks = [{
            "id": "non_empty_response",
            "dimension": "reliability",
            "description": "Chat Trigger returned a non-empty response.",
            "points": 100.0,
            "critical": True,
            "status": "FAIL",
            "observed": None,
        }]
    else:
        checks = [evaluate_criterion(item, text) for item in criteria]
        if ERROR_MARKERS.search(text):
            checks.append({
                "id": "global_execution_error_guard",
                "dimension": "reliability",
                "description": "Response must not contain an execution failure marker.",
                "points": 0.0,
                "critical": True,
                "status": "FAIL",
                "observed": ERROR_MARKERS.search(text).group(0),
            })

    total_points = sum(item["points"] for item in checks)
    earned_points = sum(item["points"] for item in checks if item["status"] == "PASS")
    score = round((earned_points / total_points) * 100, 2) if total_points else 0.0
    critical_failures = [item["id"] for item in checks if item["critical"] and item["status"] != "PASS"]

    return {
        "id": case.get("id"),
        "name": case.get("name"),
        "status": "PASS" if not critical_failures else "FAIL",
        "score": score,
        "critical_failures": critical_failures,
        "checks": checks,
        "response_excerpt": text[:4000],
    }


def load_cases(selected_ids: set[str] | None = None) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    payload = json.loads(BENCHMARK_PATH.read_text(encoding="utf-8"))
    cases = payload.get("cases")
    if not isinstance(cases, list) or not cases:
        raise ValueError("Phase 7 benchmark dataset has no cases.")
    ids = [case.get("id") for case in cases]
    if len(ids) != len(set(ids)):
        raise ValueError("Phase 7 benchmark case IDs must be unique.")
    if selected_ids:
        unknown = selected_ids - set(ids)
        if unknown:
            raise ValueError(f"Unknown benchmark case IDs: {', '.join(sorted(unknown))}")
        cases = [case for case in cases if case["id"] in selected_ids]
    return payload, cases


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Evaluate NexusOps answer quality against a deterministic Phase 7 benchmark."
    )
    parser.add_argument("--base-url", default="http://127.0.0.1:5678")
    parser.add_argument("--timeout", type=float, default=300)
    parser.add_argument("--min-case-score", type=float, default=80)
    parser.add_argument("--min-overall-score", type=float, default=85)
    parser.add_argument("--case", action="append", dest="case_ids", help="Run one case ID; repeat to select multiple.")
    parser.add_argument("--report", default=str(REPORT_DEFAULT))
    args = parser.parse_args(argv)

    if args.timeout <= 0:
        parser.error("--timeout must be positive.")
    if not 0 <= args.min_case_score <= 100 or not 0 <= args.min_overall_score <= 100:
        parser.error("Score thresholds must be between 0 and 100.")

    try:
        dataset, cases = load_cases(set(args.case_ids) if args.case_ids else None)
        endpoint = f"{args.base_url.rstrip('/')}/webhook/{find_webhook_id()}/chat"
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as exc:
        print(f"SETUP FAIL: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 2

    print(f"{dataset.get('suite')} — {dataset.get('version')}")
    print(f"Target: {endpoint}")
    print(f"Cases: {len(cases)} | sequential independent sessions | timeout: {args.timeout:.0f}s")
    print("Scoring: deterministic reference checks; no LLM judge or paid API")
    print("-" * 76)

    results: list[dict[str, Any]] = []
    for case in cases:
        started = time.perf_counter()
        try:
            status_code, response_text, session_id, _ = post_chat(endpoint, case, args.timeout)
            result = evaluate_case(case, status_code, response_text)
            result["session_ref"] = session_id[-8:]
            result["duration_seconds"] = round(time.perf_counter() - started, 2)
        except Exception as exc:
            result = {
                "id": case.get("id"),
                "name": case.get("name"),
                "status": "FAIL",
                "score": 0.0,
                "critical_failures": ["benchmark_execution"],
                "checks": [],
                "error": f"{type(exc).__name__}: {str(exc)[:500]}",
                "duration_seconds": round(time.perf_counter() - started, 2),
            }
        results.append(result)
        print(f"{result['id']}  {result['status']:<4}  {result['score']:6.2f}/100  {result['duration_seconds']:7.2f}s  {result['name']}")

    scores = [item["score"] for item in results]
    overall_score = round(statistics.mean(scores), 2) if scores else 0.0
    dimension_totals: dict[str, dict[str, float]] = {}
    for result in results:
        for check in result.get("checks", []):
            bucket = dimension_totals.setdefault(check["dimension"], {"earned": 0.0, "possible": 0.0})
            bucket["possible"] += check["points"]
            if check["status"] == "PASS":
                bucket["earned"] += check["points"]
    dimension_scores = {
        key: round(value["earned"] / value["possible"] * 100, 2) if value["possible"] else 0.0
        for key, value in dimension_totals.items()
    }
    failed_cases = [
        item["id"] for item in results
        if item["status"] != "PASS" or item["score"] < args.min_case_score
    ]
    overall = (
        "PASS"
        if not failed_cases and overall_score >= args.min_overall_score and len(results) == len(cases)
        else "FAIL"
    )

    report = {
        "suite": dataset.get("suite"),
        "version": dataset.get("version"),
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "target_workflow": "NexusOps-Agentic-Workflow",
        "target_endpoint": endpoint,
        "overall": overall,
        "overall_score": overall_score,
        "thresholds": {
            "minimum_case_score": args.min_case_score,
            "minimum_overall_score": args.min_overall_score,
        },
        "summary": {
            "total": len(results),
            "passed": sum(item["status"] == "PASS" and item["score"] >= args.min_case_score for item in results),
            "failed": len(failed_cases),
            "failed_cases": failed_cases,
        },
        "dimension_scores": dimension_scores,
        "limitations": [
            "This is a deterministic reference-based quality benchmark, not a general measure of human-perceived intelligence.",
            "Keyword, numeric, language, and structure checks can miss semantic errors or accept awkward wording; human review remains necessary.",
            "Reference values describe the current synthetic project dataset and must be reviewed when that dataset changes.",
            "Cases run sequentially with independent sessions; this benchmark does not measure concurrency or same-session ordering.",
        ],
        "results": results,
    }

    report_path = Path(args.report)
    if not report_path.is_absolute():
        report_path = ROOT / report_path
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("-" * 76)
    print(f"QUALITY SCORE: {overall_score:.2f}/100")
    print(f"SUMMARY: {report['summary']['passed']}/{len(results)} PASS | {len(failed_cases)} FAIL | OVERALL {overall}")
    print("DIMENSIONS: " + " | ".join(f"{key}={value:.1f}" for key, value in dimension_scores.items()))
    print(f"Report: {report_path}")
    return 0 if overall == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
