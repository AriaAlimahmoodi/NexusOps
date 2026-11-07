
from __future__ import annotations

from typing import Any


# ============================================================
# 1. Exceptions
# ============================================================

class FilterPlanError(ValueError):
    """Raised when a resolved filter cannot become a valid plan."""


# ============================================================
# 2. Supported Operators
# ============================================================

SUPPORTED_OPERATORS = {
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

SUPPORTED_LOGIC = {
    "and",
    "or",
}


# ============================================================
# 3. Filter Plan Builder
# ============================================================

class FilterPlanBuilder:
    """
    Converts resolved filters into a backend-independent
    logical filter plan.

    This module does not generate Elasticsearch DSL.
    Backend-specific translation belongs to an adapter.
    """

    def build(
        self,
        resolved_filters: dict[str, Any] | None,
    ) -> dict[str, Any] | None:

        if resolved_filters is None:
            return None

        return self._build_node(resolved_filters)

    # ========================================================
    # 4. Build Filter Node
    # ========================================================

    def _build_node(
        self,
        node: dict[str, Any],
    ) -> dict[str, Any]:

        if not isinstance(node, dict):
            raise FilterPlanError(
                "Each filter node must be an object."
            )

        node_type = node.get("type")

        if node_type == "group":
            return self._build_group(node)

        if node_type == "condition":
            return self._build_condition(node)

        raise FilterPlanError(
            f"Unsupported filter node type: {node_type!r}."
        )

    # ========================================================
    # 5. Build Logical Group
    # ========================================================

    def _build_group(
        self,
        node: dict[str, Any],
    ) -> dict[str, Any]:

        logic = node.get("logic")
        conditions = node.get("conditions")

        if logic not in SUPPORTED_LOGIC:
            raise FilterPlanError(
                f"Unsupported filter logic: {logic!r}."
            )

        if not isinstance(conditions, list) or not conditions:
            raise FilterPlanError(
                "A filter group must contain a non-empty conditions list."
            )

        children = [
            self._build_node(condition)
            for condition in conditions
        ]

        return {
            "node_type": "group",
            "logic": logic,
            "children": children,
        }

    # ========================================================
    # 6. Build Individual Condition
    # ========================================================

    def _build_condition(
        self,
        node: dict[str, Any],
    ) -> dict[str, Any]:

        field = node.get("field")
        operator = node.get("operator")

        if not isinstance(field, dict):
            raise FilterPlanError(
                "Resolved filter field must be an object."
            )

        field_name = field.get("name")

        if not isinstance(field_name, str) or not field_name.strip():
            raise FilterPlanError(
                "Resolved filter field must have a valid name."
            )

        if operator not in SUPPORTED_OPERATORS:
            raise FilterPlanError(
                f"Unsupported filter operator: {operator!r}."
            )

        if operator in ("exists", "not_exists"):
            if "value" in node and node["value"] is not None:
                raise FilterPlanError(
                    f"Operator '{operator}' does not accept a value."
                )
            value = None

        else:
            if "value" not in node or node["value"] is None:
                raise FilterPlanError(
                    f"Operator '{operator}' requires a value."
                )

            value = node["value"]

        if operator in ("in", "not_in"):
            if not isinstance(value, list) or not value:
                raise FilterPlanError(
                    f"Operator '{operator}' requires a non-empty list."
                )

        if operator == "between":
            if not isinstance(value, list) or len(value) != 2:
                raise FilterPlanError(
                    "Operator 'between' requires exactly two values."
                )

        return {
            "node_type": "condition",
            "field": {
                "name": field_name,
                "profile_type": field.get("profile_type"),
                "actual_types": field.get("actual_types", []),
                "mapping_type": field.get("mapping_type"),
                "searchable": field.get("searchable", False),
            },
            "operator": operator,
            "value": value,
        }


# ============================================================
# 7. Convenience Function
# ============================================================

def build_filter_plan(
    resolved_filters: dict[str, Any] | None,
) -> dict[str, Any] | None:

    builder = FilterPlanBuilder()

    return builder.build(resolved_filters)
