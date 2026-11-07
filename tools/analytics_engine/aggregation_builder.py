from __future__ import annotations

from copy import deepcopy
from typing import Any


class AggregationPlanError(ValueError):
    """Raised when a resolved aggregation request cannot become a valid plan."""


SUPPORTED_METRICS = {
    "count_documents",
    "value_count",
    "sum",
    "avg",
    "min",
    "max",
    "cardinality",
}

NUMERIC_METRICS = {"sum", "avg"}
FIELD_REQUIRED_METRICS = {
    "value_count",
    "sum",
    "avg",
    "min",
    "max",
    "cardinality",
}


class AggregationPlanBuilder:
    """
    Converts a resolved analytics request into a backend-independent
    aggregation plan.

    This module does not generate Elasticsearch DSL.
    Backend-specific translation belongs to an adapter.
    """

    def build(self, resolved_request: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(resolved_request, dict):
            raise AggregationPlanError(
                "Resolved request must be an object."
            )

        operation = resolved_request.get("operation")

        if operation != "aggregate":
            raise AggregationPlanError(
                "Aggregation Builder only supports the 'aggregate' operation."
            )

        group_by = self._build_group_by(
            resolved_request.get("group_by")
        )

        metrics = self._build_metrics(
            resolved_request.get("metrics")
        )

        sort = self._build_sort(
            resolved_request.get("sort", []),
            group_by,
            metrics,
        )

        limit = resolved_request.get("limit")

        if (
            isinstance(limit, bool)
            or not isinstance(limit, int)
            or not 1 <= limit <= 1000
        ):
            raise AggregationPlanError(
                "Aggregation limit must be an integer between 1 and 1000."
            )
        dataset_info = resolved_request.get("dataset", {})

        if not isinstance(dataset_info, dict):
            raise AggregationPlanError(
                "Resolved dataset information must be an object."
            )

        dataset_id = (
            resolved_request.get("dataset_id")
            or dataset_info.get("dataset_id")
        )

        if not isinstance(dataset_id, str) or not dataset_id.strip():
            raise AggregationPlanError(
                "Resolved request must contain a valid dataset_id."
            )
        return {
            "dataset_id": dataset_id,
            "group_by": group_by,
            "metrics": metrics,
            "sort": sort,
            "limit": limit,
            "options": deepcopy(
                resolved_request.get("options", {})
            ),
        }

    def _build_group_by(
        self,
        group_by: Any,
    ) -> list[dict[str, Any]]:

        if not isinstance(group_by, list) or not group_by:
            raise AggregationPlanError(
                "Aggregate operation requires a non-empty group_by list."
            )

        result = []
        seen_fields = set()

        for item in group_by:
            if not isinstance(item, dict):
                raise AggregationPlanError(
                    "Each resolved group_by field must be an object."
                )

            name = item.get("name")

            if not isinstance(name, str) or not name.strip():
                raise AggregationPlanError(
                    "Each group_by field must have a valid name."
                )

            if name in seen_fields:
                raise AggregationPlanError(
                    f"Duplicate group_by field: {name!r}."
                )

            if item.get("aggregatable") is False:
                raise AggregationPlanError(
                    f"Field {name!r} is not aggregatable."
                )

            seen_fields.add(name)

            result.append({
                "name": name,
                "profile_type": item.get("profile_type"),
                "actual_types": deepcopy(
                    item.get("actual_types", [])
                ),
                "mapping_type": item.get("mapping_type"),
            })

        return result

    
    def _build_metrics(
        self,
        metrics: Any,
    ) -> list[dict[str, Any]]:

        if not isinstance(metrics, list) or not metrics:
            raise AggregationPlanError(
                "Aggregate operation requires a non-empty metrics list."
            )

        result = []
        seen_aliases = set()

        for metric in metrics:
            if not isinstance(metric, dict):
                raise AggregationPlanError(
                    "Each resolved metric must be an object."
                )

            function = metric.get("function")

            if hasattr(function, "value"):
                function = function.value

            if function not in SUPPORTED_METRICS:
                raise AggregationPlanError(
                    f"Unsupported metric function: {function!r}."
                )

            field = metric.get("field")

            if function in FIELD_REQUIRED_METRICS:
                if not isinstance(field, dict):
                    raise AggregationPlanError(
                        f"Metric '{function}' requires a resolved field."
                    )

                field_name = field.get("name")

                if (
                    not isinstance(field_name, str)
                    or not field_name.strip()
                ):
                    raise AggregationPlanError(
                        f"Metric '{function}' has an invalid field name."
                    )

                if field.get("aggregatable") is False:
                    raise AggregationPlanError(
                        f"Metric field {field_name!r} is not aggregatable."
                    )

                if (
                    function in NUMERIC_METRICS
                    and field.get("actual_types")
                    and not set(field["actual_types"]).intersection(
                        {
                            "integer", "long", "short", "byte",
                            "float", "double", "half_float",
                            "scaled_float", "unsigned_long",
                        }
                    )
                ):
                    raise AggregationPlanError(
                        f"Metric '{function}' requires a numeric field."
                    )

                normalized_field = {
                    "name": field_name,
                    "profile_type": field.get("profile_type"),
                    "actual_types": deepcopy(
                        field.get("actual_types", [])
                    ),
                    "mapping_type": field.get("mapping_type"),
                }

                default_alias = f"{function}_{field_name}"

            else:
                if field is not None:
                    raise AggregationPlanError(
                        "count_documents does not accept a field."
                    )

                normalized_field = None
                default_alias = "document_count"

            alias = metric.get("alias")

            if alias is None:
                alias = default_alias

            if not isinstance(alias, str) or not alias.strip():
                raise AggregationPlanError(
                    "Each metric must have a valid alias."
                )

            if alias in seen_aliases:
                raise AggregationPlanError(
                    f"Duplicate metric alias: {alias!r}."
                )

            seen_aliases.add(alias)

            result.append({
                "function": function,
                "field": normalized_field,
                "alias": alias,
            })

        return result


    def _build_sort(
        self,
        sort: Any,
        group_by: list[dict[str, Any]],
        metrics: list[dict[str, Any]],
    ) -> list[dict[str, str]]:

        if sort is None:
            return []

        if not isinstance(sort, list):
            raise AggregationPlanError(
                "Sort must be a list."
            )

        group_fields = {
            item["name"]
            for item in group_by
        }

        metric_aliases = {
            item["alias"]
            for item in metrics
        }

        result = []
        seen_targets = set()

        for item in sort:

            if not isinstance(item, dict):
                raise AggregationPlanError(
                    "Each sort item must be an object."
                )

            order = item.get("order")

            if order not in {"asc", "desc"}:
                raise AggregationPlanError(
                    "Sort order must be 'asc' or 'desc'."
                )

            field_type = item.get("field_type")

            if field_type == "group_by":

                field = item.get("field")

                if not isinstance(field, dict):
                    raise AggregationPlanError(
                        "Group-by sort item must contain "
                        "a resolved field."
                    )

                target = field.get("name")

                if not isinstance(target, str) or not target.strip():
                    raise AggregationPlanError(
                        "Group-by sort field must have "
                        "a valid name."
                    )

                if target not in group_fields:
                    raise AggregationPlanError(
                        f"Unknown aggregation sort target: {target!r}."
                    )

                target_type = "group_field"

            elif field_type == "metric":

                target = item.get("alias")

                if not isinstance(target, str) or not target.strip():
                    raise AggregationPlanError(
                        "Metric sort item must contain "
                        "a valid metric alias."
                    )

                if target not in metric_aliases:
                    raise AggregationPlanError(
                        f"Unknown aggregation sort target: {target!r}."
                    )

                target_type = "metric"

            else:

                raise AggregationPlanError(
                    "Sort item must identify either a group_by "
                    "field or a metric alias."
                )

            if target in seen_targets:

                raise AggregationPlanError(
                    f"Duplicate sort target: {target!r}."
                )

            seen_targets.add(target)

            result.append(
                {
                    "target_type": target_type,
                    "target": target,
                    "order": order,
                }
            )

        return result


def build_aggregation_plan(
    resolved_request: dict[str, Any],
) -> dict[str, Any]:

    builder = AggregationPlanBuilder()
    return builder.build(resolved_request)
