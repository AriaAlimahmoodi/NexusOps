from __future__ import annotations

import argparse
import json
import re
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW_PATH = ROOT / "workflows" / "nexusops-agentic-workflow.json"

CASES: list[dict[str, Any]] = [
    {"id": "A01", "name": "Graduate count", "query": "فقط عدد: تعداد کل فارغ‌التحصیلان دانشگاه چند نفر است؟", "kind": "count", "count": 30},
    {"id": "A02", "name": "Course C002 lookup (Persian)", "query": "نام درس با شناسه C002 چیست؟", "kind": "course_fa", "course_id": "C002", "course_name": "ساختمان داده"},
    {"id": "A03", "name": "Independent multi-plan analysis", "query": "تعداد کل فارغ‌التحصیلان دانشگاه را گزارش کن و به‌صورت مستقل پنج مهارت با بیشترین شکاف مهارتی بازار را نیز رتبه‌بندی کن.", "kind": "multi_plan", "count": 30},
    {"id": "A04", "name": "Out-of-domain rejection", "query": "قیمت روز بیت‌کوین چقدر است؟", "kind": "out_of_scope"},
    {"id": "A05", "name": "Scalar count and employment average", "query": "تعداد فارغ التحصیلان و میانگین مدت اشتغال را محاسبه کن", "kind": "scalar", "count": 30, "average": 6.93},
    {"id": "A06", "name": "University-market skill demand", "query": "تحلیل تقاضای مهارت‌های بازار کار را ارائه کن.", "kind": "skill_demand"},
    {"id": "A07", "name": "Top skill gaps", "query": "پنج مهارت با بیشترین شکاف مهارتی بازار را رتبه‌بندی کن.", "kind": "skill_gap"},
    {"id": "A08", "name": "Course-level gap ranking", "query": "بیشترین شکاف مهارتی در کدام درس‌ها مشاهده می‌شود؟", "kind": "course_gap", "course_id": "C013", "course_name": "رایانش ابری"},
    {"id": "A09", "name": "English lookup and response language", "query": "What is the name of course C002?", "kind": "course_en", "course_id": "C002", "course_name": "Data Structures"},
    {"id": "A10", "name": "Nested AND/OR graduate filter", "query": "تعداد فارغ‌التحصیلانی را محاسبه کن که حوزه شغلی آن‌ها AI یا Data است و ارتباط شغل با رشته حداقل 4.5 است.", "kind": "nested_filter"},
    {"id": "A11", "name": "Grouped multi-metric analytics", "query": "برای هر حوزه شغلی، تعداد فارغ‌التحصیلان و میانگین مدت اشتغال را در یک جدول گزارش کن.", "kind": "multi_metric"},
    {"id": "A12", "name": "Named skill details", "query": "تقاضا و فراوانی مهارت‌های Python و SQL را مقایسه کن.", "kind": "skill_details"},
    {"id": "A13", "name": "University-market management report", "query": "یک گزارش مدیریتی از وضعیت دانشگاه و بازار کار همراه با پیشنهادهای اجرایی تهیه کن.", "kind": "management"},
    {"id": "A14", "name": "Top market skills", "query": "پنج مهارت با بیشترین تقاضای بازار کار را رتبه‌بندی کن.", "kind": "top_skills"},
    {"id": "A15", "name": "Course C013 effectiveness", "query": "اثربخشی درس C013 را بر اساس داده‌های موجود تحلیل کن.", "kind": "course_effectiveness", "course_id": "C013", "course_name": "رایانش ابری"},
    {"id": "A16", "name": "Major employment comparison", "query": "وضعیت اشتغال مهندسی کامپیوتر را با سایر رشته‌های موجود در داده‌ها مقایسه کن.", "kind": "major_comparison"},
    {"id": "A17", "name": "Curriculum recommendations", "query": "برای بهبود برنامه درسی مهندسی کامپیوتر بر اساس شکاف مهارتی بازار پیشنهادهای اجرایی ارائه کن.", "kind": "curriculum"},
    {"id": "A18", "name": "Skill trends and temporal limitation", "query": "روند زمانی تقاضای مهارت‌های بازار را تحلیل کن و محدودیت داده‌های زمانی را توضیح بده.", "kind": "trends"},
]

ERROR_MARKERS = re.compile(r"\b(error|exception|traceback|partial_failure)\b|خطای اجرایی|خطا در اجرای|درخواست نامعتبر", re.I)


def find_webhook_id() -> str:
    workflow = json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))
    matches = [
        node for node in workflow.get("nodes", [])
        if node.get("type") == "@n8n/n8n-nodes-langchain.chatTrigger"
        and node.get("name") == "When chat message received"
    ]
    if len(matches) != 1:
        raise RuntimeError("Expected exactly one production Chat Trigger in nexusops-agentic-workflow.json")
    webhook_id = matches[0].get("webhookId")
    if not webhook_id:
        raise RuntimeError("Production Chat Trigger has no webhookId")
    return str(webhook_id)


def extract_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return ""
        try:
            return extract_text(json.loads(stripped))
        except json.JSONDecodeError:
            return stripped
    if isinstance(value, (int, float, bool)):
        return str(value)
    if isinstance(value, list):
        return "\n".join(filter(None, (extract_text(item) for item in value)))
    if isinstance(value, dict):
        for key in ("output", "text", "message", "response", "answer"):
            candidate = value.get(key)
            if isinstance(candidate, (str, dict, list)):
                result = extract_text(candidate)
                if result:
                    return result
        for key in ("data", "body", "result"):
            if key in value:
                result = extract_text(value[key])
                if result:
                    return result
        return json.dumps(value, ensure_ascii=False)
    return str(value)


def normalize_digits(text: str) -> str:
    fa = "۰۱۲۳۴۵۶۷۸۹"
    ar = "٠١٢٣٤٥٦٧٨٩"
    text = text.translate(str.maketrans(fa, "0123456789"))
    text = text.translate(str.maketrans(ar, "0123456789"))
    return text.replace("٫", ".").replace("٬", ",")


def has_number(text: str, expected: float) -> bool:
    normalized = normalize_digits(text).replace(",", ".")
    return any(float(token) == float(expected) for token in re.findall(r"(?<!\w)-?\d+(?:\.\d+)?", normalized))


def evaluate(case: dict[str, Any], response_text: str, http_status: int) -> tuple[str, str]:
    text = response_text.strip()
    if not 200 <= http_status < 300:
        return "FAIL", f"HTTP {http_status}: {text[:500]}"
    if not text:
        return "FAIL", "Chat Trigger returned an empty response."
    if ERROR_MARKERS.search(text):
        return "FAIL", f"Response contains an execution/error marker: {text[:700]}"

    kind = case["kind"]
    passed = False
    reason = ""

    if kind == "count":
        passed = has_number(text, case["count"])
        reason = "Expected graduate count 30 is present." if passed else "Expected count 30 was not found."
    elif kind == "course_fa":
        passed = case["course_id"] in text and case["course_name"] in text
        reason = "C002 and its Persian course name are present." if passed else "C002 / ساختمان داده were not both found."
    elif kind == "multi_plan":
        passed = has_number(text, case["count"]) and ("شکاف" in text and "مهارت" in text)
        reason = "Count and skill-gap result are both represented." if passed else "Could not verify both independent objectives."
    elif kind == "out_of_scope":
        passed = any(term in text.lower() for term in ("دانشگاه", "بازار کار", "university", "labor market")) and not re.search(r"₿|btc|bitcoin.*\d", text, re.I)
        reason = "Response appears to keep the request within the supported university/labor-market domain." if passed else "Domain-gate rejection could not be verified from the response."
    elif kind == "scalar":
        passed = has_number(text, case["count"]) and has_number(text, case["average"])
        reason = "Both expected values (30 and 6.93) are present." if passed else "Expected count 30 and average 6.93 were not both found."
    elif kind == "skill_demand":
        passed = "مهارت" in text and "تقاضا" in text
        reason = "Skill-demand discussion is present." if passed else "Skill-demand evidence was not found."
    elif kind == "skill_gap":
        passed = "شکاف" in text and "مهارت" in text
        reason = "Skill-gap ranking discussion is present." if passed else "Skill-gap evidence was not found."
    elif kind == "course_gap":
        passed = case["course_id"] in text and case["course_name"] in text
        reason = "C013 / رایانش ابری appear in the course-gap result." if passed else "Expected C013 course-gap evidence was not found."
    elif kind == "course_en":
        passed = case["course_id"] in text and case["course_name"].lower() in text.lower() and not re.search(r"[\u0600-\u06ff]", text)
        reason = "English response contains C002 and Data Structures." if passed else "Expected English-only C002 response was not found."
    elif kind == "nested_filter":
        passed = bool(re.search(r"\d", normalize_digits(text))) and any(term in text for term in ("تعداد", "رکورد", "فارغ‌التحصیل"))
        reason = "A numeric filtered result is present." if passed else "Numeric count evidence was not found."
    elif kind == "multi_metric":
        passed = bool(re.search(r"\d", normalize_digits(text))) and "میانگین" in text and ("حوزه" in text or "شغلی" in text)
        reason = "Grouped output includes a numeric average and job-field dimension." if passed else "Grouped multi-metric evidence was not found."
    elif kind == "skill_details":
        passed = "Python" in text and "SQL" in text and "تقاضا" in text and "فراوانی" in text
        reason = "Python and SQL demand/frequency details are present." if passed else "Expected named-skill demand/frequency details were not found."
    elif kind == "management":
        passed = "دانشگاه" in text and "بازار" in text and ("پیشنهاد" in text or "توصیه" in text)
        reason = "Management report includes university, market, and recommendations." if passed else "Expected management-report elements were not found."
    elif kind == "top_skills":
        passed = "مهارت" in text and "تقاضا" in text
        reason = "Top market-skill demand content is present." if passed else "Top-skill demand evidence was not found."
    elif kind == "course_effectiveness":
        passed = case["course_id"] in text and case["course_name"] in text and ("اثربخشی" in text or "تحلیل" in text)
        reason = "C013 course-effectiveness analysis is present." if passed else "Expected C013 effectiveness evidence was not found."
    elif kind == "major_comparison":
        passed = "مهندسی کامپیوتر" in text and ("مقایسه" in text or "سایر رشته" in text) and ("اشتغال" in text or "فارغ‌التحصیل" in text)
        reason = "Major comparison includes employment context." if passed else "Expected major-comparison evidence was not found."
    elif kind == "curriculum":
        passed = "برنامه درسی" in text and ("پیشنهاد" in text or "توصیه" in text)
        reason = "Curriculum recommendations are present." if passed else "Expected curriculum recommendations were not found."
    elif kind == "trends":
        passed = "روند" in text and ("زمان" in text or "محدودیت" in text)
        reason = "Trend discussion explicitly addresses temporal data/limitations." if passed else "Expected trend and temporal-limitation discussion was not found."

    return ("PASS" if passed else "FAIL"), reason + ("" if passed else f" Response: {text[:700]}")


def post_chat(url: str, case: dict[str, Any], timeout: float) -> tuple[int, str]:
    session_id = f"nexusops-e2e-{uuid.uuid4()}"
    payload = {
        "action": "sendMessage",
        "sessionId": session_id,
        "chatInput": case["query"],
    }
    request = Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8", errors="replace")
            return response.status, extract_text(raw)
    except HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        return exc.code, extract_text(raw)
    except (URLError, TimeoutError, OSError) as exc:
        return 0, f"{type(exc).__name__}: {exc}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Run NexusOps A01-A18 against the production n8n Chat Trigger.")
    parser.add_argument("--base-url", default="http://127.0.0.1:5678", help="n8n base URL (default: http://127.0.0.1:5678)")
    parser.add_argument("--webhook-url", help="Override the full Chat Trigger webhook URL.")
    parser.add_argument("--timeout", type=float, default=300, help="Per-case timeout in seconds (default: 300).")
    parser.add_argument("--pause-seconds", type=float, default=1, help="Delay between requests (default: 1).")
    parser.add_argument("--report", default="reports/agent-e2e-latest.json", help="JSON report path.")
    parser.add_argument("--start-at", choices=[case["id"] for case in CASES], help="Start from a case ID, e.g. A09.")
    args = parser.parse_args()

    if args.timeout <= 0 or args.pause_seconds < 0:
        parser.error("--timeout must be positive and --pause-seconds cannot be negative.")

    try:
        webhook_url = args.webhook_url or f"{args.base_url.rstrip('/')}/webhook/{find_webhook_id()}/chat"
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as exc:
        print(f"SETUP FAIL: {exc}", file=sys.stderr)
        return 2

    selected = CASES
    if args.start_at:
        start = next(i for i, case in enumerate(CASES) if case["id"] == args.start_at)
        selected = CASES[start:]

    print("NexusOps Full-System E2E — A01 through A18")
    print(f"Target: {webhook_url}")
    print(f"Cases: {len(selected)} | per-case timeout: {args.timeout:.0f}s | sequential sessions")
    print("-" * 76)

    results = []
    for index, case in enumerate(selected):
        started = time.monotonic()
        try:
            status, text = post_chat(webhook_url, case, args.timeout)
            verdict, detail = evaluate(case, text, status)
        except Exception as exc:  # keep the suite running and preserve the failure
            status, text = 0, ""
            verdict, detail = "FAIL", f"{type(exc).__name__}: {exc}"
        elapsed = round(time.monotonic() - started, 2)
        result = {
            "test_id": case["id"],
            "name": case["name"],
            "status": verdict,
            "http_status": status or None,
            "duration_seconds": elapsed,
            "query": case["query"],
            "response": text[:12000],
            "detail": detail,
        }
        results.append(result)
        print(f"{case['id']}  {verdict:<4}  {elapsed:>7.2f}s  {case['name']}")
        if verdict == "FAIL":
            print(f"     {detail[:500]}")
        if index < len(selected) - 1 and args.pause_seconds:
            time.sleep(args.pause_seconds)

    passed = sum(item["status"] == "PASS" for item in results)
    failed = len(results) - passed
    report = {
        "suite": "NexusOps Full-System E2E A01-A18",
        "target": webhook_url,
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "summary": {"total": len(results), "passed": passed, "failed": failed, "overall": "PASS" if failed == 0 and len(selected) == 18 else "FAIL"},
        "results": results,
        "limitations": [
            "Assertions are response-contract checks; inspect saved response text for semantic correctness.",
            "This suite exercises serial independent Chat Trigger sessions; it does not test concurrent requests.",
            "It does not replace independent Kibana comparisons for numeric results.",
            "A partial run (--start-at) is never reported as an overall full-suite PASS.",
        ],
    }

    report_path = ROOT / args.report
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print("-" * 76)
    print(f"SUMMARY: {passed}/{len(results)} PASS | {failed} FAIL | OVERALL {report['summary']['overall']}")
    print(f"Report: {report_path}")
    return 0 if report["summary"]["overall"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
