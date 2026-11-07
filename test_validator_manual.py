
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

from tools.analytics_engine.query_validator import (
    validate_analytics_request,
    AnalyticsValidationError,
)
from unittest.mock import patch
from copy import deepcopy

from tools.datasets.schema_discovery import discover_dataset_schema

# ============================================================
# Test 1: Valid aggregation request
# ============================================================

request_1 = AnalyticsRequest(
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
    sort=(
        SortSpec(
            field="average_demand",
            order=SortOrder.DESC,
        ),
    ),
    limit=10,
)

report_1 = validate_analytics_request(request_1)

assert report_1.valid is True
print("Test 1 passed: Valid aggregation request")


# ============================================================
# Test 2: Valid nested AND / OR filters
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

report_2 = validate_analytics_request(request_2)

assert report_2.valid is True
print("Test 2 passed: Nested AND / OR filters")


# ============================================================
# Test 3: Invalid metric-field combination
# ============================================================

request_3 = AnalyticsRequest(
    dataset_id="labor_market",
    operation=AnalyticsOperation.AGGREGATE,
    group_by=("skill",),
    metrics=(
        MetricSpec(
            function=MetricFunction.SUM,
            field="job_title",
            alias="invalid_sum",
        ),
    ),
)

try:
    validate_analytics_request(request_3)
    raise AssertionError(
        "Test 3 failed: Invalid metric was accepted."
    )

except AnalyticsValidationError as exc:
    assert any(
        "numeric field" in error
        for error in exc.errors
    )
    print("Test 3 passed: Invalid metric rejected")


# ============================================================
# Test 4: Unknown field rejection
# ============================================================

request_4 = AnalyticsRequest(
    dataset_id="labor_market",
    operation=AnalyticsOperation.AGGREGATE,
    group_by=("unknown_field",),
    metrics=(
        MetricSpec(
            function=MetricFunction.AVG,
            field="demand_score",
            alias="average_demand",
        ),
    ),
)

try:
    validate_analytics_request(request_4)
    raise AssertionError(
        "Test 4 failed: Unknown field was accepted."
    )

except AnalyticsValidationError as exc:
    assert any(
        "not registered" in error
        for error in exc.errors
    )
    print("Test 4 passed: Unknown field rejected")


# ============================================================
# Test 5: Reject string value for numeric field
# ============================================================

request_5 = AnalyticsRequest(
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
                field="demand_score",
                operator=FilterOperator.EQ,
                value="high",
            ),
        ),
    ),
)

try:
    validate_analytics_request(request_5)
    raise AssertionError(
        "Test 5 failed: Incompatible filter value was accepted."
    )
except AnalyticsValidationError as exc:
    assert any(
        "incompatible" in error
        for error in exc.errors
    )
    print("Test 5 passed: Incompatible numeric filter value rejected")


# ============================================================
# Test 6: Reject incompatible values in IN operator
# ============================================================

request_6 = AnalyticsRequest(
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
                value=["Junior", 123],
            ),
        ),
    ),
)

try:
    validate_analytics_request(request_6)
    raise AssertionError(
        "Test 6 failed: Invalid IN values were accepted."
    )
except AnalyticsValidationError as exc:
    assert any(
        "incompatible" in error
        for error in exc.errors
    )
    print("Test 6 passed: Incompatible IN values rejected")


# ============================================================
# Test 7: Reject string value for numeric range filter
# ============================================================

request_7 = AnalyticsRequest(
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
                field="frequency",
                operator=FilterOperator.GT,
                value="300",
            ),
        ),
    ),
)

try:
    validate_analytics_request(request_7)
    raise AssertionError(
        "Test 7 failed: String range value was accepted."
    )
except AnalyticsValidationError as exc:
    assert any(
        "numeric values" in error
        for error in exc.errors
    )
    print("Test 7 passed: Invalid range value rejected")


# ============================================================
# Test 8: Reject non-aggregatable group_by field
# ============================================================

request_8 = AnalyticsRequest(
    dataset_id="labor_market",
    operation=AnalyticsOperation.AGGREGATE,
    group_by=("skill",),
    metrics=(
        MetricSpec(
            function=MetricFunction.AVG,
            field="demand_score",
        ),
    ),
)

modified_schema = deepcopy(
    discover_dataset_schema("labor_market")
)

modified_schema["actual_fields"]["skill"]["aggregatable"] = False

with patch(
    "tools.analytics_engine.query_validator.discover_dataset_schema",
    return_value=modified_schema,
):
    try:
        validate_analytics_request(request_8)
        raise AssertionError(
            "Test 8 failed: Non-aggregatable field was accepted."
        )
    except AnalyticsValidationError as exc:
        assert any(
            "not aggregatable" in error
            for error in exc.errors
        )
        print("Test 8 passed: Non-aggregatable group_by rejected")


# ============================================================
# Final Result
# ============================================================

print("\nAll eight validator manual tests passed successfully.")

# ============================================================
# Final Result
# ============================================================

print("\nAll validator manual tests passed successfully.")
