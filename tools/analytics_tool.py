from __future__ import annotations

from typing import Any

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


def run_analytics_query(arguments: dict[str, Any]) -> dict[str, Any]:
    client = get_elasticsearch_client()
    adapter = ElasticsearchAdapter(client=client)
    service = AnalyticsService(adapter=adapter)

    request = build_analytics_request(arguments)

    try:
        return service.analyze(request)

    except AnalyticsServiceError as exc:
        return {
            "status": "error",
            "error": {
                "code": exc.code,
                "message": str(exc),
                **exc.details,
            },
        }
    
