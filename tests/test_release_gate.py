from __future__ import annotations

import json
from types import SimpleNamespace

from scripts import release_gate


def test_release_gate_runs_syntax_and_pytest_by_default(monkeypatch, capsys):
    calls = []

    def fake_run(command, cwd, check):
        calls.append(command)
        return SimpleNamespace(returncode=0)

    monkeypatch.setattr(release_gate.subprocess, "run", fake_run)
    assert release_gate.main([]) == 0
    assert len(calls) == 1
    assert calls[0][1:4] == ["-m", "pytest", "-q"]

    output = capsys.readouterr().out
    report = json.loads(output.split("RELEASE_GATE_RESULT=\n", 1)[1])
    assert report["overall"] == "PASS"
    assert report["runtime_preflight"]["status"] == "NOT_RUN"
    assert report["live_concurrency"]["status"] == "NOT_RUN"


def test_release_gate_runs_preflight_when_requested(monkeypatch, capsys):
    calls = []

    def fake_run(command, cwd, check):
        calls.append(command)
        return SimpleNamespace(returncode=0)

    monkeypatch.setattr(release_gate.subprocess, "run", fake_run)
    assert release_gate.main(["--with-runtime-preflight"]) == 0
    assert len(calls) == 2
    assert calls[1][-1] == "scripts/runtime_preflight.py"

    output = capsys.readouterr().out
    report = json.loads(output.split("RELEASE_GATE_RESULT=\n", 1)[1])
    assert report["runtime_preflight"]["status"] == "PASS"
    assert report["live_concurrency"]["status"] == "NOT_RUN"


def test_live_concurrency_option_requires_preflight_and_runs_live_suite(monkeypatch, capsys):
    calls = []

    def fake_run(command, cwd, check):
        calls.append(command)
        return SimpleNamespace(returncode=0)

    monkeypatch.setattr(release_gate.subprocess, "run", fake_run)
    assert release_gate.main(["--with-live-concurrency"]) == 0
    assert len(calls) == 3
    assert calls[1][-1] == "scripts/runtime_preflight.py"
    assert calls[2][-1] == "scripts/live_concurrency_acceptance.py"

    output = capsys.readouterr().out
    report = json.loads(output.split("RELEASE_GATE_RESULT=\n", 1)[1])
    assert report["runtime_preflight"]["status"] == "PASS"
    assert report["live_concurrency"]["status"] == "PASS"


def test_release_gate_fails_when_any_required_step_fails(monkeypatch):
    monkeypatch.setattr(
        release_gate.subprocess, "run",
        lambda command, cwd, check: SimpleNamespace(returncode=1),
    )
    assert release_gate.main([]) == 1


def test_live_concurrency_is_blocked_when_runtime_preflight_fails(monkeypatch, capsys):
    calls = []

    def fake_run(command, cwd, check):
        calls.append(command)
        return SimpleNamespace(returncode=1 if command[-1] == "scripts/runtime_preflight.py" else 0)

    monkeypatch.setattr(release_gate.subprocess, "run", fake_run)
    assert release_gate.main(["--with-live-concurrency"]) == 1
    assert len(calls) == 2
    assert calls[1][-1] == "scripts/runtime_preflight.py"

    output = capsys.readouterr().out
    report = json.loads(output.split("RELEASE_GATE_RESULT=\n", 1)[1])
    assert report["runtime_preflight"]["status"] == "FAIL"
    assert report["live_concurrency"]["status"] == "BLOCKED"


def test_live_concurrency_is_blocked_when_automated_tests_fail(monkeypatch, capsys):
    calls = []

    def fake_run(command, cwd, check):
        calls.append(command)
        return SimpleNamespace(returncode=1 if command[-1] == "tests" else 0)

    monkeypatch.setattr(release_gate.subprocess, "run", fake_run)
    assert release_gate.main(["--with-live-concurrency"]) == 1
    assert len(calls) == 2
    assert calls[1][-1] == "scripts/runtime_preflight.py"

    output = capsys.readouterr().out
    report = json.loads(output.split("RELEASE_GATE_RESULT=\n", 1)[1])
    assert report["pytest"]["status"] == "FAIL"
    assert report["runtime_preflight"]["status"] == "PASS"
    assert report["live_concurrency"]["status"] == "BLOCKED"


def test_syntax_gate_accepts_utf8_bom_and_rejects_invalid_python(tmp_path, monkeypatch):
    (tmp_path / "bom_valid.py").write_bytes(
        b"\xef\xbb\xbf" + b"value = 42\n"
    )
    (tmp_path / "invalid.py").write_text(
        "def broken(:\n    pass\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(release_gate, "PROJECT_ROOT", tmp_path)

    report = release_gate.run_syntax_gate()

    assert report["python_files_checked"] == 2
    assert report["status"] == "FAIL"
    assert [failure["path"] for failure in report["failures"]] == ["invalid.py"]
    assert report["failures"][0]["error"].startswith("SyntaxError:")


def test_release_gate_documents_one_live_main_workflow_acceptance_path(monkeypatch, capsys):
    monkeypatch.setattr(
        release_gate.subprocess, "run",
        lambda command, cwd, check: SimpleNamespace(returncode=0),
    )
    assert release_gate.main([]) == 0
    output = capsys.readouterr().out
    report = json.loads(output.split("RELEASE_GATE_RESULT=\n", 1)[1])
    gates = report["manual_gates"]
    assert any("Full-System E2E Acceptance Suite (A01-A13)" in gate for gate in gates)
    assert any("diagnostic artifact" in gate for gate in gates)
    assert not any("Run the n8n MCP Runtime Test Suite" in gate for gate in gates)
