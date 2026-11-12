from __future__ import annotations

import importlib.util
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "run_agent_e2e.py"
SPEC = importlib.util.spec_from_file_location("run_agent_e2e", SCRIPT)
assert SPEC and SPEC.loader
runner = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(runner)


def test_suite_contains_exactly_a01_through_a18_in_order():
    assert [case["id"] for case in runner.CASES] == [f"A{i:02d}" for i in range(1, 19)]


def test_suite_uses_unique_session_per_chat_request(monkeypatch):
    captured = []

    class FakeResponse:
        status = 200

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def read(self):
            return b'{"output":"ok"}'

    def fake_urlopen(request, timeout):
        import json
        captured.append(json.loads(request.data.decode("utf-8")))
        return FakeResponse()

    monkeypatch.setattr(runner, "urlopen", fake_urlopen)
    case = runner.CASES[0]
    runner.post_chat("http://localhost/chat", case, 1)
    runner.post_chat("http://localhost/chat", case, 1)

    assert captured[0]["action"] == "sendMessage"
    assert captured[0]["chatInput"] == case["query"]
    assert captured[0]["sessionId"] != captured[1]["sessionId"]


def test_response_extraction_handles_chat_trigger_shapes():
    assert runner.extract_text('{"output":"hello"}') == "hello"
    assert runner.extract_text({"data": {"message": "hello"}}) == "hello"
    assert runner.extract_text([{"text": "one"}, {"text": "two"}]) == "one\ntwo"


def test_numeric_evaluator_normalizes_persian_digits_and_decimal_separator():
    case = {"kind": "scalar", "count": 30, "average": 6.93}
    verdict, _ = runner.evaluate(case, "تعداد: ۳۰ و میانگین: ۶٫۹۳", 200)
    assert verdict == "PASS"


def test_evaluator_rejects_non_success_http_and_empty_responses():
    case = {"kind": "count", "count": 30}
    assert runner.evaluate(case, "تعداد 30", 500)[0] == "FAIL"
    assert runner.evaluate(case, "", 200)[0] == "FAIL"


def test_partial_suite_can_never_be_reported_as_full_acceptance():
    # The CLI summary explicitly requires all 18 selected cases for an overall PASS.
    source = SCRIPT.read_text(encoding="utf-8")
    assert 'len(selected) == 18' in source
    assert '"overall": "PASS" if failed == 0 and len(selected) == 18 else "FAIL"' in source



def test_skill_demand_evaluator_accepts_localized_structured_metric_headers():
    case = {"kind": "skill_demand"}
    response = "| مهارت | میانگین امتیاز تقاضا | مجموع فراوانی |\\n|---|---:|---:|\\n| DevOps | 4.9 | 790 |"
    assert runner.evaluate(case, response, 200)[0] == "PASS"


def test_top_market_skill_evaluator_requires_demand_and_frequency_evidence():
    case = {"kind": "top_skills"}
    response = "| مهارت | میانگین امتیاز تقاضا | مجموع فراوانی |\\n|---|---:|---:|\\n| SQL | 4.73 | 2480 |"
    assert runner.evaluate(case, response, 200)[0] == "PASS"
    assert runner.evaluate(case, "| مهارت | توضیح |\\n|---|---|\\n| SQL | پرتقاضا |", 200)[0] == "FAIL"


def test_grouped_multi_metric_evaluator_requires_count_average_and_dimension():
    case = {"kind": "multi_metric"}
    response = "| حوزه شغلی | تعداد رکورد | میانگین مدت اشتغال |\\n|---|---:|---:|\\n| AI | 5 | 9.4 |"
    assert runner.evaluate(case, response, 200)[0] == "PASS"


def test_english_course_lookup_evaluator_accepts_only_english_evidence():
    case = {"kind": "course_en", "course_id": "C002", "course_name": "Data Structures"}
    assert runner.evaluate(case, "C002 — Data Structures", 200)[0] == "PASS"
    assert runner.evaluate(case, "C002 — Data Structures; ساختمان داده", 200)[0] == "FAIL"
