from __future__ import annotations

import importlib.util
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "run_phase7_quality_benchmark.py"
SPEC = importlib.util.spec_from_file_location("phase7_quality_benchmark", SCRIPT)
assert SPEC and SPEC.loader
benchmark = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(benchmark)


def test_phase7_dataset_has_unique_eight_case_benchmark():
    payload, cases = benchmark.load_cases()
    assert payload["version"] == "1.0"
    assert len(cases) == 8
    assert len({case["id"] for case in cases}) == 8


def test_case_selection_rejects_unknown_ids():
    try:
        benchmark.load_cases({"Q99"})
    except ValueError as exc:
        assert "Q99" in str(exc)
    else:
        raise AssertionError("Unknown benchmark case must be rejected.")


def test_numeric_tokenizer_normalizes_persian_digits_and_decimal_separator():
    assert benchmark.numeric_tokens("۴٫۵۸ و ۲۹۱۰") == [4.58, 2910.0]


def test_numeric_values_requires_each_reference_value_not_just_any_number():
    criterion = {
        "id": "facts",
        "type": "numeric_values",
        "values": [4.58, 2910, 4.73, 2480],
        "tolerance": 0.000001,
        "points": 100,
        "critical": True,
    }
    assert benchmark.evaluate_criterion(criterion, "Python 4.58 / 2910; SQL 4.73 / 2480")["status"] == "PASS"
    assert benchmark.evaluate_criterion(criterion, "Python 4.58 / 2910; SQL 4.73 / 2400")["status"] == "FAIL"


def test_numeric_values_consumes_duplicate_expected_values_separately():
    criterion = {"id": "dupes", "type": "numeric_values", "values": [4.9, 4.9], "points": 100}
    assert benchmark.evaluate_criterion(criterion, "4.9")["status"] == "FAIL"
    assert benchmark.evaluate_criterion(criterion, "4.9 and 4.9")["status"] == "PASS"


def test_english_language_check_rejects_persian_script():
    criterion = {"id": "lang", "type": "language", "expected": "en", "points": 100}
    assert benchmark.evaluate_criterion(criterion, "C002 — Data Structures")["status"] == "PASS"
    assert benchmark.evaluate_criterion(criterion, "C002 — Data Structures — ساختمان داده")["status"] == "FAIL"


def test_ranked_entry_counter_detects_numbered_and_table_rows():
    assert benchmark.ranked_entry_count("1. Python\n2. SQL\n3. Java\n4. Go\n5. Rust") == 5
    assert benchmark.ranked_entry_count("| Skill | Score |\n|---|---:|\n| Python | 4.8 |\n| SQL | 4.7 |") == 2


def test_critical_fact_failure_fails_case_even_when_noncritical_points_are_available():
    case = {
        "id": "QX",
        "name": "Critical assertion",
        "criteria": [
            {"id": "fact", "dimension": "factual_accuracy", "type": "contains_all",
             "values": ["ground truth"], "points": 10, "critical": True},
            {"id": "style", "dimension": "readability", "type": "contains_any",
             "values": ["nice"], "points": 90, "critical": False},
        ],
    }
    result = benchmark.evaluate_case(case, 200, "nice response")
    assert result["score"] == 90
    assert result["status"] == "FAIL"
    assert result["critical_failures"] == ["fact"]


def test_non_success_http_fails_closed():
    case = {"id": "QX", "name": "HTTP", "criteria": [
        {"id": "ok", "type": "contains_all", "values": ["30"], "points": 100, "critical": True}
    ]}
    result = benchmark.evaluate_case(case, 503, "30")
    assert result["status"] == "FAIL"
    assert result["score"] == 0


def test_skill_comparison_reference_case_scores_full_marks():
    _, cases = benchmark.load_cases({"Q04"})
    response = (
        "| Skill | Demand | Frequency |\n|---|---:|---:|\n"
        "| Python | 4.58 | 2910 |\n| SQL | 4.73 | 2480 |"
    )
    result = benchmark.evaluate_case(cases[0], 200, response)
    assert result["score"] == 100
    assert result["status"] == "PASS"


def test_multi_objective_case_requires_both_objectives_and_five_ranked_items():
    _, cases = benchmark.load_cases({"Q08"})
    complete = (
        "تعداد فارغ‌التحصیلان: ۳۰\n"
        "رتبه‌بندی شکاف مهارتی:\n"
        "1. Python\n2. SQL\n3. Java\n4. Docker\n5. Kubernetes"
    )
    incomplete = "تعداد فارغ‌التحصیلان: ۳۰\nشکاف مهارتی: Python و SQL"
    assert benchmark.evaluate_case(cases[0], 200, complete)["status"] == "PASS"
    assert benchmark.evaluate_case(cases[0], 200, incomplete)["status"] == "FAIL"

def test_entity_numeric_pairs_reject_values_assigned_to_the_wrong_skill():
    criterion = {
        "id": "skill_metrics",
        "type": "entity_numeric_pairs",
        "pairs": [
            {"entity": "Python", "values": [4.58, 2910]},
            {"entity": "SQL", "values": [4.73, 2480]},
        ],
        "tolerance": 0.000001,
        "points": 100,
        "critical": True,
    }
    correct = "| Python | 4.58 | 2910 |\\n| SQL | 4.73 | 2480 |"
    swapped = "| Python | 4.73 | 2480 |\\n| SQL | 4.58 | 2910 |"
    assert benchmark.evaluate_criterion(criterion, correct)["status"] == "PASS"
    assert benchmark.evaluate_criterion(criterion, swapped)["status"] == "FAIL"


def test_global_execution_error_marker_fails_every_benchmark_case():
    case = {
        "id": "QX",
        "name": "Global error guard",
        "criteria": [
            {"id": "content", "type": "contains_all", "values": ["30"],
             "points": 100, "critical": False},
        ],
    }
    result = benchmark.evaluate_case(case, 200, "30\\nExecution status: partial_failure")
    assert result["status"] == "FAIL"
    assert "global_execution_error_guard" in result["critical_failures"]
