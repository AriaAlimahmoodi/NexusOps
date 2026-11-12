from __future__ import annotations

import logging
from time import perf_counter
from typing import Any

from config import get_elasticsearch_client

logger = logging.getLogger("nexusops.analytics.elasticsearch")


class ElasticsearchAdapterError(Exception):
    """Raised when Elasticsearch adapter cannot execute or normalize a plan."""

    def __init__(self, message: str, *, details: dict[str, Any] | None = None):
        super().__init__(message)
        self.details = details or {}


class ElasticsearchAdapter:
    """
    Translates backend-neutral analytics plans into Elasticsearch requests.

    Expected input:
        {
            "plan_version": "1.0",
            "dataset": {
                "dataset_id": "...",
                "index": "...",
                "source_type": "elasticsearch",
                "schema_consistent": True
            },
            "operation": "select" | "count" | "aggregate",
            "filters": FilterPlan | None,
            "options": {},
            "aggregation": AggregationPlan  # aggregate only
        }

    The adapter returns normalized data. It never exposes Elasticsearch DSL
    in its response.
    """

    SUPPORTED_METRICS = {
        "value_count",
        "sum",
        "avg",
        "min",
        "max",
        "cardinality",
    }

    SUPPORTED_FILTER_OPERATORS = {
        "eq",
        "neq",
        "in",
        "not_in",
        "gt",
        "gte",
        "lt",
        "lte",
        "between",
        "exists",
        "not_exists",
    }

    def __init__(self, client: Any | None = None):
        # Dependency injection allows tests to use a fake Elasticsearch client.
        self.client = client if client is not None else get_elasticsearch_client()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def execute(self, query_plan: dict[str, Any]) -> dict[str, Any]:
        """
        Execute a backend-neutral query plan.

        Returns either:
            Count:
                {
                    "operation": "count",
                    "count": int,
                    "execution_time_ms": float,
                    "warnings": []
                }

            Aggregate:
                {
                    "operation": "aggregate",
                    "buckets": [...],
                    "execution_time_ms": float,
                    "total_records": None,
                    "warnings": []
                }
        """
        self._validate_query_plan(query_plan)

        dataset = query_plan["dataset"]
        index = dataset["index"]
        operation = query_plan["operation"]

        query = self._build_query(query_plan.get("filters"))

        started_at = perf_counter()

        try:
            if operation == "select":
                response = self._execute_select(
                    index=index,
                    query=query,
                    sort=query_plan.get("sort", []),
                    limit=query_plan.get("limit", 10),
                )

                elapsed_ms = (perf_counter() - started_at) * 1000

                return self._normalize_select_response(
                    response=response,
                    execution_time_ms=elapsed_ms,
                )

            if operation == "count":
                response = self.client.count(
                    index=index,
                    query=query,
                )

                elapsed_ms = (perf_counter() - started_at) * 1000

                body = self._response_body(response)

                return {
                    "operation": "count",
                    "count": int(body.get("count", 0)),
                    "execution_time_ms": elapsed_ms,
                    "warnings": [],
                }

            response = self._execute_aggregation(
                index=index,
                query=query,
                aggregation_plan=query_plan["aggregation"],
            )

            elapsed_ms = (perf_counter() - started_at) * 1000

            return self._normalize_aggregation_response(
                response=response,
                aggregation_plan=query_plan["aggregation"],
                execution_time_ms=elapsed_ms,
            )

        except ElasticsearchAdapterError:
            raise
        except Exception as exc:
            meta = getattr(exc, "meta", None)
            status_code = getattr(meta, "status", None)
            if status_code is None:
                status_code = getattr(exc, "status_code", None)

            error_body = getattr(exc, "body", None)
            if error_body is None:
                error_body = getattr(exc, "info", None)

            details = {
                "request": {
                    "index": index,
                    "operation": operation,
                    "query": query,
                },
                "elasticsearch": {
                    "exception_type": type(exc).__name__,
                    "status_code": status_code,
                    "body": self._json_safe(error_body),
                },
            }
            if operation == "aggregate":
                details["request"]["aggregation_plan"] = self._json_safe(
                    query_plan.get("aggregation")
                )
                try:
                    details["request"]["aggregations"] = self._json_safe(
                        self._build_aggregations(query_plan["aggregation"])
                    )
                except Exception:
                    # Keep the original backend-neutral plan if DSL
                    # reconstruction itself is not possible here.
                    pass
            elif operation == "select":
                details["request"]["sort"] = self._json_safe(
                    query_plan.get("sort", [])
                )
                details["request"]["size"] = query_plan.get("limit", 10)

            logger.exception(
                "Elasticsearch analytics request failed",
                extra={
                    "index": index,
                    "operation": operation,
                    "status_code": status_code,
                    "query": query,
                },
            )
            raise ElasticsearchAdapterError(
                f"Elasticsearch execution failed: {type(exc).__name__}: {exc}",
                details=details,
            ) from exc

    # ------------------------------------------------------------------
    # Query plan validation
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_query_plan(query_plan: dict[str, Any]) -> None:
        if not isinstance(query_plan, dict):
            raise ElasticsearchAdapterError("Query plan must be a dictionary.")

        dataset = query_plan.get("dataset")

        if not isinstance(dataset, dict):
            raise ElasticsearchAdapterError("Dataset information is missing.")

        if not dataset.get("dataset_id"):
            raise ElasticsearchAdapterError("dataset_id is missing.")

        if not dataset.get("index"):
            raise ElasticsearchAdapterError("Elasticsearch index is missing.")

        if dataset.get("source_type") != "elasticsearch":
            raise ElasticsearchAdapterError(
                "This adapter only supports Elasticsearch datasets."
            )

        if dataset.get("schema_consistent") is not True:
            raise ElasticsearchAdapterError(
                "Dataset schema is not confirmed as consistent."
            )

        operation = query_plan.get("operation")

        if operation not in {"select", "count", "aggregate"}:
            raise ElasticsearchAdapterError(
                f"Unsupported operation: {operation}"
            )

        if operation == "select":
            sort = query_plan.get("sort", [])
            limit = query_plan.get("limit", 10)

            if not isinstance(sort, list):
                raise ElasticsearchAdapterError(
                    "SELECT sort must be a list."
                )

            if (
                not isinstance(limit, int)
                or isinstance(limit, bool)
                or limit < 1
            ):
                raise ElasticsearchAdapterError(
                    "SELECT limit must be a positive integer."
                )

            for sort_spec in sort:
                if not isinstance(sort_spec, dict):
                    raise ElasticsearchAdapterError(
                        "Each SELECT sort specification must be an object."
                    )

                field = sort_spec.get("field")
                order = sort_spec.get("order")

                if not isinstance(field, str) or not field.strip():
                    raise ElasticsearchAdapterError(
                        "SELECT sort field must be a non-empty string."
                    )

                if order not in {"asc", "desc"}:
                    raise ElasticsearchAdapterError(
                        "SELECT sort order must be 'asc' or 'desc'."
                    )

        if operation == "aggregate":
            aggregation = query_plan.get("aggregation")

            if not isinstance(aggregation, dict):
                raise ElasticsearchAdapterError(
                    "Aggregation plan is missing."
                )

            if aggregation.get("dataset_id") != dataset["dataset_id"]:
                raise ElasticsearchAdapterError(
                    "Dataset ID mismatch between query and aggregation plans."
                )

    # ------------------------------------------------------------------
    # Filter translation
    # ------------------------------------------------------------------

    def _build_query(self, filter_plan: dict[str, Any] | None) -> dict[str, Any]:
        if filter_plan is None:
            return {"match_all": {}}

        return self._build_filter_node(filter_plan)

    def _build_filter_node(self, node: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(node, dict):
            raise ElasticsearchAdapterError("Invalid filter node.")

        node_type = node.get("node_type")

        if node_type == "group":
            logic = node.get("logic")
            children = node.get("children")

            if logic not in {"and", "or"}:
                raise ElasticsearchAdapterError(
                    f"Unsupported filter logic: {logic}"
                )

            if not isinstance(children, list) or not children:
                raise ElasticsearchAdapterError(
                    "Filter group must contain at least one child."
                )

            child_queries = [
                self._build_filter_node(child)
                for child in children
            ]

            if logic == "and":
                return {
                    "bool": {
                        "filter": child_queries
                    }
                }

            return {
                "bool": {
                    "should": child_queries,
                    "minimum_should_match": 1,
                }
            }

        if node_type == "condition":
            return self._build_filter_condition(node)

        raise ElasticsearchAdapterError(
            f"Unsupported filter node type: {node_type}"
        )

    def _build_filter_condition(self, condition: dict[str, Any]) -> dict[str, Any]:
        field_info = condition.get("field")

        if not isinstance(field_info, dict) or not field_info.get("name"):
            raise ElasticsearchAdapterError("Filter field is missing.")

        field = field_info["name"]
        operator = condition.get("operator")
        value = condition.get("value")

        if operator not in self.SUPPORTED_FILTER_OPERATORS:
            raise ElasticsearchAdapterError(
                f"Unsupported filter operator: {operator}"
            )

        if operator == "eq":
            return {"term": {field: value}}

        if operator == "neq":
            return {
                "bool": {
                    "must_not": [
                        {"term": {field: value}}
                    ]
                }
            }

        if operator == "in":
            if not isinstance(value, (list, tuple)) or not value:
                raise ElasticsearchAdapterError(
                    "'in' operator requires a non-empty list."
                )
            return {"terms": {field: list(value)}}

        if operator == "not_in":
            if not isinstance(value, (list, tuple)) or not value:
                raise ElasticsearchAdapterError(
                    "'not_in' operator requires a non-empty list."
                )
            return {
                "bool": {
                    "must_not": [
                        {"terms": {field: list(value)}}
                    ]
                }
            }

        if operator in {"gt", "gte", "lt", "lte"}:
            return {
                "range": {
                    field: {
                        operator: value
                    }
                }
            }

        if operator == "between":
            if isinstance(value, dict):
                lower = value.get("gte")
                upper = value.get("lte")
            elif isinstance(value, (list, tuple)) and len(value) == 2:
                lower, upper = value
            else:
                raise ElasticsearchAdapterError(
                    "'between' requires [lower, upper] or "
                    "{'gte': lower, 'lte': upper}."
                )

            if lower is None or upper is None:
                raise ElasticsearchAdapterError(
                    "'between' requires both boundaries."
                )

            if lower > upper:
                raise ElasticsearchAdapterError(
                    "'between' lower boundary cannot exceed upper boundary."
                )

            return {
                "range": {
                    field: {
                        "gte": lower,
                        "lte": upper,
                    }
                }
            }

        if operator == "exists":
            return {"exists": {"field": field}}

        if operator == "not_exists":
            return {
                "bool": {
                    "must_not": [
                        {"exists": {"field": field}}
                    ]
                }
            }

        raise ElasticsearchAdapterError(
            f"Filter operator was not implemented: {operator}"
        )



    # ------------------------------------------------------------------
    # SELECT request execution
    # ------------------------------------------------------------------

    def _execute_select(
        self,
        index: str,
        query: dict[str, Any],
        sort: list[dict[str, Any]],
        limit: int,
    ) -> dict[str, Any]:
        es_sort = []

        for sort_spec in sort:
            field = sort_spec["field"]
            order = sort_spec["order"]

            es_sort.append(
                {
                    field: {
                        "order": order
                    }
                }
            )

        search_kwargs: dict[str, Any] = {
            "index": index,
            "query": query,
            "size": limit,
        }

        if es_sort:
            search_kwargs["sort"] = es_sort

        response = self.client.search(**search_kwargs)

        return self._response_body(response)

    def _normalize_select_response(
        self,
        response: dict[str, Any],
        execution_time_ms: float,
    ) -> dict[str, Any]:

        hits = response.get("hits", {})

        raw_hits = hits.get("hits", [])

        if not isinstance(raw_hits, list):
            raise ElasticsearchAdapterError(
                "Unexpected SELECT response: hits.hits must be a list."
            )

        records: list[dict[str, Any]] = []

        for hit in raw_hits:
            if not isinstance(hit, dict):
                continue

            source = hit.get("_source", {})

            if not isinstance(source, dict):
                source = {}

            records.append(source)

        warnings: list[str] = []

        if response.get("timed_out"):
            warnings.append(
                "Elasticsearch reported a timed-out search."
            )

        failed_shards = (
            response.get("_shards", {}).get("failed", 0)
        )

        if failed_shards:
            warnings.append(
                f"Elasticsearch reported {failed_shards} failed shard(s)."
            )

        total_hits = hits.get("total", 0)

        if isinstance(total_hits, dict):
            total_records = int(total_hits.get("value", 0))
        else:
            total_records = int(total_hits)

        return {
            "operation": "select",
            "records": records,
            "returned_records": len(records),
            "total_records": total_records,
            "execution_time_ms": execution_time_ms,
            "warnings": warnings,
        }
    # ------------------------------------------------------------------
    # Aggregation request construction
    # ------------------------------------------------------------------

    def _execute_aggregation(
        self,
        index: str,
        query: dict[str, Any],
        aggregation_plan: dict[str, Any],
    ) -> dict[str, Any]:

        aggregations = self._build_aggregations(aggregation_plan)

        search_kwargs = {
            "index": index,
            "query": query,
            "size": 0,
            "aggs": aggregations,
        }
        # Scalar aggregate responses always expose document_count, so exact
        # hit tracking is required even when count_documents is not a metric.
        if not aggregation_plan.get("group_by"):
            search_kwargs["track_total_hits"] = True
        response = self.client.search(**search_kwargs)

        return self._response_body(response)

    def _build_aggregations(
        self,
        aggregation_plan: dict[str, Any],
    ) -> dict[str, Any]:

        group_by = aggregation_plan.get("group_by", [])
        metrics = aggregation_plan.get("metrics", [])
        limit = aggregation_plan.get("limit", 10)
        sort_specs = aggregation_plan.get("sort", [])

        if not isinstance(group_by, list):
            raise ElasticsearchAdapterError("group_by must be a list.")

        if not isinstance(metrics, list):
            raise ElasticsearchAdapterError("metrics must be a list.")

        if not isinstance(limit, int) or isinstance(limit, bool) or limit < 1:
            raise ElasticsearchAdapterError("Invalid aggregation limit.")

        metric_aggs = self._build_metric_aggregations(metrics)

        if not group_by:
            # Global metrics are attached to the query's matching documents.
            return metric_aggs

        return self._build_group_aggregation(
            group_by=group_by,
            metrics=metrics,
            metric_aggs=metric_aggs,
            sort_specs=sort_specs,
            limit=limit,
            level=0,
        )

    def _build_group_aggregation(
        self,
        group_by: list[dict[str, Any]],
        metrics: list[dict[str, Any]],
        metric_aggs: dict[str, Any],
        sort_specs: list[dict[str, Any]],
        limit: int,
        level: int,
    ) -> dict[str, Any]:

        group = group_by[level]
        field = group.get("name")

        if not field:
            raise ElasticsearchAdapterError(
                "Group-by field name is missing."
            )

        aggregation_name = f"group_{level}"

        terms_aggregation: dict[str, Any] = {
            "terms": {
                "field": field,
                "size": limit,
            }
        }

        order = self._build_terms_order(
            sort_specs=sort_specs,
            group_by=group_by,
            metrics=metrics,
            level=level,
        )

        if order:
            terms_aggregation["terms"]["order"] = order

        if level + 1 < len(group_by):
            nested_aggs = self._build_group_aggregation(
                group_by=group_by,
                metrics=metrics,
                metric_aggs=metric_aggs,
                sort_specs=sort_specs,
                limit=limit,
                level=level + 1,
            )
        else:
            nested_aggs = metric_aggs

        if nested_aggs:
            terms_aggregation["aggs"] = nested_aggs

        return {
            aggregation_name: terms_aggregation
        }

    def _build_terms_order(
        self,
        sort_specs: list[dict[str, Any]],
        group_by: list[dict[str, Any]],
        metrics: list[dict[str, Any]],
        level: int,
    ) -> list[dict[str, str]] | None:

        current_field = group_by[level].get("name")
        order: list[dict[str, str]] = []

        for sort_spec in sort_specs:
            target = sort_spec.get("target")
            target_type = sort_spec.get("target_type")
            direction = sort_spec.get("order")

            if direction not in {"asc", "desc"}:
                raise ElasticsearchAdapterError(
                    f"Invalid sort direction: {direction}"
                )

            if target_type == "group_field" and target == current_field:
                order.append({"_key": direction})

            elif target_type in {"metric", "metric_alias"}:
                metric = next(
                    (item for item in metrics if item.get("alias") == target),
                    None,
                )
                if metric is None:
                    raise ElasticsearchAdapterError(
                        f"Unknown aggregation metric sort target: {target}"
                    )

                if metric.get("function") == "count_documents":
                    # count_documents is normalized from bucket doc_count;
                    # it has no named Elasticsearch aggregation to sort by.
                    # Sort the outer course/skill bucket using native _count.
                    if level == 0:
                        order.append({"_count": direction})
                    continue

                remaining_group_levels = len(group_by) - level - 1
                if remaining_group_levels == 0:
                    order.append({target: direction})
                else:
                    path = ">".join(
                        [
                            *[
                                f"group_{i}"
                                for i in range(level + 1, len(group_by))
                            ],
                            target,
                        ]
                    )
                    order.append({path: direction})

            elif target_type not in {"group_field", "metric", "metric_alias"}:
                raise ElasticsearchAdapterError(
                    f"Unsupported sort target type: {target_type}"
                )

        return order or None

    def _build_metric_aggregations(
        self,
        metrics: list[dict[str, Any]],
    ) -> dict[str, Any]:

        aggregations: dict[str, Any] = {}

        for metric in metrics:
            function = metric.get("function")
            alias = metric.get("alias")
            field_info = metric.get("field")

            if not alias:
                raise ElasticsearchAdapterError(
                    "Metric alias is missing."
                )

            if function == "count_documents":
                # Bucket document counts are already provided by Elasticsearch.
                continue

            if function not in self.SUPPORTED_METRICS:
                raise ElasticsearchAdapterError(
                    f"Unsupported metric function: {function}"
                )

            if not isinstance(field_info, dict) or not field_info.get("name"):
                raise ElasticsearchAdapterError(
                    f"Metric field is missing for '{alias}'."
                )

            field = field_info["name"]

            if alias in aggregations:
                raise ElasticsearchAdapterError(
                    f"Duplicate metric alias: {alias}"
                )

            if function == "value_count":
                aggregations[alias] = {
                    "value_count": {"field": field}
                }
            elif function == "cardinality":
                aggregations[alias] = {
                    "cardinality": {"field": field}
                }
            else:
                aggregations[alias] = {
                    function: {"field": field}
                }

        return aggregations

    # ------------------------------------------------------------------
    # Aggregation response normalization
    # ------------------------------------------------------------------

    def _normalize_aggregation_response(
        self,
        response: dict[str, Any],
        aggregation_plan: dict[str, Any],
        execution_time_ms: float,
    ) -> dict[str, Any]:

        aggregations = response.get("aggregations", {})
        group_by = aggregation_plan.get("group_by", [])
        metrics = aggregation_plan.get("metrics", [])

        warnings: list[str] = []
        if group_by:
            self._collect_terms_warnings(
                aggregation=aggregations.get("group_0", {}),
                level=0,
                group_count=len(group_by),
                warnings=warnings,
            )

        if response.get("timed_out"):
            warnings.append("Elasticsearch reported a timed-out search.")

        failed_shards = (
            response.get("_shards", {}).get("failed", 0)
        )
        if failed_shards:
            warnings.append(
                f"Elasticsearch reported {failed_shards} failed shard(s)."
            )

        if not group_by:
            hits_total = response.get("hits", {}).get("total", 0)

            if isinstance(hits_total, dict):
                document_count = hits_total.get("value", 0)
            else:
                document_count = hits_total

            normalized_metrics = self._normalize_metrics(
                aggregations=aggregations,
                metrics=metrics,
                document_count=document_count,
            )

            buckets = [
                {
                    "key": {},
                    "doc_count": int(document_count),
                    "metrics": normalized_metrics,
                }
            ]

            return {
                "operation": "aggregate",
                "buckets": buckets,
                "execution_time_ms": execution_time_ms,
                "total_records": 1,
                "warnings": warnings,
            }

        root_name = "group_0"
        root_aggregation = aggregations.get(root_name, {})
        root_buckets = root_aggregation.get("buckets", [])

        normalized_buckets: list[dict[str, Any]] = []

        self._flatten_buckets(
            buckets=root_buckets,
            group_by=group_by,
            metrics=metrics,
            level=0,
            current_group={},
            normalized_buckets=normalized_buckets,
            warnings=warnings,
        )

        return {
            "operation": "aggregate",
            "buckets": normalized_buckets,
            "execution_time_ms": execution_time_ms,
            "total_records": None,
            "warnings": warnings,
        }

    
    def _collect_terms_warnings(
        self,
        aggregation: dict[str, Any],
        level: int,
        group_count: int,
        warnings: list[str],
    ) -> None:

        omitted = aggregation.get("sum_other_doc_count", 0)

        if omitted:
            warnings.append(
                f"Group level {level + 1}: Elasticsearch omitted "
                f"documents from returned terms buckets "
                f"(sum_other_doc_count={omitted}). "
                f"Increase the aggregation limit or implement pagination."
            )

        if level + 1 >= group_count:
            return

        for bucket in aggregation.get("buckets", []):
            child_aggregation = bucket.get(f"group_{level + 1}", {})

            if child_aggregation:
                self._collect_terms_warnings(
                    aggregation=child_aggregation,
                    level=level + 1,
                    group_count=group_count,
                    warnings=warnings,
                )


    def _flatten_buckets(
        self,
        buckets: list[dict[str, Any]],
        group_by: list[dict[str, Any]],
        metrics: list[dict[str, Any]],
        level: int,
        current_group: dict[str, Any],
        normalized_buckets: list[dict[str, Any]],
        warnings: list[str],
    ) -> None:

        for bucket in buckets:
            group_field = group_by[level]["name"]

            group_values = {
                **current_group,
                group_field: bucket.get("key"),
            }

            if bucket.get("sum_other_doc_count", 0):
                # This field is normally present on the terms aggregation,
                # not on each bucket. The check is retained for compatible
                # response shapes; the parent check is performed below.
                pass

            if level + 1 < len(group_by):
                next_aggregation = bucket.get(f"group_{level + 1}", {})
                next_buckets = next_aggregation.get("buckets", [])

                self._flatten_buckets(
                    buckets=next_buckets,
                    group_by=group_by,
                    metrics=metrics,
                    level=level + 1,
                    current_group=group_values,
                    normalized_buckets=normalized_buckets,
                    warnings=warnings,
                )
            else:
                normalized_buckets.append(
                    {
                        "key": group_values,
                        "doc_count": int(bucket.get("doc_count", 0)),
                        "metrics": self._normalize_metrics(
                            aggregations=bucket,
                            metrics=metrics,
                            document_count=bucket.get("doc_count", 0),
                        ),
                    }
                )

    @staticmethod
    def _normalize_metrics(
        aggregations: dict[str, Any],
        metrics: list[dict[str, Any]],
        document_count: int,
    ) -> dict[str, Any]:

        normalized: dict[str, Any] = {}

        for metric in metrics:
            function = metric.get("function")
            alias = metric.get("alias")

            if not alias:
                continue

            if function == "count_documents":
                normalized[alias] = int(document_count)
                continue

            metric_result = aggregations.get(alias, {})
            normalized[alias] = metric_result.get("value")

        return normalized

    # ------------------------------------------------------------------
    # Response compatibility
    # ------------------------------------------------------------------

    @staticmethod
    def _json_safe(value: Any) -> Any:
        """Convert Elasticsearch error payloads into JSON-safe values."""
        if value is None or isinstance(value, (str, int, float, bool)):
            return value
        if isinstance(value, dict):
            return {
                str(key): ElasticsearchAdapter._json_safe(item)
                for key, item in value.items()
            }
        if isinstance(value, (list, tuple)):
            return [ElasticsearchAdapter._json_safe(item) for item in value]
        return str(value)

    @staticmethod
    def _response_body(response: Any) -> dict[str, Any]:
        """
        Elasticsearch Python client may return an ObjectApiResponse.
        Its body contains the regular response dictionary.
        """
        body = getattr(response, "body", response)

        if not isinstance(body, dict):
            try:
                body = dict(body)
            except (TypeError, ValueError) as exc:
                raise ElasticsearchAdapterError(
                    "Unexpected Elasticsearch response format."
                ) from exc

        return body
def _collect_terms_warnings(
    self,
    aggregation: dict[str, Any],
    level: int,
    group_count: int,
    warnings: list[str],
) -> None:

    omitted = aggregation.get("sum_other_doc_count", 0)

    if omitted:
        warnings.append(
            f"Group level {level + 1}: Elasticsearch omitted "
            f"documents from returned terms buckets "
            f"(sum_other_doc_count={omitted}). "
            f"Increase the aggregation limit or implement pagination."
        )

    if level + 1 >= group_count:
        return

    for bucket in aggregation.get("buckets", []):
        child_aggregation = bucket.get(f"group_{level + 1}", {})

        if child_aggregation:
            self._collect_terms_warnings(
                aggregation=child_aggregation,
                level=level + 1,
                group_count=group_count,
                warnings=warnings,
            )