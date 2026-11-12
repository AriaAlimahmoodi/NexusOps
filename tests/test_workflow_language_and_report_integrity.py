"""Regression checks for the n8n workflow's language and evidence contract.

These tests validate the exported workflow artifact without requiring a running n8n
instance or external LLM credentials. Runtime behavior still needs an n8n execution.
"""
import json
from pathlib import Path
import unittest


WORKFLOW_PATH = (
    Path(__file__).resolve().parents[1]
    / "workflows"
    / "nexusops-agentic-workflow.json"
)


class WorkflowLanguageAndEvidenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        workflow = json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))
        cls.nodes = {node["name"]: node for node in workflow["nodes"]}

    def test_required_nodes_exist(self):
        for name in (
            "Prepare LLM Context",
            "Format Result",
            "Answer Writer",
            "Compose Final",
        ):
            with self.subTest(node=name):
                self.assertIn(name, self.nodes)

    def test_language_is_detected_before_llm_and_passed_to_writer(self):
        context_code = self.nodes["Prepare LLM Context"]["parameters"]["jsCode"]
        prompt = self.nodes["Answer Writer"]["parameters"]["text"]
        self.assertIn('const responseLanguage = persianCount > latinCount ? "fa" : "en";', context_code)
        self.assertIn("responseLanguage", context_code)
        self.assertIn("{{ $json.responseLanguage }}", prompt)
        self.assertIn("زبان پاسخ از فیلد ساختاریافته", prompt)
        self.assertIn("The answer language", prompt) if "The answer language" in prompt else None

    def test_answer_writer_has_numeric_evidence_guardrails(self):
        prompt = self.nodes["Answer Writer"]["parameters"]["text"]
        required_rules = (
            "اعتبارسنجی عددی و جلوگیری از تناقض",
            "ranking_unit=skill",
            "ranking_unit=course",
            "document_count برابر 1",
            "ردیف‌های ساختاریافته",
        )
        for rule in required_rules:
            with self.subTest(rule=rule):
                self.assertIn(rule, prompt)

    def test_result_tables_localize_common_headers_for_persian(self):
        code = self.nodes["Format Result"]["parameters"]["jsCode"]
        self.assertIn("PERSIAN_COLUMN_LABELS", code)
        self.assertIn('شناسه درس', code)
        self.assertIn("displayColumnName(column)", code)

    def test_final_composer_localizes_diagnostics(self):
        code = self.nodes["Compose Final"]["parameters"]["jsCode"]
        self.assertIn('warning.push(fa?', code)
        self.assertIn('fa?"تحلیل متنی تولید نشد."', code)
        self.assertIn("The analysis plan set is incomplete", code)


if __name__ == "__main__":
    unittest.main()
