from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
import re
from typing import Any


# ============================================================
# 1. Constants and Enumerations
# ============================================================

class AnalyticsOperation(str, Enum):
    SELECT = "select"
    COUNT = "count"
    AGGREGATE = "aggregate"


class MetricFunction(str, Enum):
    COUNT_DOCUMENTS = "count_documents"
    VALUE_COUNT = "value_count"
    SUM = "sum"
    AVG = "avg"
    MIN = "min"
    MAX = "max"
    CARDINALITY = "cardinality"


class FilterOperator(str, Enum):
    EQ = "eq"
    NEQ = "neq"
    IN = "in"
    NOT_IN = "not_in"
    GT = "gt"
    GTE = "gte"
    LT = "lt"
    LTE = "lte"
    BETWEEN = "between"
    EXISTS = "exists"
    NOT_EXISTS = "not_exists"


class FilterLogic(str, Enum):
    AND = "and"
    OR = "or"


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


# ============================================================
# 2. Exceptions
# ============================================================

class AnalyticsModelError(ValueError):
    """Raised when an analytics model receives invalid data."""


# ============================================================
# 3. Shared Parsing Helpers
# ============================================================

def _require_dict(value: Any, name: str) -> dict:
    if not isinstance(value, dict):
        raise AnalyticsModelError(f"'{name}' must be an object.")
    return value


def _require_string(value: Any, name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise AnalyticsModelError(f"'{name}' must be a non-empty string.")
    return value.strip()


def _require_enum(enum_type: type[Enum], value: Any, name: str):
    try:
        return enum_type(value)
    except (ValueError, TypeError):
        allowed = ", ".join(item.value for item in enum_type)
        raise AnalyticsModelError(
            f"Invalid '{name}': {value!r}. Allowed values: {allowed}."
        ) from None


def _require_list(value: Any, name: str) -> list:
    if not isinstance(value, list):
        raise AnalyticsModelError(f"'{name}' must be a list.")
    return value


def _require_integer(value: Any, name: str) -> int:
    # bool is a subclass of int in Python; reject it explicitly.
    if isinstance(value, bool) or not isinstance(value, int):
        raise AnalyticsModelError(f"'{name}' must be an integer.")
    return value


# ============================================================
# 4. Metric Specification
# ============================================================

@dataclass(frozen=True)
class MetricSpec:
    function: MetricFunction
    field: str | None = None
    alias: str | None = None

    def __post_init__(self):
        if not isinstance(self.function, MetricFunction):
            raise AnalyticsModelError(
                "'function' must be a MetricFunction."
            )

        if self.field is not None:
            _require_string(self.field, "field")

        if self.alias is not None:
            _require_string(self.alias, "alias")
            if not re.fullmatch(r"[a-z][a-z0-9_]{0,63}", self.alias):
                raise AnalyticsModelError("Metric alias must match [a-z][a-z0-9_]{0,63}.")

        if self.function == MetricFunction.COUNT_DOCUMENTS:
            if self.field is not None:
                raise AnalyticsModelError(
                    "'count_documents' does not accept a field."
                )
        elif self.field is None:
            raise AnalyticsModelError(
                f"Metric '{self.function.value}' requires a field."
            )

    @classmethod
    def from_dict(cls, data: dict) -> MetricSpec:
        data = _require_dict(data, "metric")

        function = _require_enum(
            MetricFunction,
            data.get("function"),
            "metric.function",
        )

        field_name = data.get("field")
        alias = data.get("alias")

        if field_name is not None:
            field_name = _require_string(field_name, "metric.field")

        if alias is not None:
            alias = _require_string(alias, "metric.alias")

        return cls(
            function=function,
            field=field_name,
            alias=alias,
        )

    def to_dict(self) -> dict:
        result = {
            "function": self.function.value,
        }

        if self.field is not None:
            result["field"] = self.field

        if self.alias is not None:
            result["alias"] = self.alias

        return result


# ============================================================
# 5. Filter Models
# ============================================================

@dataclass(frozen=True)
class FilterCondition:
    field: str
    operator: FilterOperator
    value: Any = None

    def __post_init__(self):
        _require_string(self.field, "filter.field")

        if not isinstance(self.operator, FilterOperator):
            raise AnalyticsModelError(
                "'operator' must be a FilterOperator."
            )

        if self.operator in (
            FilterOperator.EXISTS,
            FilterOperator.NOT_EXISTS,
        ):
            if self.value is not None:
                raise AnalyticsModelError(
                    f"'{self.operator.value}' does not accept a value."
                )
            return

        if self.value is None:
            raise AnalyticsModelError(
                f"'{self.operator.value}' requires a value."
            )

        if self.operator in (
            FilterOperator.IN,
            FilterOperator.NOT_IN,
        ):
            if not isinstance(self.value, list) or not self.value:
                raise AnalyticsModelError(
                    f"'{self.operator.value}' requires a non-empty list."
                )

        if self.operator == FilterOperator.BETWEEN:
            if not isinstance(self.value, list) or len(self.value) != 2:
                raise AnalyticsModelError(
                    "'between' requires a list containing exactly two values."
                )

    @classmethod
    def from_dict(cls, data: dict) -> FilterCondition:
        data = _require_dict(data, "filter condition")

        return cls(
            field=_require_string(
                data.get("field"),
                "filter.field",
            ),
            operator=_require_enum(
                FilterOperator,
                data.get("operator"),
                "filter.operator",
            ),
            value=data.get("value"),
        )

    def to_dict(self) -> dict:
        result = {
            "field": self.field,
            "operator": self.operator.value,
        }

        if self.value is not None:
            result["value"] = self.value

        return result


@dataclass(frozen=True)
class FilterGroup:
    logic: FilterLogic
    conditions: tuple[FilterCondition | FilterGroup, ...]

    def __post_init__(self):
        if not isinstance(self.logic, FilterLogic):
            raise AnalyticsModelError(
                "'logic' must be a FilterLogic."
            )

        if not self.conditions:
            raise AnalyticsModelError(
                "A filter group must contain at least one condition."
            )

        for condition in self.conditions:
            if not isinstance(
                condition,
                (FilterCondition, FilterGroup),
            ):
                raise AnalyticsModelError(
                    "Filter group contains an unsupported condition."
                )

    @classmethod
    def from_dict(cls, data: dict) -> FilterGroup:
        data = _require_dict(data, "filter group")

        logic = _require_enum(
            FilterLogic,
            data.get("logic"),
            "filter.logic",
        )

        raw_conditions = _require_list(
            data.get("conditions"),
            "filter.conditions",
        )

        conditions = []

        for item in raw_conditions:
            item = _require_dict(item, "filter condition")

            if "conditions" in item:
                conditions.append(cls.from_dict(item))
            else:
                conditions.append(FilterCondition.from_dict(item))

        return cls(
            logic=logic,
            conditions=tuple(conditions),
        )

    def to_dict(self) -> dict:
        return {
            "logic": self.logic.value,
            "conditions": [
                condition.to_dict()
                for condition in self.conditions
            ],
        }

def _validate_filter_complexity(
    group: FilterGroup | None,
    *,
    depth: int = 0,
    state: dict[str, int] | None = None,
) -> None:
    if group is None:
        return
    if state is None:
        state = {"groups": 0, "conditions": 0}
    if depth > 5:
        raise AnalyticsModelError("Filter nesting exceeds the maximum depth of 5.")
    state["groups"] += 1
    if state["groups"] > 16:
        raise AnalyticsModelError("Filter tree exceeds 16 groups.")
    for condition in group.conditions:
        if isinstance(condition, FilterGroup):
            _validate_filter_complexity(condition, depth=depth + 1, state=state)
            continue
        state["conditions"] += 1
        if state["conditions"] > 32:
            raise AnalyticsModelError("Filter tree exceeds 32 conditions.")
        if condition.operator in (FilterOperator.IN, FilterOperator.NOT_IN):
            if len(condition.value) > 100:
                raise AnalyticsModelError("IN/NOT_IN filters support at most 100 values.")



# ============================================================
# 6. Sorting Specification
# ============================================================

@dataclass(frozen=True)
class SortSpec:
    field: str
    order: SortOrder = SortOrder.DESC

    def __post_init__(self):
        _require_string(self.field, "sort.field")

        if not isinstance(self.order, SortOrder):
            raise AnalyticsModelError(
                "'order' must be a SortOrder."
            )

    @classmethod
    def from_dict(cls, data: dict) -> SortSpec:
        data = _require_dict(data, "sort")

        return cls(
            field=_require_string(
                data.get("field"),
                "sort.field",
            ),
            order=_require_enum(
                SortOrder,
                data.get("order", "desc"),
                "sort.order",
            ),
        )

    def to_dict(self) -> dict:
        return {
            "field": self.field,
            "order": self.order.value,
        }


# ============================================================
# 7. Analytics Request
# ============================================================

@dataclass(frozen=True)
class AnalyticsRequest:
    dataset_id: str
    operation: AnalyticsOperation
    group_by: tuple[str, ...] = ()
    metrics: tuple[MetricSpec, ...] = ()
    filters: FilterGroup | None = None
    sort: tuple[SortSpec, ...] = ()
    limit: int = 10
    options: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        _require_string(self.dataset_id, "dataset_id")

        if self.operation == AnalyticsOperation.SELECT:
            if self.group_by:
                raise AnalyticsModelError(
                    "'select' operation does not accept group_by."
                )

            if self.metrics:
                raise AnalyticsModelError(
                    "'select' operation does not accept metrics."
                )

        if self.operation == AnalyticsOperation.AGGREGATE:
            # Empty group_by represents a scalar aggregation over all matching documents.
            if not self.metrics:
                raise AnalyticsModelError(
                    "'aggregate' operation requires at least one metric."
                )

        if self.operation == AnalyticsOperation.COUNT:
            if self.group_by or self.metrics or self.sort:
                raise AnalyticsModelError(
                    "'count' operation does not accept group_by, metrics, or sort."
                )

        if not isinstance(self.options, dict):
            raise AnalyticsModelError("'options' must be an object.")
        if self.operation in (AnalyticsOperation.SELECT, AnalyticsOperation.AGGREGATE):
            if isinstance(self.limit, bool) or not isinstance(self.limit, int) or not 1 <= self.limit <= 1000:
                raise AnalyticsModelError("limit must be an integer between 1 and 1000.")
        if len(self.group_by) > 3:
            raise AnalyticsModelError("At most 3 group_by fields are supported.")
        if len(self.metrics) > 12:
            raise AnalyticsModelError("At most 12 metrics are supported.")
        if len(self.sort) > 5:
            raise AnalyticsModelError("At most 5 sort fields are supported.")
        if self.filters is not None and not isinstance(
            self.filters, FilterGroup
        ):
            raise AnalyticsModelError(
                "'filters' must be a FilterGroup or None."
            )
        _validate_filter_complexity(self.filters)

        if len(set(self.group_by)) != len(self.group_by):
            raise AnalyticsModelError(
                "'group_by' cannot contain duplicate fields."
            )

        for item in self.group_by:
            _require_string(item, "group_by field")

        aliases = [
            metric.alias
            for metric in self.metrics
            if metric.alias is not None
        ]

        if len(aliases) != len(set(aliases)):
            raise AnalyticsModelError(
                "Metric aliases must be unique."
            )

        for metric in self.metrics:
            if not isinstance(metric, MetricSpec):
                raise AnalyticsModelError(
                    "'metrics' must contain MetricSpec objects."
                )

        for sort_item in self.sort:
            if not isinstance(sort_item, SortSpec):
                raise AnalyticsModelError(
                    "'sort' must contain SortSpec objects."
                )

    @classmethod
    def from_dict(cls, data: dict) -> AnalyticsRequest:
        data = _require_dict(data, "analytics request")

        raw_group_by = _require_list(
            data.get("group_by", []),
            "group_by",
        )

        group_by = tuple(
            _require_string(item, "group_by field")
            for item in raw_group_by
        )

        raw_metrics = _require_list(
            data.get("metrics", []),
            "metrics",
        )

        metrics = tuple(
            MetricSpec.from_dict(item)
            for item in raw_metrics
        )

        raw_sort = _require_list(
            data.get("sort", []),
            "sort",
        )

        sort = tuple(
            SortSpec.from_dict(item)
            for item in raw_sort
        )

        raw_filters = data.get("filters")

        filters = (
            FilterGroup.from_dict(raw_filters)
            if raw_filters is not None
            else None
        )

        raw_options = data.get("options", {})
        options = _require_dict(raw_options, "options")

        return cls(
            dataset_id=_require_string(
                data.get("dataset_id"),
                "dataset_id",
            ),
            operation=_require_enum(
                AnalyticsOperation,
                data.get("operation"),
                "operation",
            ),
            group_by=group_by,
            metrics=metrics,
            filters=filters,
            sort=sort,
            limit=data.get("limit", 10),
            options=options,
        )

    def to_dict(self) -> dict:
        return {
            "dataset_id": self.dataset_id,
            "operation": self.operation.value,
            "group_by": list(self.group_by),
            "metrics": [
                metric.to_dict()
                for metric in self.metrics
            ],
            "filters": (
                self.filters.to_dict()
                if self.filters is not None
                else None
            ),
            "sort": [
                item.to_dict()
                for item in self.sort
            ],
            "limit": self.limit,
            "options": self.options,
        }


# ============================================================
# 8. Analytics Result Models
# ============================================================

@dataclass
class AnalyticsResult:
    total_documents: int
    data: list[dict[str, Any]]
    returned_groups: int

    def __post_init__(self):
        if self.total_documents < 0:
            raise AnalyticsModelError(
                "'total_documents' cannot be negative."
            )

        if self.returned_groups < 0:
            raise AnalyticsModelError(
                "'returned_groups' cannot be negative."
            )

        if not isinstance(self.data, list):
            raise AnalyticsModelError("'data' must be a list.")

        if self.returned_groups != len(self.data):
            raise AnalyticsModelError(
                "'returned_groups' must equal the length of 'data'."
            )

    def to_dict(self) -> dict:
        return {
            "total_documents": self.total_documents,
            "returned_groups": self.returned_groups,
            "data": self.data,
        }


@dataclass
class AnalyticsMetadata:
    limit: int
    returned_groups: int
    truncated: bool
    execution_time_ms: float | None = None

    def to_dict(self) -> dict:
        return {
            "limit": self.limit,
            "returned_groups": self.returned_groups,
            "truncated": self.truncated,
            "execution_time_ms": self.execution_time_ms,
        }


# ============================================================
# 9. Analytics Response
# ============================================================

@dataclass
class AnalyticsResponse:
    status: str
    dataset_id: str
    operation: str
    result: AnalyticsResult | None = None
    metadata: AnalyticsMetadata | None = None
    warnings: list[str] = field(default_factory=list)
    error: dict[str, Any] | None = None

    def __post_init__(self):
        if self.status not in ("success", "error"):
            raise AnalyticsModelError(
                "'status' must be 'success' or 'error'."
            )

        if self.status == "success" and self.result is None:
            raise AnalyticsModelError(
                "Successful response requires a result."
            )

        if self.status == "error" and self.error is None:
            raise AnalyticsModelError(
                "Error response requires error details."
            )

    def to_dict(self) -> dict:
        return {
            "status": self.status,
            "dataset_id": self.dataset_id,
            "operation": self.operation,
            "result": (
                self.result.to_dict()
                if self.result is not None
                else None
            ),
            "metadata": (
                self.metadata.to_dict()
                if self.metadata is not None
                else None
            ),
            "warnings": self.warnings,
            "error": self.error,
        }


# ============================================================
# 10. Standard Analytics Error
# ============================================================

@dataclass
class AnalyticsError:
    code: str
    message: str
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "code": self.code,
            "message": self.message,
            "details": self.details,
        }

    
