from __future__ import annotations

import argparse
import ast
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_DIRECTORIES = {
    ".git", ".venv", "venv", "node_modules", "__pycache__",
    "build", "dist", "n8n-local",
}


def discover_python_sources() -> list[Path]:
    return sorted(
        path for path in PROJECT_ROOT.rglob("*.py")
        if not EXCLUDED_DIRECTORIES.intersection(path.parts)
    )


def run_syntax_gate() -> dict[str, Any]:
    sources = discover_python_sources()
    failures = []
    for path in sources:
        try:
            # utf-8-sig accepts ordinary UTF-8 and safely strips an optional BOM.
            source = path.read_text(encoding="utf-8-sig")
            ast.parse(source, filename=str(path))
        except (OSError, UnicodeError, SyntaxError) as exc:
            failures.append({
                "path": str(path.relative_to(PROJECT_ROOT)),
                "error": f"{type(exc).__name__}: {exc}",
            })
    return {
        "status": "PASS" if not failures else "FAIL",
        "python_files_checked": len(sources),
        "failures": failures,
    }


def run_command(label: str, command: list[str]) -> dict[str, Any]:
    print(f"\n[{label}] {' '.join(command)}", flush=True)
    completed = subprocess.run(command, cwd=PROJECT_ROOT, check=False)
    return {
        "status": "PASS" if completed.returncode == 0 else "FAIL",
        "return_code": completed.returncode,
        "command": command,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run NexusOps static, automated, and optional live release gates.")
    parser.add_argument("--with-runtime-preflight", action="store_true",
                        help="Verify Elasticsearch, Ollama, MCP, and n8n readiness.")
    parser.add_argument("--with-live-concurrency", action="store_true",
                        help="Run live concurrent Chat Trigger acceptance; also runs preflight.")
    args = parser.parse_args(argv)

    print("[1/3] Parsing Python source tree...", flush=True)
    syntax = run_syntax_gate()
    print(f"Python syntax: {syntax['status']} ({syntax['python_files_checked']} files)", flush=True)

    print("\n[2/3] Running complete pytest suite...", flush=True)
    tests = run_command("PYTEST", [sys.executable, "-m", "pytest", "-q", "tests"])

    preflight: dict[str, Any] = {"status": "NOT_RUN"}
    concurrency: dict[str, Any] = {"status": "NOT_RUN"}

    if args.with_runtime_preflight or args.with_live_concurrency:
        print("\n[3/3] Running live service readiness preflight...", flush=True)
        preflight = run_command("RUNTIME_PREFLIGHT", [sys.executable, "scripts/runtime_preflight.py"])

    if args.with_live_concurrency:
        if (
            syntax["status"] == "PASS"
            and tests["status"] == "PASS"
            and preflight["status"] == "PASS"
        ):
            print("\n[LIVE_CONCURRENCY] Running real concurrent Chat Trigger calls...", flush=True)
            concurrency = run_command("LIVE_CONCURRENCY", [sys.executable, "scripts/live_concurrency_acceptance.py"])
        else:
            concurrency = {
                "status": "BLOCKED",
                "reason": (
                    "Live concurrency requires syntax, pytest, and runtime preflight "
                    "to pass first."
                ),
            }

    required = [syntax["status"], tests["status"]]
    if args.with_runtime_preflight or args.with_live_concurrency:
        required.append(preflight["status"])
    if args.with_live_concurrency:
        required.append(concurrency["status"])
    passed = all(status == "PASS" for status in required)

    report = {
        "suite": "NexusOps Release Gate",
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "overall": "PASS" if passed else "FAIL",
        "syntax": syntax,
        "pytest": tests,
        "runtime_preflight": preflight,
        "live_concurrency": concurrency,
        "manual_gates": [
            "Run the active n8n Full-System E2E Acceptance Suite (A01-A18) against the main Ollama-backed Chat Trigger workflow.",
            "Do not run the standalone MCP Runtime Test Suite as a separate live acceptance path; retain it only as an opt-in diagnostic artifact.",
            "Compare live numerical outputs with independent Kibana Dev Tools queries (A/B/C/E).",
            "Review concurrent Chat Trigger results as cross-session smoke evidence only; do not infer same-session ordering.",
            "Record actual runtime results; preflight and pytest do not replace live workflow acceptance.",
        ],
    }
    print("\nRELEASE_GATE_RESULT=")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
