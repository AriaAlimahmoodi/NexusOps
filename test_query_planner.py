import unittest

from query_planner import (
    build_query_plan,
    validate_tool_arguments,
    validate_mcp_result,
)


def entity_values(plan):
    """
    Normalize QueryEntity / dict / string entities to comparable values.
    This keeps tests compatible with the structured QueryEntity architecture.
    """
    values = []

    for entity in plan.requested_entities:
        if isinstance(entity, str):
            values.append(entity)

        elif isinstance(entity, dict):
            values.append(str(entity.get("value", "")))

        elif hasattr(entity, "value"):
            values.append(str(entity.value))

        else:
            values.append(str(entity))

    return values


class TestQueryPlanner(unittest.TestCase):

    def test_g0001_routes_to_search(self):
        plan = build_query_plan(
            "اطلاعات فارغ‌التحصیلی G0001 چیست؟"
        )

        self.assertEqual(plan.tool_name, "search_elasticsearch")
        self.assertIn("G0001", entity_values(plan))
        self.assertIsNone(plan.requested_count)

    def test_c013_routes_to_search(self):
        plan = build_query_plan(
            "اسم درس مربوط به C013 چیست؟"
        )

        self.assertEqual(plan.tool_name, "search_elasticsearch")
        self.assertIn("C013", entity_values(plan))

    def test_rust_routes_to_search(self):
        plan = build_query_plan(
            "market_gap مربوط به Rust چقدر است؟"
        )

        self.assertEqual(plan.tool_name, "search_elasticsearch")
        self.assertIn("Rust", entity_values(plan))

    def test_top_10_market_gap(self):
        plan = build_query_plan(
            "۱۰ مهارتی که بیشترین شکاف بازار را دارند چیست؟"
        )

        self.assertEqual(plan.tool_name, "get_top_skill_gaps")
        self.assertEqual(plan.arguments["limit"], 10)
        self.assertEqual(plan.requested_count, 10)

    def test_top_20_market_gap(self):
        plan = build_query_plan(
            "۲۰ مهارتی که بیشترین شکاف بازار را دارند چیست؟"
        )

        self.assertEqual(plan.tool_name, "get_top_skill_gaps")
        self.assertEqual(plan.arguments["limit"], 20)
        self.assertEqual(plan.requested_count, 20)

    def test_top_30_market_gap(self):
        plan = build_query_plan(
            "30 مهارت با بیشترین market_gap را نشان بده"
        )

        self.assertEqual(plan.tool_name, "get_top_skill_gaps")
        self.assertEqual(plan.arguments["limit"], 30)
        self.assertEqual(plan.requested_count, 30)

    def test_comparison_with_two_entities(self):
        plan = build_query_plan(
            "market_gap مربوط به Kubernetes و DevOps را مقایسه کن"
        )

        self.assertEqual(plan.tool_name, "search_elasticsearch")
        self.assertTrue(plan.comparison_requested)

        values = entity_values(plan)

        self.assertIn("Kubernetes", values)
        self.assertIn("DevOps", values)

    def test_tool_argument_override(self):
        plan = build_query_plan(
            "۲۰ مهارتی که بیشترین شکاف بازار را دارند چیست؟"
        )

        valid, arguments, message = validate_tool_arguments(
            plan=plan,
            tool_name="get_top_skill_gaps",
            arguments={
                "limit": 10,
            },
        )

        self.assertTrue(valid, message)
        self.assertEqual(arguments["limit"], 20)

    def test_wrong_tool_is_rejected(self):
        plan = build_query_plan(
            "اطلاعات فارغ‌التحصیلی G0001 چیست؟"
        )

        valid, arguments, message = validate_tool_arguments(
            plan=plan,
            tool_name="get_top_skill_gaps",
            arguments={},
        )

        self.assertFalse(valid)
        self.assertEqual(
            plan.tool_name,
            "search_elasticsearch",
        )

    def test_entity_result_validation_passes(self):
        plan = build_query_plan(
            "اطلاعات فارغ‌التحصیلی G0001 چیست؟"
        )

        data = {
            "results": [
                {
                    "graduate_id": "G0001",
                    "major": "مهندسی کامپیوتر",
                    "graduation_year": 1402,
                }
            ]
        }

        valid, message = validate_mcp_result(
            plan=plan,
            data=data,
        )

        self.assertTrue(valid, message)

    def test_wrong_entity_result_is_rejected(self):
        plan = build_query_plan(
            "اطلاعات فارغ‌التحصیلی G0001 چیست؟"
        )

        data = {
            "results": [
                {
                    "graduate_id": "G0002",
                    "major": "مهندسی کامپیوتر",
                }
            ]
        }

        valid, message = validate_mcp_result(
            plan=plan,
            data=data,
        )

        self.assertFalse(valid)

    def test_top_20_with_only_10_results_is_rejected(self):
        plan = build_query_plan(
            "۲۰ مهارتی که بیشترین شکاف بازار را دارند چیست؟"
        )

        data = {
            "results": [
                {
                    "skill": f"Skill-{i}",
                    "market_gap": float(i),
                }
                for i in range(10)
            ]
        }

        valid, message = validate_mcp_result(
            plan=plan,
            data=data,
        )

        self.assertFalse(valid)

    def test_top_20_with_20_results_is_accepted(self):
        plan = build_query_plan(
            "۲۰ مهارتی که بیشترین شکاف بازار را دارند چیست؟"
        )

        data = {
            "results": [
                {
                    "skill": f"Skill-{i}",
                    "market_gap": float(i),
                }
                for i in range(20)
            ]
        }

        valid, message = validate_mcp_result(
            plan=plan,
            data=data,
        )

        self.assertTrue(valid, message)

    def test_rust_wrong_ranking_result_is_rejected(self):
        plan = build_query_plan(
            "market_gap مربوط به Rust چقدر است؟"
        )

        data = {
            "results": [
                {
                    "skill": "Kubernetes",
                    "market_gap": 3.65,
                },
                {
                    "skill": "DevOps",
                    "market_gap": 3.40,
                },
            ]
        }

        valid, message = validate_mcp_result(
            plan=plan,
            data=data,
        )

        self.assertFalse(valid)


if __name__ == "__main__":
    unittest.main(verbosity=2)