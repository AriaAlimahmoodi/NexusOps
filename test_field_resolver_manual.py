
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
    FieldResolver,
    FieldResolutionError,
    resolve_field,
    resolve_analytics_request,
)


# ============================================================
# Test 1: Resolve a single field
# ============================================================

resolved_skill = resolve_field(
    dataset_id="labor_market",
    field_name="skill",
    required_role="group_by",
)

assert resolved_skill.name == "skill"
assert resolved_skill.profile_type == "keyword"
assert "keyword" in resolved_skill.actual_types
assert resolved_skill.searchable is True
assert resolved_skill.aggregatable is True

print("Test 1 passed: Single field resolved successfully")


# ============================================================
# Test 2: Resolve a complete analytics request
# ============================================================

request_2 = AnalyticsRequest(
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
    sort=(
        SortSpec(
            field="average_demand",
            order=SortOrder.DESC,
        ),
    ),
    limit=10,
)

resolved_request = resolve_analytics_request(request_2)

assert resolved_request["dataset"]["index"] == "labor_market"
assert resolved_request["operation"] == "aggregate"
assert resolved_request["group_by"][0]["name"] == "skill"
assert resolved_request["metrics"][0]["field"]["name"] == "demand_score"
assert resolved_request["filters"]["logic"] == "and"
assert resolved_request["sort"][0]["field_type"] == "metric"
assert resolved_request["sort"][0]["alias"] == "average_demand"

print("Test 2 passed: Complete analytics request resolved")


# ============================================================
# Test 3: Reject an unknown field
# ============================================================

resolver = FieldResolver("labor_market")

try:
    resolver.resolve_field("unknown_field")
    raise AssertionError(
        "Test 3 failed: Unknown field was accepted."
    )

except FieldResolutionError:
    print("Test 3 passed: Unknown field rejected")


# ============================================================
# Test 4: Reject an unsupported field role
# ============================================================

try:
    resolver.resolve_field(
        field_name="demand_score",
        required_role="group_by",
    )

    raise AssertionError(
        "Test 4 failed: Unsupported field role was accepted."
    )

except FieldResolutionError:
    print("Test 4 passed: Unsupported field role rejected")


# ============================================================
# Test 5: Reject dataset mismatch
# ============================================================

resolver = FieldResolver("labor_market")

request_5 = AnalyticsRequest(
    dataset_id="some_other_dataset",
    operation=AnalyticsOperation.COUNT,
)

try:
    resolver.resolve_request(request_5)

    raise AssertionError(
        "Test 5 failed: Dataset mismatch was accepted."
    )

except FieldResolutionError:
    print("Test 5 passed: Dataset mismatch rejected")


# ============================================================
# Test 6: Resolve metric alias in sorting
# ============================================================

request_6 = AnalyticsRequest(
    dataset_id="labor_market",
    operation=AnalyticsOperation.AGGREGATE,
    group_by=("skill",),
    metrics=(
        MetricSpec(
            function=MetricFunction.AVG,
            field="demand_score",
            alias="average_demand",
        ),
    ),
    sort=(
        SortSpec(
            field="average_demand",
            order=SortOrder.DESC,
        ),
    ),
)

resolved_6 = resolve_analytics_request(request_6)

sort_definition = resolved_6["sort"][0]

assert sort_definition == {
    "alias": "average_demand",
    "order": "desc",
    "field_type": "metric",
}

print("Test 6 passed: Metric alias resolved for sorting")


# ============================================================
# Final Result
# ============================================================

print("\nAll field resolver manual tests passed successfully.")
