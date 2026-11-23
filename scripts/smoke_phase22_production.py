"""Run read-only Production chat regressions through the Persian UI backend."""
import argparse
import json
import re
from urllib.error import URLError
from urllib.request import ProxyHandler, Request, build_opener

CASES = {
    "catalog": "فهرست دروس کاتالوگ",
    "vhdl": "کدام درس‌ها VHDL آموزش می‌دهند؟",
    "python": "تقاضای پایتون در JobVision و پوشش آن در Purdue را مقایسه کن.",
    "employment": "وضعیت اشتغال فارغ‌التحصیلان مهندسی کامپیوتر Purdue در مه ۲۰۱۴",
}


def verify(case, response):
    evidence = response["evidence"]
    trace = evidence["trace_id"]
    if not isinstance(trace, str) or not re.fullmatch(r"nx-\d+", trace):
        raise ValueError("Missing n8n execution trace")
    if evidence["successful_results"] != 1 or evidence["failed_results"] != 0:
        error = evidence.get("error")
        code = error.get("code") if isinstance(error, dict) else None
        raise ValueError(
            f"{trace}: expected successful=1 and failed=0, "
            f"got successful={evidence['successful_results']!r}, "
            f"failed={evidence['failed_results']!r}, tool_error={code!r}"
        )
    if case == "catalog":
        rows = evidence["courses"]
        titles = response["answer"].splitlines()
        tehran = sum(row["program_id"] == "University-of-Tehran-CmPE-BS-user-image-undated-excerpt"
                     for row in rows)
        passed = (len(rows) == 184 and tehran == 36
                  and titles.count("زبان تخصصی کامپیوتر") == 1
                  and titles.count("برنامه‌سازی پیشرفته") == 1)
    elif case == "vhdl":
        passed = sorted(row["course_id"] for row in evidence["courses"]) == ["525.677.81", "ECE 2031"]
    elif case == "python":
        result = json.loads(response["answer"])["result"]
        market, education = result["market"], result["education"]
        metrics = (market["all_postings"], market["postings_with_recorded_skills"],
                   education["required_courses"], education["required_credits"])
        passed = [(item["numerator"], item["denominator"]) for item in metrics] == [
            (1745, 29587), (1745, 23528), (1, 15), (3, 41)]
    else:
        observed = evidence["published_employed_destination_share"]
        cohort = evidence["cohort_employed_destination_share"]
        passed = ((observed["numerator"], observed["denominator"]) == (46, 55)
                  and evidence["cohort_total"] == 59
                  and cohort["percent"] is None and cohort["status"] == "insufficient_evidence")
    if not passed:
        raise ValueError(f"{trace}: response differs from the accepted Phase 21 baseline")
    return trace


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8019)
    parser.add_argument("--case", choices=CASES, action="append")
    args = parser.parse_args()
    opener = build_opener(ProxyHandler({}))
    failures = 0
    for case in args.case or CASES:
        request = Request(
            f"http://127.0.0.1:{args.port}/api/chat",
            data=json.dumps({"question": CASES[case], "dataset_id": ""}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        try:
            with opener.open(request, timeout=450) as result:
                response = json.load(result)
            print(f"{case}: PASS {verify(case, response)}", flush=True)
        except (URLError, TimeoutError, ValueError, KeyError, TypeError) as exc:
            failures += 1
            print(f"{case}: FAIL {exc}", flush=True)
    return int(bool(failures))


if __name__ == "__main__":
    raise SystemExit(main())
