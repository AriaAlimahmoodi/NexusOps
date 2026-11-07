from pprint import pprint

from tools.analytics_engine.models import (
    AnalyticsOperation,
    AnalyticsRequest,
    MetricFunction,
    MetricSpec,
)
from tools.analytics_engine.field_resolver import resolve_analytics_request
from tools.analytics_engine.query_executor import execute_analytics_query


class FakeAdapter:
    def execute(self, plan):
        print("\n========== QUERY PLAN RECEIVED BY ADAPTER ==========")
        pprint(plan)

        print("\n========== DATASET SECTION ==========")
        pprint(plan.get("dataset"))

        return {
            "operation": "aggregate",
            "buckets": [],
            "execution_time_ms": 0.0,
            "total_records": 0,
            "warnings": [],
        }


def main():
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
        ),
        limit=10,
    )

    resolved_request = resolve_analytics_request(request)

    print("========== RESOLVED REQUEST DATASET ==========")
    pprint(resolved_request["dataset"])

    execute_analytics_query(
        resolved_request=resolved_request,
        adapter=FakeAdapter(),
    )


if __name__ == "__main__":
    main()