from __future__ import annotations

from scripts.live_concurrency_acceptance import build_cases, evaluate_response


def test_live_concurrency_cases_use_unique_sessions_and_cover_both_languages():
    cases = build_cases("run-token")

    assert len(cases) == 3
    assert len({case["session_id"] for case in cases}) == 3
    assert {case["expected_language"] for case in cases} == {"fa", "en"}
    assert [case["test_id"] for case in cases] == ["C01", "C02", "C03"]


def test_live_count_acceptance_requires_exact_value_and_expected_language():
    case = build_cases("run")[0]

    good = evaluate_response(case, 200, {"output": "30"})
    wrong_value = evaluate_response(case, 200, {"output": "130"})
    wrong_language = evaluate_response(
        case, 200, {"output": "تعداد کل فارغ‌التحصیلان ۳۰ نفر است"}
    )

    assert good["status"] == "PASS"
    assert wrong_value["status"] == "FAIL"
    assert wrong_language["status"] == "FAIL"


def test_live_course_lookup_acceptance_checks_identifier_name_and_language():
    case = build_cases("run")[1]

    good = evaluate_response(
        case, 200, {"output": "درس C002 با نام ساختمان داده ارائه شده است."}
    )
    missing_name = evaluate_response(case, 200, {"output": "شناسه درس C002 است."})
    wrong_language = evaluate_response(
        case, 200, {"output": "Course C002 is Data Structures."}
    )

    assert good["status"] == "PASS"
    assert missing_name["status"] == "FAIL"
    assert wrong_language["status"] == "FAIL"


def test_live_skill_gap_acceptance_requires_five_ranked_entries():
    case = build_cases("run")[2]
    five_entries = {
        "output": (
            "رتبه‌بندی پنج مهارت دارای بیشترین شکاف مهارتی:\\n"
            "1. مهارت الف: 4.5\\n"
            "2. مهارت ب: 4.2\\n"
            "3. مهارت پ: 3.9\\n"
            "4. مهارت ت: 3.7\\n"
            "5. مهارت ث: 3.4"
        )
    }
    too_few_entries = {
        "output": "بیشترین شکاف مهارتی:\\n1. مهارت الف: 4.5\\n2. مهارت ب: 4.2"
    }

    assert evaluate_response(case, 200, five_entries)["status"] == "PASS"
    assert evaluate_response(case, 200, too_few_entries)["status"] == "FAIL"


def test_live_acceptance_fails_closed_for_http_and_execution_integrity_errors():
    case = build_cases("run")[0]

    http_failure = evaluate_response(case, 503, {"output": "service unavailable"})
    incomplete = evaluate_response(
        case, 200, {"output": "30\\nExecution status: partial_failure"}
    )

    assert http_failure["status"] == "FAIL"
    assert incomplete["status"] == "FAIL"
