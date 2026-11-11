from __future__ import annotations

from llm_query_planner import build_deterministic_analytics_query_plan


def test_skill_mapping_comparison_builds_multi_metric_grouped_aggregate():
    plan = build_deterministic_analytics_query_plan(
        "Compare average market demand and market gap by skill"
    )
    assert plan is not None
    assert plan.tool_name == "analytics_query"
    assert plan.arguments["dataset_id"] == "skill_mapping"
    assert plan.arguments["operation"] == "aggregate"
    assert plan.arguments["group_by"] == ["skill"]
    assert plan.arguments["metrics"] == [
        {"function": "avg", "field": "market_demand", "alias": "average_market_demand"},
        {"function": "avg", "field": "market_gap", "alias": "average_market_gap"},
    ]


def test_skill_mapping_compound_thresholds_are_preserved_as_and_filters():
    plan = build_deterministic_analytics_query_plan(
        "List skills with market_demand >= 4.8 and market_gap >= 2.5"
    )
    assert plan is not None
    assert plan.arguments["operation"] == "select"
    assert plan.arguments["dataset_id"] == "skill_mapping"
    assert plan.arguments["filters"] == {
        "logic": "and",
        "conditions": [
            {"field": "market_demand", "operator": "gte", "value": 4.8},
            {"field": "market_gap", "operator": "gte", "value": 2.5},
        ],
        "groups": [],
    }


def test_skill_mapping_persian_compound_thresholds_are_supported():
    plan = build_deterministic_analytics_query_plan(
        "مهارت‌هایی با تقاضای بازار حداقل 4.8 و شکاف بازار حداقل 2.5 را فهرست کن"
    )
    assert plan is not None
    assert plan.arguments["dataset_id"] == "skill_mapping"
    assert plan.arguments["operation"] == "select"
    assert {
        (item["field"], item["operator"], item["value"])
        for item in plan.arguments["filters"]["conditions"]
    } == {
        ("market_demand", "gte", 4.8),
        ("market_gap", "gte", 2.5),
    }


def test_graduate_comparison_groups_multiple_outcomes_by_major():
    plan = build_deterministic_analytics_query_plan(
        "مقایسه میانگین ارتباط شغلی و مدت اشتغال به تفکیک رشته فارغ التحصیلان"
    )
    assert plan is not None
    assert plan.arguments["dataset_id"] == "university_graduates"
    assert plan.arguments["operation"] == "aggregate"
    assert plan.arguments["group_by"] == ["major"]
    assert {metric["field"] for metric in plan.arguments["metrics"]} == {
        "career_relevance", "employment_months",
    }


def test_labor_market_comparison_groups_demand_by_job_field():
    plan = build_deterministic_analytics_query_plan(
        "Compare average demand score by job field"
    )
    assert plan is not None
    assert plan.arguments["dataset_id"] == "labor_market"
    assert plan.arguments["operation"] == "aggregate"
    assert plan.arguments["group_by"] == ["job_field"]
    assert plan.arguments["metrics"] == [
        {"function": "avg", "field": "demand_score", "alias": "average_demand_score"}
    ]


def test_course_analytics_aggregates_average_credits_by_category():
    plan = build_deterministic_analytics_query_plan(
        "میانگین واحدها را به تفکیک دسته درس مقایسه کن"
    )
    assert plan is not None
    assert plan.arguments["dataset_id"] == "university_courses"
    assert plan.arguments["operation"] == "aggregate"
    assert plan.arguments["group_by"] == ["course_category"]
    assert plan.arguments["metrics"] == [
        {"function": "avg", "field": "credits", "alias": "average_credits"}
    ]


def test_ranked_aggregate_adds_metric_sort_and_stable_limit():
    plan = build_deterministic_analytics_query_plan(
        "Rank skills by highest average market gap"
    )
    assert plan is not None
    assert plan.arguments["operation"] == "aggregate"
    assert plan.arguments["sort"] == [
        {"field": "average_market_gap", "order": "desc"}
    ]
    assert plan.arguments["limit"] == 100


def test_profile_driven_filters_support_less_than_and_greater_than():
    plan = build_deterministic_analytics_query_plan(
        "List skills with market_demand > 3.5 and market_gap < 2.0"
    )
    assert plan is not None
    assert plan.arguments["filters"]["conditions"] == [
        {"field": "market_demand", "operator": "gt", "value": 3.5},
        {"field": "market_gap", "operator": "lt", "value": 2.0},
    ]


def test_unsupported_or_ambiguous_question_does_not_get_a_guessed_plan():
    assert build_deterministic_analytics_query_plan(
        "Explain whether the university is successful"
    ) is None


def test_generated_comparison_plan_is_fully_validated_against_profile():
    plan = build_deterministic_analytics_query_plan(
        "Compare average market demand and market gap by skill"
    )
    assert plan is not None
    assert plan.arguments["filters"] is None
    assert plan.arguments["options"] == {}
    assert all(metric.get("alias") for metric in plan.arguments["metrics"])


def test_graduate_identifier_keeps_exact_entity_lookup_route():
    from query_planner import build_query_plan

    plan = build_query_plan("Show the profile for graduate G0001")
    assert plan.tool_name == "search_elasticsearch"
    assert {"type": "graduate_id", "value": "G0001"} in plan.requested_entities


def test_course_identifier_keeps_exact_entity_lookup_route():
    from query_planner import build_query_plan

    plan = build_query_plan("Show details for course C002")
    assert plan.tool_name == "search_elasticsearch"
    assert {"type": "course_id", "value": "C002"} in plan.requested_entities


def test_specialized_skill_gap_tool_has_priority_over_generic_analytics():
    from query_planner import build_query_plan

    plan = build_query_plan("Show the top 5 skill gaps")
    assert plan.tool_name == "get_top_skill_gaps"
    assert plan.arguments == {"limit": 5}


def test_specialized_market_skill_tool_has_priority_over_generic_analytics():
    from query_planner import build_query_plan

    plan = build_query_plan("Show the top 5 most demanded skills")
    assert plan.tool_name == "get_top_market_skills"
    assert plan.arguments == {"limit": 5}


def test_query_resolution_does_not_invoke_local_planner_for_exact_ids_or_specialized_tools():
    import asyncio
    from llm_mcp_client import resolve_query_plan

    class NoLLMClient:
        @property
        def chat(self):
            raise AssertionError("Local LLM planner must not run for authoritative routes.")

    async def run():
        graduate = await resolve_query_plan(
            NoLLMClient(), "Show the profile for graduate G0001"
        )
        course = await resolve_query_plan(
            NoLLMClient(), "Show details for course C002"
        )
        gap = await resolve_query_plan(
            NoLLMClient(), "Show the top 5 skill gaps"
        )
        demand = await resolve_query_plan(
            NoLLMClient(), "Show the top 5 most demanded skills"
        )
        return graduate, course, gap, demand

    graduate, course, gap, demand = asyncio.run(run())
    assert graduate.tool_name == "search_elasticsearch"
    assert course.tool_name == "search_elasticsearch"
    assert gap.tool_name == "get_top_skill_gaps"
    assert demand.tool_name == "get_top_market_skills"


def test_multi_metric_comparison_sorts_by_explicitly_ranked_metric():
    plan = build_deterministic_analytics_query_plan(
        "Compare average market demand and market gap by skill, rank by highest market gap"
    )
    assert plan is not None
    assert [metric["field"] for metric in plan.arguments["metrics"]] == [
        "market_demand", "market_gap",
    ]
    assert plan.arguments["sort"] == [
        {"field": "average_market_gap", "order": "desc"}
    ]


def test_market_demand_by_job_field_uses_labor_market_demand_score():
    plan = build_deterministic_analytics_query_plan(
        "Compare average market demand by job field"
    )
    assert plan is not None
    assert plan.arguments["dataset_id"] == "labor_market"
    assert plan.arguments["group_by"] == ["job_field"]
    assert plan.arguments["metrics"] == [
        {"function": "avg", "field": "demand_score", "alias": "average_demand_score"}
    ]


def test_unsupported_explicit_dimension_is_not_silently_replaced():
    plan = build_deterministic_analytics_query_plan(
        "Compare average market gap by job field"
    )
    assert plan is None


def test_explicit_multi_metric_skill_comparison_overrides_single_metric_ranking_route():
    import asyncio
    from llm_mcp_client import resolve_query_plan

    class NoLLMClient:
        @property
        def chat(self):
            raise AssertionError("Deterministic comparison must not call the local planner.")

    plan = asyncio.run(resolve_query_plan(
        NoLLMClient(),
        "Compare average market demand and market gap by skill, rank by highest market gap",
    ))
    assert plan.tool_name == "analytics_query"
    assert plan.arguments["operation"] == "aggregate"
    assert len(plan.arguments["metrics"]) == 2
    assert plan.arguments["sort"] == [
        {"field": "average_market_gap", "order": "desc"}
    ]


def test_global_graduate_average_uses_scalar_aggregate_without_grouping():
    plan = build_deterministic_analytics_query_plan(
        "میانگین مدت اشتغال فارغ التحصیلان را محاسبه کن"
    )
    assert plan is not None
    assert plan.arguments["dataset_id"] == "university_graduates"
    assert plan.arguments["operation"] == "aggregate"
    assert plan.arguments["group_by"] == []
    assert plan.arguments["metrics"] == [
        {"function": "avg", "field": "employment_months", "alias": "average_employment_months"}
    ]


def test_numeric_thresholds_on_metric_fields_remain_select_not_aggregate():
    plan = build_deterministic_analytics_query_plan(
        "List skills with market_demand >= 4.8 and market_gap >= 2.5"
    )
    assert plan is not None
    assert plan.arguments["operation"] == "select"
    assert plan.arguments["filters"]["conditions"] == [
        {"field": "market_demand", "operator": "gte", "value": 4.8},
        {"field": "market_gap", "operator": "gte", "value": 2.5},
    ]


def test_global_graduate_count_and_average_share_one_scalar_aggregate():
    plan = build_deterministic_analytics_query_plan(
        "تعداد فارغ التحصیلان و میانگین مدت اشتغال را محاسبه کن"
    )
    assert plan is not None
    assert plan.arguments["operation"] == "aggregate"
    assert plan.arguments["group_by"] == []
    assert plan.arguments["metrics"] == [
        {"function": "count_documents", "alias": "graduate_count"},
        {"function": "avg", "field": "employment_months", "alias": "average_employment_months"},
    ]


def test_skill_threshold_planner_preserves_multiple_comparisons_on_one_field():
    plan = build_deterministic_analytics_query_plan(
        "List skills with market_demand >= 4.8 and market_demand <= 5 and market_gap > 2.5"
    )
    assert plan is not None
    assert plan.arguments["filters"]["logic"] == "and"
    assert plan.arguments["filters"]["conditions"] == [
        {"field": "market_demand", "operator": "gte", "value": 4.8},
        {"field": "market_demand", "operator": "lte", "value": 5},
        {"field": "market_gap", "operator": "gt", "value": 2.5},
    ]


def test_skill_threshold_planner_preserves_explicit_or_semantics():
    plan = build_deterministic_analytics_query_plan(
        "فهرست مهارت‌هایی که تقاضای بازار حداقل 4.8 یا شکاف بازار حداقل 2.5 دارند"
    )
    assert plan is not None
    assert plan.arguments["filters"]["logic"] == "or"
    assert len(plan.arguments["filters"]["conditions"]) == 2


def test_skill_threshold_planner_rejects_ambiguous_mixed_flat_boolean_connectors():
    plan = build_deterministic_analytics_query_plan(
        "List skills with market_demand >= 4.8 and market_gap >= 2.5 or course_coverage < 2"
    )
    assert plan is None


def test_skill_threshold_planner_inverts_reversed_numeric_comparisons():
    plan = build_deterministic_analytics_query_plan(
        "List skills where 4.8 <= market_demand and 2.5 < market_gap"
    )
    assert plan is not None
    assert plan.arguments["filters"]["conditions"] == [
        {"field": "market_demand", "operator": "gte", "value": 4.8},
        {"field": "market_gap", "operator": "gt", "value": 2.5},
    ]


def test_skill_threshold_planner_normalizes_persian_digits_and_decimal_commas():
    plan = build_deterministic_analytics_query_plan(
        "مهارت‌هایی با تقاضای بازار بیشتر از ۴,۸ و شکاف بازار کمتر از ۲,۵"
    )
    assert plan is not None
    assert plan.arguments["filters"]["conditions"] == [
        {"field": "market_demand", "operator": "gt", "value": 4.8},
        {"field": "market_gap", "operator": "lt", "value": 2.5},
    ]


def test_skill_threshold_planner_builds_nested_boolean_groups_with_and_precedence():
    plan = build_deterministic_analytics_query_plan(
        "List skills with market_demand >= 4.8 and market_gap >= 2.5 or course_coverage < 2"
    )
    assert plan is not None
    assert plan.arguments["filters"] == {
        "logic": "or",
        "conditions": [],
        "groups": [
            {
                "logic": "and",
                "conditions": [
                    {"field": "market_demand", "operator": "gte", "value": 4.8},
                    {"field": "market_gap", "operator": "gte", "value": 2.5},
                ],
                "groups": [],
            },
            {
                "logic": "and",
                "conditions": [
                    {"field": "course_coverage", "operator": "lt", "value": 2},
                ],
                "groups": [],
            },
        ],
    }
