from __future__ import annotations

from typing import Any
import logging

from tools.analytics_engine.aggregation_builder import AggregationPlanError
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
    SortOrder,
    SortSpec,
)
from tools.adapters.elasticsearch_adapter import ElasticsearchAdapter
from config import get_elasticsearch_client

logger = logging.getLogger("nexusops.analytics")


def _build_metrics(metrics: list[dict[str, Any]]) -> tuple[MetricSpec, ...]:
    result: list[MetricSpec] = []

    for metric in metrics:
        result.append(
            MetricSpec(
                function=MetricFunction(metric["function"]),
                field=metric.get("field"),
                alias=metric.get("alias"),
            )
        )

    return tuple(result)


def _build_filters(
    filters: dict[str, Any] | None,
) -> FilterGroup | None:
    if not filters:
        return None

    conditions = []

    for item in filters.get("conditions", []):
        conditions.append(
            FilterCondition(
                field=item["field"],
                operator=FilterOperator(item["operator"]),
                value=item.get("value"),
            )
        )

    for group in filters.get("groups", []):
        nested_group = _build_filters(group)

        if nested_group is not None:
            conditions.append(nested_group)

    # Do not create an empty FilterGroup.
    # An empty filter means that no filtering is required.
    if not conditions:
        return None

    return FilterGroup(
        logic=FilterLogic(filters.get("logic", "and")),
        conditions=tuple(conditions),
    )


def _build_sort(
    sort: list[dict[str, Any]],
) -> tuple[SortSpec, ...]:

    if not sort:
        return ()

    if not isinstance(sort, list):
        raise AggregationPlanError(
            "Sort must be a list."
        )

    result: list[SortSpec] = []

    for item in sort:

        if not isinstance(item, dict):
            raise AggregationPlanError(
                "Each sort item must be an object."
            )

        field = item.get("field")

        if not isinstance(field, str) or not field.strip():
            raise AggregationPlanError(
                "Sort field must be a non-empty string."
            )

        order = item.get("order", "desc")

        try:
            sort_order = SortOrder(order)

        except ValueError:
            raise AggregationPlanError(
                "Sort order must be 'asc' or 'desc'."
            ) from None

        result.append(
            SortSpec(
                field=field,
                order=sort_order,
            )
        )

    return tuple(result)


def build_analytics_request(arguments: dict[str, Any]) -> AnalyticsRequest:
    return AnalyticsRequest(
        dataset_id=arguments["dataset_id"],
        operation=AnalyticsOperation(arguments["operation"]),
        group_by=tuple(arguments.get("group_by", [])),
        metrics=_build_metrics(arguments.get("metrics", [])),
        filters=_build_filters(arguments.get("filters")),
        sort=_build_sort(arguments.get("sort", [])),
        limit=arguments.get("limit", 10),
        options=arguments.get("options", {}),
    )


def _analytics_error(
    code: str,
    message: str,
    *,
    stage: str,
    exception_type: str | None = None,
    details: dict[str, Any] | None = None,
) -> dict[str, Any]:
    error = {
        "code": code,
        "message": message,
        "stage": stage,
    }
    if exception_type:
        error["exception_type"] = exception_type
    if details:
        error.update(details)
    return {"status": "error", "error": error}


def run_analytics_query(arguments: dict[str, Any]) -> dict[str, Any]:
    """
    Execute an analytics request and keep every failure inside the
    standard response envelope. Invalid input, client initialization,
    service failures, and unexpected adapter errors must never escape
    as uncaught exceptions from the MCP tool.
    """
    try:
        request = build_analytics_request(arguments)
    except Exception as exc:
        return _analytics_error(
            "INVALID_ANALYTICS_REQUEST",
            str(exc),
            stage="request_validation",
            exception_type=type(exc).__name__,
        )

    client = None
    try:
        try:
            client = get_elasticsearch_client()
            adapter = ElasticsearchAdapter(client=client)
            service = AnalyticsService(adapter=adapter)
        except Exception as exc:
            return _analytics_error(
                "ANALYTICS_CLIENT_INITIALIZATION_FAILED",
                "Unable to initialize the Elasticsearch analytics client.",
                stage="client_initialization",
                exception_type=type(exc).__name__,
            )

        try:
            return service.analyze(request)
        except AnalyticsServiceError as exc:
            return _analytics_error(
                exc.code,
                str(exc),
                stage="analytics_service",
                details=exc.details,
            )
        except Exception as exc:
            return _analytics_error(
                "ANALYTICS_EXECUTION_FAILED",
                "The analytics operation could not be completed.",
                stage="execution",
                exception_type=type(exc).__name__,
            )
    finally:
        if client is not None:
            try:
                client.close()
            except Exception:
                logger.exception("Failed to close Elasticsearch analytics client")

