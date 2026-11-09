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
