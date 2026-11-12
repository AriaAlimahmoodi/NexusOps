from __future__ import annotations

import asyncio
import json
import os
import re
import sys
import time
import uuid
from pathlib import Path
from typing import Any

import httpx

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

AGENT_WORKFLOW_PATH = PROJECT_ROOT / "workflows" / "nexusops-agentic-workflow.json"


def build_cases(run_token: str) -> list[dict[str, str]]:
    """Build independent conversations covering English and Persian paths."""
    return [
        {
            "test_id": "C01",
            "kind": "numeric_count",
            "expected_language": "en",
            "session_id": f"nexusops-concurrency-{run_token}-C01",
            "chat_input": "Only the number: How many total university graduates are in the dataset?",
        },
        {
            "test_id": "C02",
            "kind": "course_lookup",
            "expected_language": "fa",
            "session_id": f"nexusops-concurrency-{run_token}-C02",
            "chat_input": "نام درس با شناسه C002 چیست؟",
        },
        {
            "test_id": "C03",
            "kind": "skill_gap",
            "expected_language": "fa",
            "session_id": f"nexusops-concurrency-{run_token}-C03",
            "chat_input": "پنج مهارت با بیشترین شکاف مهارتی بازار را رتبه‌بندی کن.",
        },
    ]


def normalize_digits(value: Any) -> str:
    text = str(value or "")
    text = text.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789"))
    return text.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789"))


def extract_response_text(value: Any) -> str:
    if isinstance(value, str):
        stripped = value.strip()
        if stripped:
            try:
                return extract_response_text(json.loads(stripped))
            except json.JSONDecodeError:
                return stripped
        return ""
    if isinstance(value, list):
        return "\n".join(extract_response_text(item) for item in value)
    if isinstance(value, dict):
        for key in ("output", "text", "message", "answer"):
            if isinstance(value.get(key), str):
                return value[key]
        if "data" in value:
            return extract_response_text(value["data"])
        return json.dumps(value, ensure_ascii=False, default=str)
    return "" if value is None else str(value)


def _language_matches(text: str, expected: str) -> bool:
    persian = len(re.findall(r"[\u0600-\u06FF]", text))
    latin = len(re.findall(r"[A-Za-z]", text))
    if expected == "fa":
        return persian > 0
    if expected == "en":
        return persian == 0 and (latin > 0 or bool(re.search(r"(?<!\d)\d+(?!\d)", text)))
    return False


def _ranked_entry_count(text: str) -> int:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    numbered = [
        line for line in lines
        if re.match(r"^(?:[-*]\s*)?\d{1,2}[.)]\s+\S", line)
    ]
    bullets = [
        line for line in lines
        if re.match(r"^[-*]\s+\S", line)
    ]
    table_rows = [
        line for line in lines
        if line.startswith("|")
        and line.count("|") >= 3
        and not re.search(r"^\|\s*:?-{2,}", line)
        and not re.search(r"\b(skill|مهارت|rank|رتبه)\b", line, re.I)
    ]
    return max(len(numbered), len(bullets), len(table_rows))


def evaluate_response(
    case: dict[str, str],
    status_code: int,
    response_body: Any,
) -> dict[str, Any]:
    text = extract_response_text(response_body)
    normalized = normalize_digits(text)
    passed = False
    detail = ""

    if not 200 <= status_code < 300:
        detail = f"Chat Trigger returned HTTP {status_code}: {text[:400]}"
    elif not text.strip():
        detail = "Chat Trigger returned an empty response."
    elif re.search(
        r"partial_failure|incomplete|unknown response structure|integrity_failure",
        text,
        re.I,
    ):
        detail = "Response contains an incomplete-execution or integrity warning."
    elif not _language_matches(text, case.get("expected_language", "")):
        detail = f"Response language does not match expected language {case.get('expected_language')}."
    elif case["kind"] == "numeric_count":
        passed = re.fullmatch(r"\s*(?:\*\*)?30(?:\*\*)?[.!]?\s*", normalized) is not None
        detail = (
            "The independent conversation returned only the exact graduate count 30."
            if passed else "Expected an isolated exact graduate count 30; a different value or unrelated content was returned."
        )
    elif case["kind"] == "course_lookup":
        passed = (
            "C002" in text
            and "ساختمان داده" in text
            and not re.search(r"شکاف مهارتی|market_gap|تعداد کل فارغ", text, re.I)
        )
        detail = (
            "The independent conversation returned course C002 and its Persian name without foreign-intent markers."
            if passed else "Expected isolated course identifier/name evidence was not found."
        )
    elif case["kind"] == "skill_gap":
        entry_count = _ranked_entry_count(normalized)
        passed = (
            ("شکاف" in text or "market_gap" in text.casefold())
            and entry_count >= 5
            and "C002" not in text
            and "ساختمان داده" not in text
        )
        detail = (
            f"The independent conversation returned a skill-gap ranking with {entry_count} visible entries."
            if passed else f"Expected a five-entry skill-gap ranking; detected {entry_count} entries."
        )

    return {
        "test_id": case["test_id"],
        "kind": case["kind"],
        "expected_language": case.get("expected_language"),
        "status": "PASS" if passed else "FAIL",
        "http_status": status_code,
        "detail": detail,
        "session_ref": case["session_id"][-3:],
        "response_excerpt": text[:500],
    }


def get_chat_webhook_id() -> str:
    workflow = json.loads(AGENT_WORKFLOW_PATH.read_text(encoding="utf-8"))
    matches = [
        node for node in workflow.get("nodes", [])
        if node.get("name") == "When chat message received"
    ]
    if len(matches) != 1:
        raise RuntimeError("Expected exactly one production Chat Trigger node.")
    webhook_id = matches[0].get("webhookId")
    if not isinstance(webhook_id, str) or not webhook_id.strip():
        raise RuntimeError("Production Chat Trigger webhookId is missing.")
    return webhook_id


async def invoke_case(
    client: httpx.AsyncClient,
    endpoint: str,
    case: dict[str, str],
) -> dict[str, Any]:
    body = {
        "action": "sendMessage",
        "sessionId": case["session_id"],
        "chatInput": case["chat_input"],
    }
    started = time.perf_counter()
    try:
        response = await client.post(endpoint, json=body)
        try:
            payload = response.json()
        except ValueError:
            payload = response.text
        result = evaluate_response(case, response.status_code, payload)
        result["duration_ms"] = round((time.perf_counter() - started) * 1000, 2)
        return result
    except Exception as exc:
        return {
            "test_id": case["test_id"],
            "kind": case["kind"],
            "expected_language": case.get("expected_language"),
            "status": "FAIL",
            "http_status": None,
            "detail": f"Request failed: {type(exc).__name__}: {str(exc)[:300]}",
            "session_ref": case["session_id"][-3:],
            "response_excerpt": "",
            "duration_ms": round((time.perf_counter() - started) * 1000, 2),
        }


async def run_acceptance() -> dict[str, Any]:
    base_url = os.getenv("N8N_BASE_URL", "http://127.0.0.1:5678").rstrip("/")
    endpoint = f"{base_url}/webhook/{get_chat_webhook_id()}/chat"
    cases = build_cases(uuid.uuid4().hex[:12])
    session_ids = [case["session_id"] for case in cases]
    if len(session_ids) != len(set(session_ids)):
        raise RuntimeError("Concurrent acceptance cases must use unique session IDs.")

    timeout = httpx.Timeout(180.0, connect=10.0)
    started = time.perf_counter()
    async with httpx.AsyncClient(timeout=timeout) as client:
        results = await asyncio.gather(
            *(invoke_case(client, endpoint, case) for case in cases)
        )

    passed = sum(item["status"] == "PASS" for item in results)
    failed = len(results) - passed
    return {
        "suite": "NexusOps Live Concurrent Conversation Acceptance",
        "overall": "PASS" if failed == 0 else "FAIL",
        "total": len(results),
        "passed": passed,
        "failed": failed,
        "duration_ms": round((time.perf_counter() - started) * 1000, 2),
        "results": results,
        "scope": (
            "Three independent production Chat Trigger executions are submitted "
            "concurrently with unique session IDs. The cases include an English "
            "graduate-count request and Persian course-lookup/skill-gap requests. "
            "Each response is checked for its expected language and intent-specific "
            "evidence. This is a cross-session isolation smoke test; Python-client "
            "same-conversation ordering is covered by pytest, but this harness does "
            "not claim n8n same-session ordering or full numerical parity with Kibana."
        ),
    }


def main() -> int:
    try:
        result = asyncio.run(run_acceptance())
    except Exception as exc:
        result = {
            "suite": "NexusOps Live Concurrent Conversation Acceptance",
            "overall": "FAIL",
            "error": f"{type(exc).__name__}: {str(exc)[:500]}",
        }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("overall") == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
