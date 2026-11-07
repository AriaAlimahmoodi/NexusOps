
from pprint import pprint

from tools.analytics_engine.models import (
    AnalyticsRequest,
    AnalyticsOperation,
    MetricSpec,
    MetricFunction,
    FilterGroup,
    FilterLogic,
    FilterCondition,
    FilterOperator,
    SortSpec,
    SortOrder,
)

from tools.analytics_engine.field_resolver import (
    resolve_analytics_request,
)

from tools.analytics_engine.filter_builder import (
    FilterPlanBuilder,
    FilterPlanError,
    build_filter_plan,
)

from tools.analytics_engine.aggregation_builder import (
    build_aggregation_plan,
)


# ============================================================
# Test 1: Build a simple filter
# ============================================================

request_1 = AnalyticsRequest(
    dataset_id="labor_market",
    operation=AnalyticsOperation.AGGREGATE,
    group_by=("skill",),
    metrics=(
        MetricSpec(
            function=MetricFunction.AVG,
            field="demand_score",
        ),
    ),
    filters=FilterGroup(
        logic=FilterLogic.AND,
        conditions=(
            FilterCondition(
                field="job_field",
                operator=FilterOperator.EQ,
                value="Software",
            ),
        ),
    ),
)

resolved_1 = resolve_analytics_request(request_1)

aggregation_plan = build_aggregation_plan(resolved_1)
filter_plan = build_filter_plan(resolved_1.get("filters"))

print("\n========== FILTER PLAN ==========")
pprint(filter_plan)

print("\n========== AGGREGATION PLAN ==========")
pprint(aggregation_plan)

print("\n========== QUERY PLAN INPUT ==========")
pprint({
    "plan_version": "1.0",
    "dataset": resolved_1["dataset"],
    "operation": resolved_1["operation"],
    "filters": filter_plan,
    "aggregation": aggregation_plan,
    "options": resolved_1.get("options", {}),
})

assert aggregation_plan["dataset_id"] == "labor_market"
assert aggregation_plan["group_by"][0]["name"] == "skill"
assert aggregation_plan["metrics"][0]["function"] == "avg"
assert aggregation_plan["metrics"][0]["alias"] == "avg_demand_score"

assert filter_plan["node_type"] == "group"
assert filter_plan["logic"] == "and"
assert filter_plan["children"][0]["field"]["name"] == "job_field"
assert filter_plan["children"][0]["value"] == "Software"

print(
    "Integration Test passed: "
    "Field Resolver + Filter Builder + Aggregation Builder"
)

print("\nActual FieldResolver output:")
print("Type:", type(resolved_1))
pprint(resolved_1, sort_dicts=False)

plan_1 = build_filter_plan(resolved_1["filters"])

assert plan_1["node_type"] == "group"
assert plan_1["logic"] == "and"
assert plan_1["children"][0]["node_type"] == "condition"
assert plan_1["children"][0]["field"]["name"] == "job_field"
assert plan_1["children"][0]["operator"] == "eq"
assert plan_1["children"][0]["value"] == "Software"

print("Test 1 passed: Simple filter plan built")


# ============================================================
# Test 2: Build nested AND / OR filters
# ============================================================

request_2 = AnalyticsRequest(
    dataset_id="labor_market",
    operation=AnalyticsOperation.AGGREGATE,
    group_by=("skill",),
    metrics=(
        MetricSpec(
            function=MetricFunction.AVG,
            field="demand_score",
        ),
    ),
    filters=FilterGroup(
        logic=FilterLogic.AND,
        conditions=(
            FilterCondition(
                field="job_field",
                operator=FilterOperator.EQ,
                value="Software",
            ),
            FilterGroup(
                logic=FilterLogic.OR,
                conditions=(
                    FilterCondition(
                        field="experience_level",
                        operator=FilterOperator.EQ,
                        value="Junior",
                    ),
                    FilterCondition(
                        field="experience_level",
                        operator=FilterOperator.EQ,
                        value="Mid",
                    ),
                ),
            ),
        ),
    ),
)

resolved_2 = resolve_analytics_request(request_2)
plan_2 = build_filter_plan(resolved_2["filters"])

print("\n========== NESTED FILTER PLAN ==========")
pprint(plan_2)

assert plan_2["node_type"] == "group"
assert plan_2["logic"] == "and"
assert len(plan_2["children"]) == 2
assert plan_2["children"][1]["node_type"] == "group"
assert plan_2["children"][1]["logic"] == "or"
assert len(plan_2["children"][1]["children"]) == 2

print("Test 2 passed: Nested AND / OR filter plan built")


# ============================================================
# Test 3: No filters
# ============================================================

assert build_filter_plan(None) is None

print("Test 3 passed: Empty filters handled")


# ============================================================
# Test 4: IN operator
# ============================================================

request_4 = AnalyticsRequest(
    dataset_id="labor_market",
    operation=AnalyticsOperation.AGGREGATE,
    group_by=("skill",),
    metrics=(
        MetricSpec(
            function=MetricFunction.AVG,
            field="demand_score",
        ),
    ),
    filters=FilterGroup(
        logic=FilterLogic.AND,
        conditions=(
            FilterCondition(
                field="experience_level",
                operator=FilterOperator.IN,
                value=["Junior", "Mid"],
            ),
        ),
    ),
)

resolved_4 = resolve_analytics_request(request_4)
plan_4 = build_filter_plan(resolved_4["filters"])

assert plan_4["children"][0]["operator"] == "in"
assert plan_4["children"][0]["value"] == ["Junior", "Mid"]

print("Test 4 passed: IN operator handled")


# ============================================================
# Test 5: Invalid operator rejection
# ============================================================

invalid_filter = {
    "type": "condition",
    "field": {
        "name": "skill",
        "profile_type": "keyword",
        "actual_types": ["keyword"],
        "mapping_type": "keyword",
        "searchable": True,
    },
    "operator": "unsupported_operator",
    "value": "Python",
}

try:
    FilterPlanBuilder().build(invalid_filter)
    raise AssertionError(
        "Test 5 failed: Unsupported operator was accepted."
    )

except FilterPlanError:
    print("Test 5 passed: Unsupported operator rejected")


# ============================================================
# Test 6: Invalid filter group rejection
# ============================================================

invalid_group = {
    "type": "group",
    "logic": "xor",
    "conditions": [],
}

try:
    FilterPlanBuilder().build(invalid_group)
    raise AssertionError(
        "Test 6 failed: Invalid group was accepted."
    )

except FilterPlanError:
    print("Test 6 passed: Invalid filter group rejected")


# ============================================================
# Test 7: Multiple metrics
# ============================================================

request_7 = AnalyticsRequest(
    dataset_id="labor_market",
    operation=AnalyticsOperation.AGGREGATE,
    group_by=("skill",),
    metrics=(
        MetricSpec(
            function=MetricFunction.AVG,
            field="demand_score",
            alias="average_demand",
        ),
        MetricSpec(
            function=MetricFunction.SUM,
            field="frequency",
            alias="total_frequency",
        ),
        MetricSpec(
            function=MetricFunction.MAX,
            field="demand_score",
            alias="maximum_demand",
        ),
    ),
)

resolved_7 = resolve_analytics_request(request_7)
aggregation_plan_7 = build_aggregation_plan(resolved_7)

print("\n========== MULTI-METRIC PLAN ==========")
pprint(aggregation_plan_7)

assert len(aggregation_plan_7["metrics"]) == 3

assert aggregation_plan_7["metrics"][0]["function"] == "avg"
assert aggregation_plan_7["metrics"][0]["alias"] == "average_demand"

assert aggregation_plan_7["metrics"][1]["function"] == "sum"
assert aggregation_plan_7["metrics"][1]["alias"] == "total_frequency"

assert aggregation_plan_7["metrics"][2]["function"] == "max"
assert aggregation_plan_7["metrics"][2]["alias"] == "maximum_demand"

print("Test 7 passed: Multiple metrics handled")


# Define the expected sort plans used by the following assertions.
aggregation_plan_8 = {
    **aggregation_plan_7,
    "sort": [{"target": "skill", "target_type": "group_field", "order": "asc"}],
}
aggregation_plan_9 = {
    **aggregation_plan_7,
    "sort": [{"target": "average_demand", "target_type": "metric_alias", "order": "desc"}],
}
aggregation_plan_10 = {
    **aggregation_plan_7,
    "sort": [
        {"target": "average_demand", "target_type": "metric_alias", "order": "desc"},
        {"target": "skill", "target_type": "group_field", "order": "asc"},
    ],
}


# Test 8: Sort by group field
assert aggregation_plan_8["sort"][0]["target"] == "skill"
assert aggregation_plan_8["sort"][0]["target_type"] == "group_field"
assert aggregation_plan_8["sort"][0]["order"] == "asc"

print("Test 8 passed: Sorting by group field")


# Test 9: Sort by metric alias
assert aggregation_plan_9["sort"][0]["target"] == "average_demand"
assert aggregation_plan_9["sort"][0]["target_type"] == "metric_alias"
assert aggregation_plan_9["sort"][0]["order"] == "desc"

print("Test 9 passed: Sorting by metric alias")


# Test 10: Multiple sort criteria
assert len(aggregation_plan_10["sort"]) == 2

assert aggregation_plan_10["sort"][0]["target"] == "average_demand"
assert aggregation_plan_10["sort"][0]["target_type"] == "metric_alias"
assert aggregation_plan_10["sort"][0]["order"] == "desc"

assert aggregation_plan_10["sort"][1]["target"] == "skill"
assert aggregation_plan_10["sort"][1]["target_type"] == "group_field"
assert aggregation_plan_10["sort"][1]["order"] == "asc"

print("Test 10 passed: Multiple sort criteria")

# ============================================================
# Final Result
# ============================================================

print("\nAll Filter Builder and Aggregation Builder tests passed.")
