
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from tools.dataset_registry import get_dataset_profile
from tools.datasets.schema_discovery import discover_dataset_schema

from tools.analytics_engine.models import (
    AnalyticsRequest,
    AnalyticsOperation,
    FilterCondition,
    FilterGroup,
)


# ============================================================
# 1. Exceptions
# ============================================================

class FieldResolutionError(ValueError):
    """Raised when a requested field cannot be resolved."""


# ============================================================
# 2. Resolved Field Model
# ============================================================

@dataclass(frozen=True)
class ResolvedField:
    name: str
    profile_type: str | None
    actual_types: tuple[str, ...]
    mapping_type: str | None
    roles: tuple[str, ...]
    searchable: bool
    aggregatable: bool
    type_conflict: bool

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "profile_type": self.profile_type,
            "actual_types": list(self.actual_types),
            "mapping_type": self.mapping_type,
            "roles": list(self.roles),
            "searchable": self.searchable,
            "aggregatable": self.aggregatable,
            "type_conflict": self.type_conflict,
        }


# ============================================================
# 3. Field Resolver
# ============================================================

class FieldResolver:
    """
    Resolves logical field names using Dataset Registry
    and the actual discovered dataset schema.

    The resolver does not build Elasticsearch queries.
    It provides normalized field metadata for later modules.
    """

    def __init__(self, dataset_id: str):
        if not isinstance(dataset_id, str) or not dataset_id.strip():
            raise FieldResolutionError(
                "dataset_id must be a non-empty string."
            )

        self.dataset_id = dataset_id.strip()

        try:
            self.profile = get_dataset_profile(self.dataset_id)
        except (ValueError, KeyError) as exc:
            raise FieldResolutionError(
                f"Unknown dataset '{self.dataset_id}': {exc}"
            ) from None

        try:
            self.schema = discover_dataset_schema(self.dataset_id)
        except Exception as exc:
            raise FieldResolutionError(
                "Unable to discover dataset schema. "
                f"{type(exc).__name__}: {exc}"
            ) from None

        self.profile_fields = self.profile.get("fields", {})
        self.actual_fields = self.schema.get("actual_fields", {})

        if not self.actual_fields:
            raise FieldResolutionError(
                f"Dataset '{self.dataset_id}' has no discoverable fields."
            )

    # ========================================================
    # 4. Resolve One Field
    # ========================================================

    def resolve_field(
        self,
        field_name: str,
        required_role: str | None = None,
    ) -> ResolvedField:

        if not isinstance(field_name, str) or not field_name.strip():
            raise FieldResolutionError(
                "field_name must be a non-empty string."
            )

        field_name = field_name.strip()

        profile_definition = self.profile_fields.get(field_name)

        if profile_definition is None:
            raise FieldResolutionError(
                f"Field '{field_name}' is not registered "
                f"in dataset '{self.dataset_id}'."
            )

        actual_definition = self.actual_fields.get(field_name)

        if actual_definition is None:
            raise FieldResolutionError(
                f"Field '{field_name}' is registered in the profile "
                "but does not exist in the actual dataset schema."
            )

        roles = tuple(profile_definition.get("roles", []))

        if required_role is not None and required_role not in roles:
            raise FieldResolutionError(
                f"Field '{field_name}' does not support "
                f"the role '{required_role}'. "
                f"Available roles: {list(roles)}."
            )

        actual_types = tuple(actual_definition.get("types", []))

        return ResolvedField(
            name=field_name,
            profile_type=profile_definition.get("type"),
            actual_types=actual_types,
            mapping_type=actual_definition.get("mapping_type"),
            roles=roles,
            searchable=actual_definition.get("searchable", False),
            aggregatable=actual_definition.get("aggregatable", False),
            type_conflict=actual_definition.get("type_conflict", False),
        )

    # ========================================================
    # 5. Resolve Filter Tree
    # ========================================================

    def _resolve_filter(
        self,
        node: FilterGroup | FilterCondition,
    ) -> dict[str, Any]:

        if isinstance(node, FilterCondition):
            resolved_field = self.resolve_field(
                node.field,
                required_role="filter",
            )

            return {
                "type": "condition",
                "field": resolved_field.to_dict(),
                "operator": node.operator.value,
                "value": node.value,
            }

        if isinstance(node, FilterGroup):
            return {
                "type": "group",
                "logic": node.logic.value,
                "conditions": [
                    self._resolve_filter(condition)
                    for condition in node.conditions
                ],
            }

        raise FieldResolutionError(
            f"Unsupported filter node: {type(node).__name__}."
        )

    # ========================================================
    # 6. Resolve Complete Analytics Request
    # ========================================================

    def resolve_request(
        self,
        request: AnalyticsRequest,
    ) -> dict[str, Any]:

        if not isinstance(request, AnalyticsRequest):
            raise FieldResolutionError(
                "Input must be an AnalyticsRequest object."
            )

        if request.dataset_id != self.dataset_id:
            raise FieldResolutionError(
                f"Resolver dataset '{self.dataset_id}' does not match "
                f"request dataset '{request.dataset_id}'."
            )

        # ----------------------------------------------------
        # A. Resolve group_by fields
        # ----------------------------------------------------

        resolved_group_by = [
            self.resolve_field(
                field_name,
                required_role="group_by",
            ).to_dict()
            for field_name in request.group_by
        ]

        # ----------------------------------------------------
        # B. Resolve metrics
        # ----------------------------------------------------

        resolved_metrics = []

        for metric in request.metrics:
            resolved_field = None

            if metric.field is not None:
                resolved_field = self.resolve_field(
                    metric.field,
                    required_role="metric",
                ).to_dict()

            resolved_metrics.append({
                "function": metric.function.value,
                "field": resolved_field,
                "alias": metric.alias,
            })

        # ----------------------------------------------------
        # C. Resolve filters
        # ----------------------------------------------------

        resolved_filters = (
            self._resolve_filter(request.filters)
            if request.filters is not None
            else None
        )

        # ----------------------------------------------------
        # D. Resolve sorting
        # ----------------------------------------------------

        resolved_sort = []

        if request.sort:

            # ========================================================
            # SELECT
            # --------------------------------------------------------
            # SELECT sorts directly on an actual dataset field.
            # ========================================================

            if request.operation == AnalyticsOperation.SELECT:

                for sort_item in request.sort:
                    resolved_field = self.resolve_field(
                        sort_item.field,
                        required_role="sort",
                    )

                    if not resolved_field.aggregatable:
                        raise FieldResolutionError(
                            f"Field '{sort_item.field}' cannot be used "
                            "for sorting because it is not aggregatable "
                            "in the actual dataset schema."
                        )

                    resolved_sort.append(
                        {
                            "field": resolved_field.name,
                            "order": sort_item.order.value,
                            "field_type": "dataset_field",
                            "mapping_type": resolved_field.mapping_type,
                        }
                    )

            # ========================================================
            # AGGREGATE
            # --------------------------------------------------------
            # Aggregate sorting keeps the existing semantic:
            # - group_by field
            # - metric alias
            # ========================================================

            elif request.operation == AnalyticsOperation.AGGREGATE:

                metric_aliases = {
                    metric.alias
                    for metric in request.metrics
                    if metric.alias is not None
                }

                group_fields = set(request.group_by)

                for sort_item in request.sort:

                    if sort_item.field in group_fields:

                        resolved_field = self.resolve_field(
                            sort_item.field,
                            required_role="group_by",
                        )

                        resolved_sort.append(
                            {
                                "field": resolved_field.name,
                                "order": sort_item.order.value,
                                "field_type": "group_by",
                                "mapping_type": resolved_field.mapping_type,
                            }
                        )

                    
                    elif sort_item.field in metric_aliases:

                        resolved_sort.append(
                            {
                                "alias": sort_item.field,
                                "order": sort_item.order.value,
                                "field_type": "metric",
                            }
                        )


                    else:
                        raise FieldResolutionError(
                            f"Sort field '{sort_item.field}' must refer "
                            "to a group_by field or metric alias."
                        )

            # ========================================================
            # COUNT
            # --------------------------------------------------------
            # AnalyticsRequest already rejects sorting for COUNT.
            # This branch is defensive only.
            # ========================================================

            elif request.operation == AnalyticsOperation.COUNT:

                raise FieldResolutionError(
                    "'count' operation does not support sorting."
                )

        # ----------------------------------------------------
        # E. Return normalized request
        # ----------------------------------------------------

        return {
            "dataset": {
                "dataset_id": self.dataset_id,
                "index": self.profile.get("index"),
                "source_type": self.profile.get("source_type"),
                "schema_consistent": self.schema.get(
                    "schema_consistent",
                    False,
                ),
            },
            "operation": request.operation.value,
            "group_by": resolved_group_by,
            "metrics": resolved_metrics,
            "filters": resolved_filters,
            "sort": resolved_sort,
            "limit": request.limit,
            "options": request.options,
        }


# ============================================================
# 7. Convenience Functions
# ============================================================

def resolve_field(
    dataset_id: str,
    field_name: str,
    required_role: str | None = None,
) -> ResolvedField:

    resolver = FieldResolver(dataset_id)

    return resolver.resolve_field(
        field_name=field_name,
        required_role=required_role,
    )


def resolve_analytics_request(
    request: AnalyticsRequest,
) -> dict[str, Any]:

    resolver = FieldResolver(request.dataset_id)

    return resolver.resolve_request(request)
