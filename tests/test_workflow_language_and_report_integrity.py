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


class TestWorkflowLanguageAndEvidence(unittest.TestCase):
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

    def test_answer_writer_binds_skill_values_to_their_own_rows(self):
        prompt = self.nodes["Answer Writer"]["parameters"]["text"]
        self.assertIn("همان ردیف ساختاریافته همان مهارت", prompt)
        self.assertIn("هرگز مقدار Git را به Python", prompt)
        self.assertIn("status و rows_returned", prompt)
        self.assertIn("زوج (skill, market_gap)", prompt)
        self.assertIn("# 14. رتبه‌بندی محلی نتایج تجمیعی", prompt)
        self.assertIn("ترتیب ردیف‌های facts.rows را برای رتبه‌بندی معتبر فرض نکن", prompt)

    def test_result_tables_localize_common_headers_for_persian(self):
        code = self.nodes["Format Result"]["parameters"]["jsCode"]
        self.assertIn("PERSIAN_COLUMN_LABELS", code)
        self.assertIn('شناسه درس', code)
        self.assertIn("displayColumnName(column)", code)
        self.assertIn("buildItems[0]?.json?.question", code)

    def test_persian_language_detection_uses_real_unicode_range(self):
        for node_name in ("Prepare LLM Context", "Format Result", "Compose Final"):
            with self.subTest(node=node_name):
                code = self.nodes[node_name]["parameters"]["jsCode"]
                self.assertIn(r"match(/[\u0600-\u06FF]/g)", code)
                self.assertNotIn(r"match(/[\\u0600-\\u06FF]/g)", code)

    def test_skill_gap_questions_have_deterministic_routes(self):
        code = self.nodes["Validate Plan"]["parameters"]["jsCode"]
        self.assertIn("const asksSkillGap=", code)
        self.assertIn('tool:"get_top_skill_gaps"', code)
        self.assertIn('group_by:["course_id","course_name"]', code)
        self.assertIn('alias:"max_market_gap"', code)
        self.assertIn('alias:"record_count"', code)
        # Nested terms buckets cannot be ordered by a metric below another terms bucket.
        self.assertIn("sort:[],\n      limit:50", code)

    def test_course_gap_rows_are_ranked_deterministically_and_summary_uses_all_rows(self):
        format_code = self.nodes["Format Result"]["parameters"]["jsCode"]
        compose_code = self.nodes["Compose Final"]["parameters"]["jsCode"]
        self.assertIn('args.group_by.includes("course_id")', format_code)
        self.assertIn('args.group_by.includes("course_name")', format_code)
        self.assertIn('metric.alias === "max_market_gap"', format_code)
        self.assertIn("return rightValue - leftValue", format_code)
        self.assertIn("courseGapAggregates", compose_code)
        self.assertIn("ranked.length===sourceRows.length", compose_code)
        self.assertIn("ranked.map((row,index)", compose_code)
        self.assertIn("رتبه‌بندی قطعی درس‌ها", compose_code)

    def test_aggregate_semantic_integrity_checks_required_fields_numeric_values_and_duplicate_groups(self):
        code = self.nodes["Format Result"]["parameters"]["jsCode"]
        self.assertIn('semanticIntegrity.status = semanticIntegrity.violations.length ? "invalid" : "valid"', code)
        self.assertIn('"missing_required_field:" + field', code)
        self.assertIn('"invalid_metric_value:" + alias', code)
        self.assertIn('"duplicate_group_key"', code)
        self.assertIn("semantic_integrity: semanticIntegrity", code)

    def test_compose_final_withholds_numeric_analysis_on_integrity_failure(self):
        code = self.nodes["Compose Final"]["parameters"]["jsCode"]
        self.assertIn('const semanticIntegrityFailures=r.filter(x=>x.semanticIntegrity?.status==="invalid")', code)
        self.assertIn('"integrity_failure"', code)
        self.assertIn("Data integrity warning", code)
        self.assertIn("final numeric analysis was withheld", code)

    def test_answer_writer_obeys_semantic_integrity_status(self):
        prompt = self.nodes["Answer Writer"]["parameters"]["text"]
        self.assertIn("قرارداد یکپارچگی ساختاریافته (Semantic Integrity)", prompt)
        self.assertIn("facts.semantic_integrity.status برابر invalid", prompt)
        self.assertIn("status برابر valid فقط صحت ساختار", prompt)

    def test_final_composer_localizes_diagnostics(self):
        code = self.nodes["Compose Final"]["parameters"]["jsCode"]
        self.assertIn('warning.push(fa?', code)
        self.assertIn('fa?"تحلیل متنی تولید نشد."', code)
        self.assertIn("The analysis plan set is incomplete", code)

    def test_english_university_course_gap_question_routes_to_course_level_aggregation(self):
        code = self.nodes["Validate Plan"]["parameters"]["jsCode"]
        self.assertIn("if(asksSkillGap&&asksCourses&&(", code)
        self.assertIn('has("which")&&has("course")', code)
        self.assertIn('"which university courses"', code)
        self.assertIn('group_by:["course_id","course_name"]', code)
        self.assertIn('alias:"max_market_gap"', code)

    def test_course_gap_analysis_is_deterministic_and_fully_localized(self):
        compose = self.nodes["Compose Final"]["parameters"]["jsCode"]
        formatter = self.nodes["Format Result"]["parameters"]["jsCode"]
        self.assertIn("Course ranking by maximum skill gap", compose)
        self.assertIn("displayCourseName(row.course_name)", compose)
        self.assertIn("Cloud Computing", compose)
        self.assertIn("رتبه‌بندی قطعی درس‌ها بر اساس بیشترین شکاف مهارتی", compose)
        self.assertIn("all \"+ranked.length+\" course rows", compose)
        self.assertIn("max_market_gap", compose)
        self.assertIn("ENGLISH_COURSE_NAMES", formatter)
        self.assertIn('"رایانش ابری": "Cloud Computing"', formatter)
        self.assertIn('column === "course_name"', formatter)

    def test_answer_writer_checks_entity_type_row_count_and_requested_metric(self):
        prompt = self.nodes["Answer Writer"]["parameters"]["text"]
        for rule in (
            "# 15. تطبیق نوع موجودیت، تعداد ردیف و معیار رتبه‌بندی",
            "group_by و فیلدهای همان ردیف",
            "تعداد نتایج را فقط از طول آرایه واقعی facts.rows",
            "demand_score یا market_demand جایگزین gap نیست",
            "ترتیب جدول و تحلیل باید یکسان باشد",
        ):
            with self.subTest(rule=rule):
                self.assertIn(rule, prompt)

    def test_course_gap_composer_does_not_invent_a_ranking_for_empty_rows(self):
        compose = self.nodes["Compose Final"]["parameters"]["jsCode"]
        self.assertIn("if(sourceRows.length===0)", compose)
        self.assertIn("No aggregated course rows were returned", compose)
        self.assertIn("هیچ ردیف تجمیعی برای رتبه‌بندی درس‌ها", compose)

    def test_formatter_preserves_major_localization_contract_and_course_localization(self):
        formatter = self.nodes["Format Result"]["parameters"]["jsCode"]
        self.assertIn('column === "major" && value === "Computer Engineering" ? "مهندسی کامپیوتر"', formatter)
        self.assertIn('column === "course_name" && typeof value === "string"', formatter)
        self.assertIn("ENGLISH_COURSE_NAMES", formatter)

    def test_course_gap_analysis_uses_real_newlines_and_singular_record_grammar(self):
        compose = self.nodes["Compose Final"]["parameters"]["jsCode"]
        self.assertIn('lines.join("\\n")', compose)
        self.assertNotIn('lines.join("\\\\n")', compose)
        self.assertIn('Number(count)===1?" record":" records"', compose)

    def test_answer_writer_uses_one_authoritative_language_source(self):
        prompt = self.nodes["Answer Writer"]["parameters"]["text"]
        self.assertIn("responseLanguage", prompt)
        self.assertIn("زبان پاسخ را دوباره تشخیص نده", prompt)
        self.assertNotIn("زبان غالب سؤال جاری را با شمارش نویسه‌های فارسی و لاتین", prompt)


if __name__ == "__main__":
    unittest.main()
