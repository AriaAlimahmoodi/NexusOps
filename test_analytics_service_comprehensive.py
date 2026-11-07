from pprint import pprint

from tools.analytics_engine.analytics_service import (
    AnalyticsService,
    AnalyticsServiceError,
)
from tools.analytics_engine.models import (
    AnalyticsOperation,
    AnalyticsRequest,
    FilterCondition,
    FilterGroup,
    FilterLogic,
    FilterOperator,
    MetricFunction,
    MetricSpec,
)
from tools.adapters.elasticsearch_adapter import ElasticsearchAdapter


def create_service():
    adapter = ElasticsearchAdapter()
    return AnalyticsService(adapter=adapter)


def test_1_count():
    print("\n" + "=" * 70)
    print("TEST 1 - COUNT")
    print("=" * 70)

    service = create_service()

    request = AnalyticsRequest(
        dataset_id="labor_market",
        operation=AnalyticsOperation.COUNT,
    )

    result = service.analyze(request)

    pprint(result)

    assert result["status"] == "success"
    assert result["dataset_id"] == "labor_market"
    assert result["operation"] == "count"
    assert "result" in result

    print("TEST 1 PASSED")


def test_2_aggregate_single_group():
    print("\n" + "=" * 70)
    print("TEST 2 - SINGLE GROUP + SINGLE METRIC")
    print("=" * 70)

    service = create_service()

    request = AnalyticsRequest(
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
        limit=5,
    )

    result = service.analyze(request)

    pprint(result)

    assert result["status"] == "success"
    assert result["result"]["buckets"]
    assert len(result["result"]["buckets"]) <= 5

    print("TEST 2 PASSED")


def test_3_multiple_metrics():
    print("\n" + "=" * 70)
    print("TEST 3 - MULTIPLE METRICS")
    print("=" * 70)

    service = create_service()

    request = AnalyticsRequest(
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
        limit=5,
    )

    result = service.analyze(request)

    pprint(result)

    buckets = result["result"]["buckets"]

    assert buckets
    assert "average_demand" in buckets[0]["metrics"]
    assert "total_frequency" in buckets[0]["metrics"]
    assert "maximum_demand" in buckets[0]["metrics"]

    print("TEST 3 PASSED")


def test_4_filter():
    print("\n" + "=" * 70)
    print("TEST 4 - FILTER")
    print("=" * 70)

    service = create_service()

    filters = FilterGroup(
        logic=FilterLogic.AND,
        conditions=(
            FilterCondition(
                field="experience_level",
                operator=FilterOperator.EQ,
                value="Junior",
            ),
        ),
    )

    request = AnalyticsRequest(
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
        filters=filters,
        limit=5,
    )

    result = service.analyze(request)

    pprint(result)

    assert result["status"] == "success"
    assert "result" in result
    assert result["result"]["buckets"]

    print("TEST 4 PASSED")

def test_5_multiple_group_by():
    print("\n" + "=" * 70)
    print("TEST 5 - MULTIPLE GROUP BY")
    print("=" * 70)

    service = create_service()

    request = AnalyticsRequest(
        dataset_id="labor_market",
        operation=AnalyticsOperation.AGGREGATE,
        group_by=("job_field", "experience_level"),
        metrics=(
            MetricSpec(
                function=MetricFunction.AVG,
                field="demand_score",
                alias="average_demand",
            ),
        ),
        limit=10,
    )

    result = service.analyze(request)

    pprint(result)

    assert result["status"] == "success"
    assert result["result"]["buckets"]

    first_group = result["result"]["buckets"][0]["group"]

    assert "job_field" in first_group
    assert "experience_level" in first_group

    print("TEST 5 PASSED")


def test_6_invalid_field():
    print("\n" + "=" * 70)
    print("TEST 6 - INVALID FIELD")
    print("=" * 70)

    service = create_service()

    request = AnalyticsRequest(
        dataset_id="labor_market",
        operation=AnalyticsOperation.AGGREGATE,
        group_by=("this_field_does_not_exist",),
        metrics=(
            MetricSpec(
                function=MetricFunction.AVG,
                field="demand_score",
                alias="average_demand",
            ),
        ),
    )

    try:
        service.analyze(request)
    except AnalyticsServiceError as exc:
        print("Expected error:")
        print(exc)
        print("TEST 6 PASSED")
        return

    raise AssertionError(
        "Expected AnalyticsServiceError was not raised."
    )


def test_7_invalid_metric():
    print("\n" + "=" * 70)
    print("TEST 7 - INVALID METRIC FIELD")
    print("=" * 70)

    service = create_service()

    request = AnalyticsRequest(
        dataset_id="labor_market",
        operation=AnalyticsOperation.AGGREGATE,
        group_by=("skill",),
        metrics=(
            MetricSpec(
                function=MetricFunction.AVG,
                field="invalid_metric_field",
                alias="average_value",
            ),
        ),
    )

    try:
        service.analyze(request)
    except AnalyticsServiceError as exc:
        print("Expected error:")
        print(exc)
        print("TEST 7 PASSED")
        return

    raise AssertionError(
        "Expected AnalyticsServiceError was not raised."
    )


def test_8_invalid_dataset():
    print("\n" + "=" * 70)
    print("TEST 8 - INVALID DATASET")
    print("=" * 70)

    service = create_service()

    request = AnalyticsRequest(
        dataset_id="dataset_that_does_not_exist",
        operation=AnalyticsOperation.COUNT,
    )

    try:
        service.analyze(request)
    except AnalyticsServiceError as exc:
        print("Expected error:")
        print(exc)
        print("TEST 8 PASSED")
        return

    raise AssertionError(
        "Expected AnalyticsServiceError was not raised."
    )


def run_all_tests():
    print("\n")
    print("#" * 70)
    print("COMPREHENSIVE ANALYTICS SERVICE TEST SUITE")
    print("#" * 70)

    test_1_count()
    test_2_aggregate_single_group()
    test_3_multiple_metrics()
    test_4_filter()
    test_5_multiple_group_by()
    test_6_invalid_field()
    test_7_invalid_metric()
    test_8_invalid_dataset()

    print("\n" + "#" * 70)
    print("ALL COMPREHENSIVE ANALYTICS SERVICE TESTS PASSED")
    print("#" * 70)


if __name__ == "__main__":
    run_all_tests()