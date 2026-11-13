from __future__ import annotations

import json
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / "workflows" / "nexusops-agentic-workflow.json"
E2E_RUNNER = ROOT / "scripts" / "run_agent_e2e.py"
SERVER = ROOT / "server.py"
sys.path.insert(0, str(ROOT))
from runtime_logging import resolve_request_id


class Phase6WorkflowContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.workflow = json.loads(WORKFLOW.read_text(encoding="utf-8"))
        cls.e2e_source = E2E_RUNNER.read_text(encoding="utf-8")

    def test_production_workflow_identity_is_preserved(self) -> None:
        self.assertEqual(self.workflow.get("name"), "NexusOps-Agentic-Workflow")
        triggers = [
            node for node in self.workflow.get("nodes", [])
            if node.get("type") == "@n8n/n8n-nodes-langchain.chatTrigger"
            and node.get("name") == "When chat message received"
        ]
        self.assertEqual(len(triggers), 1)
        self.assertEqual(
            triggers[0].get("webhookId"),
            "bb04e460-7b14-4e42-aab0-a907c8d614c6",
        )

    def test_all_mcp_http_stages_have_bounded_network_retries(self) -> None:
        expected = {"MCP Initialize", "MCP Initialized Notify", "MCP Call Tool"}
        nodes = {
            node.get("name"): node
            for node in self.workflow.get("nodes", [])
            if node.get("name") in expected
        }
        self.assertEqual(set(nodes), expected)
        for name, node in nodes.items():
            with self.subTest(node=name):
                self.assertEqual(node.get("type"), "n8n-nodes-base.httpRequest")
                self.assertIs(node.get("retryOnFail"), True)
                self.assertEqual(node.get("maxTries"), 3)
                self.assertEqual(node.get("waitBetweenTries"), 1000)
                self.assertEqual(
                    node.get("parameters", {}).get("options", {}).get("timeout"),
                    "={{ 30000 }}" if name == "MCP Initialize" else 30000,
                )
                # Keep neverError enabled so HTTP status failures continue
                # through the existing explicit response-validation nodes.
                self.assertIs(
                    node["parameters"]["options"]["response"]["response"]["neverError"],
                    True,
                )

    def test_original_e2e_cases_are_retained_and_phase6_cases_are_additive(self) -> None:
        for case_id in (f"A{i:02d}" for i in range(1, 19)):
            self.assertIn(f'"id": "{case_id}"', self.e2e_source)
        for case_id in ("A19", "A20", "A21"):
            self.assertIn(f'"id": "{case_id}"', self.e2e_source)
        self.assertIn("A01-A21", self.e2e_source)


    def test_request_id_header_is_preserved_case_insensitively(self) -> None:
        self.assertEqual(
            resolve_request_id({"X-Request-ID": "nx-exec-123"}),
            "nx-exec-123",
        )
        self.assertEqual(
            resolve_request_id({"x-request-id": "trace.abc_123:xyz"}),
            "trace.abc_123:xyz",
        )

    def test_invalid_request_id_header_is_replaced_with_safe_generated_id(self) -> None:
        generated = resolve_request_id({"X-Request-ID": "bad value\\nforged"})
        self.assertRegex(generated, re.compile(r"^[0-9a-f]{32}$"))

    def test_trace_id_and_stage_timing_are_propagated_by_main_workflow(self) -> None:
        nodes = {node.get("name"): node for node in self.workflow.get("nodes", [])}
        prepare = nodes["Prepare Input"]["parameters"]["jsCode"]
        build = nodes["Build Tool Call"]["parameters"]["jsCode"]
        parse = nodes["MCP Parse Result"]["parameters"]["jsCode"]
        format_code = nodes["Format Result"]["parameters"]["jsCode"]
        compose = nodes["Compose Final"]["parameters"]["jsCode"]
        self.assertIn("$execution.id", prepare)
        self.assertIn("traceId", prepare)
        self.assertIn("toolCallStartedAt", build)
        self.assertIn("toolRoundTripMs", parse)
        self.assertIn("formatCompletedAt", format_code)
        self.assertIn("timingsMs", compose)
        self.assertIn("toolTimings", compose)

    def test_request_id_header_is_sent_on_all_mcp_http_requests(self) -> None:
        expected = {"MCP Initialize", "MCP Initialized Notify", "MCP Call Tool"}
        nodes = {
            node.get("name"): node
            for node in self.workflow.get("nodes", [])
            if node.get("name") in expected
        }
        self.assertEqual(set(nodes), expected)
        for name, node in nodes.items():
            with self.subTest(node=name):
                headers = node["parameters"]["headerParameters"]["parameters"]
                request_id_headers = [h for h in headers if h.get("name", "").lower() == "x-request-id"]
                self.assertEqual(len(request_id_headers), 1)

    def test_mcp_handlers_use_sdk_context_for_end_to_end_correlation(self) -> None:
        server_source = SERVER.read_text(encoding="utf-8")
        self.assertIn("from mcp.server.mcpserver.context import Context", server_source)
        self.assertIn("resolve_request_id(context.headers", server_source)
        self.assertIn("resolve_request_id(ctx.headers)", server_source)

    def test_runner_targets_the_main_workflow_file(self) -> None:
        self.assertIn(
            'WORKFLOW_PATH = ROOT / "workflows" / "nexusops-agentic-workflow.json"',
            self.e2e_source,
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
