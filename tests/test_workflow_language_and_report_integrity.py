"""Regression checks for language consistency and analytical evidence integrity."""

import json
from pathlib import Path
import unittest


WORKFLOW_PATH = Path(__file__).resolve().parents[1] / "workflows" / "nexusops-agentic-workflow.json"


class TestWorkflowLanguageAndEvidence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        workflow = json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))
        cls.nodes = {node["name"]: node for node in workflow["nodes"]}

    def test_language_is_detected_before_planning_and_not_reinferred_downstream(self):
        prepare = self.nodes["Prepare Input"]["parameters"]["jsCode"]
        context = self.nodes["Prepare LLM Context"]["parameters"]["jsCode"]
        prompt = self.nodes["Answer Writer"]["parameters"]["text"]
        self.assertIn("faLetters", prepare)
        self.assertIn("enLetters", prepare)
        self.assertIn('faLetters>=enLetters?"fa":"en"', prepare)
        self.assertIn("const responseLanguage = language;", context)
        self.assertIn("{{ $json.responseLanguage }}", prompt)
        self.assertIn("زبان را از متن سؤال به‌تنهایی دوباره حدس نزن", prompt)

    def test_answer_writer_has_numeric_and_scope_guardrails(self):
        prompt = self.nodes["Answer Writer"]["parameters"]["text"]
        for rule in (
            "اعتبارسنجی عددی و جلوگیری از تناقض",
            "ranking_unit=skill",
            "ranking_unit=course",
            "document_count برابر 1",
            "ردیف‌های ساختاریافته",
            "تعداد کل اسناد ایندکس یا دیتاست معرفی نکن",
            "complete بودن نتایج فیلترشده",
        ):
            with self.subTest(rule=rule):
                self.assertIn(rule, prompt)

    def test_answer_writer_binds_skill_values_to_their_own_rows(self):
        prompt = self.nodes["Answer Writer"]["parameters"]["text"]
        for rule in (
            "همان ردیف ساختاریافته همان مهارت",
            "هرگز مقدار Git را به Python",
            "status و rows_returned",
            "زوج (skill, market_gap)",
            "# 14. رتبه‌بندی محلی نتایج تجمیعی",
            "ترتیب ردیف‌های facts.rows را برای رتبه‌بندی معتبر فرض نکن",
        ):
            with self.subTest(rule=rule):
                self.assertIn(rule, prompt)

    def test_formatter_localizes_headers_and_course_names(self):
        code = self.nodes["Format Result"]["parameters"]["jsCode"]
        self.assertIn("PERSIAN_COLUMN_LABELS", code)
        self.assertIn("شناسه درس", code)
        self.assertIn("displayColumnName(column)", code)
        self.assertIn("ENGLISH_COURSE_NAMES", code)
        self.assertIn("displayValue(column, row[column])", code)

    def test_semantic_integrity_is_attached_to_each_aggregate_result(self):
        code = self.nodes["Format Result"]["parameters"]["jsCode"]
        self.assertIn("semantic_integrity: semanticIntegrity", code)
        self.assertIn('semanticIntegrity.status = semanticIntegrity.violations.length ? "invalid" : "valid"', code)
        self.assertIn("duplicate_group_key", code)

    def test_final_composer_localizes_diagnostics_and_withholds_invalid_numeric_analysis(self):
        code = self.nodes["Compose Final"]["parameters"]["jsCode"]
        self.assertIn('"integrity_failure"', code)
        self.assertIn("Data integrity warning", code)
        self.assertIn("final numeric analysis was withheld", code)
        self.assertIn("تحلیل عددی نهایی ارائه نشد", code)

    def test_course_gap_ranking_is_deterministic_and_uses_the_requested_metric(self):
        formatter = self.nodes["Format Result"]["parameters"]["jsCode"]
        composer = self.nodes["Compose Final"]["parameters"]["jsCode"]
        self.assertIn('metric.alias === "max_market_gap"', formatter)
        self.assertIn("return rightValue - leftValue", formatter)
        self.assertIn("Course ranking by maximum skill gap", composer)
        self.assertIn("رتبه‌بندی قطعی درس‌ها بر اساس بیشترین شکاف مهارتی", composer)

    def test_analysis_is_confined_to_structured_context(self):
        prompt = self.nodes["Answer Writer"]["parameters"]["text"]
        self.assertIn("تنها منبع معتبر برای پاسخ‌گویی", prompt)
        self.assertIn("contextJson", prompt)
        self.assertIn("conversation history, memory", prompt)

    def test_missing_entities_are_not_assumed_absent(self):
        prompt = self.nodes["Answer Writer"]["parameters"]["text"]
        self.assertIn("نبود یک رکورد در داده‌های نمونه‌ای", prompt)
        self.assertIn("داده‌های نمونه‌ای", prompt)


if __name__ == "__main__":
    unittest.main()
