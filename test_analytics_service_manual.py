from pprint import pprint

from tools.analytics_engine.analytics_service import (
    AnalyticsService,
    AnalyticsServiceError,
)
from tools.analytics_engine.models import (
    AnalyticsOperation,
    AnalyticsRequest,
    MetricFunction,
    MetricSpec,
)
from tools.adapters.elasticsearch_adapter import ElasticsearchAdapter


def build_request() -> AnalyticsRequest:
    return AnalyticsRequest(
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
        limit=10,
    )


def main() -> None:
    print("Creating Elasticsearch Adapter...")
    adapter = ElasticsearchAdapter()

    print("Creating Analytics Service...")
    service = AnalyticsService(adapter=adapter)

    print("Building Analytics Request...")
    request = build_request()

    print("\n========== ANALYTICS REQUEST ==========")
    pprint(request)

    print("\nExecuting End-to-End Analytics Pipeline...")

    try:
        result = service.analyze(request)
    except AnalyticsServiceError as exc:
        print("\nAnalyticsServiceError:")
        print(exc)
        raise

    print("\n========== FINAL ANALYTICS RESPONSE ==========")
    pprint(result)

    # ---------------------------------------------------------
    # Basic structural assertions
    # ---------------------------------------------------------

    assert isinstance(result, dict), (
        "Service result must be a dictionary."
    )

    assert result.get("dataset_id") == "labor_market", (
        "Dataset ID mismatch."
    )

    assert result.get("operation") == "aggregate", (
        "Operation mismatch."
    )

    assert "result" in result, (
        "Formatted response must contain 'result'."
    )

    assert "metadata" in result, (
        "Formatted response must contain 'metadata'."
    )

    print("\nTest 1 passed: Service returned a dictionary")

    print("Test 2 passed: Dataset ID is correct")

    print("Test 3 passed: Operation is aggregate")

    print("Test 4 passed: Result section exists")

    print("Test 5 passed: Metadata section exists")

    print("\nAll AnalyticsService End-to-End tests completed.")


if __name__ == "__main__":
    main()