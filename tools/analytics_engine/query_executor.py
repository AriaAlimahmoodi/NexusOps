from __future__ import annotations

from copy import deepcopy
from typing import Any

from tools.analytics_engine.filter_builder import (
    FilterPlanBuilder,
)
from tools.analytics_engine.aggregation_builder import (
    AggregationPlanBuilder,
)


class QueryExecutionError(ValueError):
    """Raised when a resolved analytics request cannot be executed."""


class QueryExecutor:
    """
    Coordinates backend-independent query plans and delegates
    execution to the appropriate data-source adapter.

    This class does not generate backend-specific queries.
    """

    def __init__(
        self,
        adapter: Any,
        filter_builder: FilterPlanBuilder | None = None,
        aggregation_builder: AggregationPlanBuilder | None = None,
    ):
        if adapter is None or not callable(
            getattr(adapter, "execute", None)
        ):
            raise QueryExecutionError(
                "Adapter must provide a callable execute(plan) method."
            )

        self.adapter = adapter

        self.filter_builder = (
            filter_builder or FilterPlanBuilder()
        )

        self.aggregation_builder = (
            aggregation_builder or AggregationPlanBuilder()
        )

    def execute(
        self,
        resolved_request: dict[str, Any],
    ) -> Any:

        if not isinstance(resolved_request, dict):
            raise QueryExecutionError(
                "Resolved request must be an object."
            )

        dataset = resolved_request.get("dataset")

        if not isinstance(dataset, dict):
            raise QueryExecutionError(
                "Resolved request must contain dataset information."
            )

        dataset_id = dataset.get("dataset_id")
        index = dataset.get("index")
        source_type = dataset.get("source_type")

        if not isinstance(dataset_id, str) or not dataset_id.strip():
            raise QueryExecutionError(
                "Dataset ID is missing or invalid."
            )

        if not isinstance(index, str) or not index.strip():
            raise QueryExecutionError(
                "Dataset index is missing or invalid."
            )

        if not isinstance(source_type, str) or not source_type.strip():
            raise QueryExecutionError(
                "Dataset source type is missing or invalid."
            )

        if dataset.get("schema_consistent") is not True:
            raise QueryExecutionError(
                "Dataset schema is not consistent. Execution rejected."
            )

        operation = resolved_request.get("operation")

        if hasattr(operation, "value"):
            operation = operation.value

        if operation not in {"select", "count", "aggregate"}:
            raise QueryExecutionError(
        f"Unsupported execution operation: {operation!r}."
        )

        # Build the backend-independent filter plan.
        filter_plan = self.filter_builder.build(
            resolved_request.get("filters")
        )

        # Common metadata shared by all adapters.
        query_plan = {
        "plan_version": "1.0",
        "dataset": {
        "dataset_id": dataset["dataset_id"],
        "index": dataset["index"],
        "source_type": dataset["source_type"],
        "schema_consistent": dataset["schema_consistent"],
        },
        "operation": operation,
        "filters": filter_plan,
        "options": resolved_request.get("options", {}),
       }
        if operation == "select":
          query_plan["sort"] = [
        {
            "field": item["field"],
            "order": item["order"],
        }
        for item in resolved_request.get("sort", [])
    ]

        query_plan["limit"] = resolved_request.get("limit", 10)


        
        if operation == "aggregate":

            aggregation_plan = self.aggregation_builder.build(
                resolved_request
            )

            if aggregation_plan["dataset_id"] != dataset_id:
                raise QueryExecutionError(
                    "Aggregation plan dataset does not match "
                    "the resolved dataset."
                )

            query_plan["aggregation"] = aggregation_plan

        # Delegate execution to the adapter.
        # Backend-specific implementation belongs there.
        return self.adapter.execute(query_plan)


def execute_analytics_query(
    resolved_request: dict[str, Any],
    adapter: Any,
) -> Any:

    executor = QueryExecutor(adapter)
    return executor.execute(resolved_request)
