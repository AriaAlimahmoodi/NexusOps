from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from tools.dataset_registry import get_dataset_profile
from tools.datasets.schema_discovery import discover_dataset_schema

from tools.analytics_engine.models import (
    AnalyticsRequest,
    AnalyticsOperation,
    MetricFunction,
    FilterOperator,
    FilterCondition,
    FilterGroup,
)


# ============================================================
# 1. Validation Errors and Report
# ============================================================

@dataclass
class AnalyticsValidationError(ValueError):
    errors: list[str] = field(default_factory=list)
    details: list[dict[str, Any]] = field(default_factory=list)

    def __str__(self) -> str:
        return "Analytics request validation failed:\n- " + "\n- ".join(
            self.errors
        )


@dataclass
class ValidationReport:
    valid: bool
    dataset_id: str
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "valid": self.valid,
            "dataset_id": self.dataset_id,
            "errors": self.errors,
            "warnings": self.warnings,
        }


# ============================================================
# 2. Data Type Categories
# ============================================================

NUMERIC_TYPES = {
    "byte",
    "short",
    "integer",
    "long",
    "unsigned_long",
    "half_float",
    "float",
    "double",
    "scaled_float",
}

DATE_TYPES = {
    "date",
    "date_nanos",
}

# Types suitable for range-based comparisons.
RANGE_TYPES = NUMERIC_TYPES | DATE_TYPES


# ============================================================
# Data Type Compatibility
# ============================================================

STRING_TYPES = {
    "keyword",
    "constant_keyword",
    "wildcard",
    "text",
    "match_only_text",
    "ip",
    "version",
}

def _is_value_compatible(
    value: Any,
    actual_types: list[str],
) -> bool:
    """
    Check whether a filter value is compatible with
    all actual Elasticsearch field types.
    """

    if not actual_types:
        return False

    for actual_type in actual_types:

        if actual_type in NUMERIC_TYPES:
            if isinstance(value, bool) or not isinstance(
                value, (int, float)
            ):
                return False

        elif actual_type == "boolean":
            if not isinstance(value, bool):
                return False

        elif actual_type in STRING_TYPES:
            if not isinstance(value, str):
                return False

        elif actual_type in DATE_TYPES:
            # Elasticsearch date fields accept date strings
            # and epoch-millisecond numeric values.
            if isinstance(value, bool):
                return False

            if not isinstance(value, (str, int, float)):
                return False

        else:
            # Unknown or unsupported field types are rejected
            # instead of being accepted without validation.
            return False

    return True



# ============================================================
# 3. Main Validator
# ============================================================

class AnalyticsQueryValidator:

    def validate(
        self,
        request: AnalyticsRequest,
    ) -> ValidationReport:

        errors: list[str] = []
        error_details: list[dict[str, Any]] = []
        warnings: list[str] = []

        # ----------------------------------------------------
        # A. Validate request object
        # ----------------------------------------------------

        if not isinstance(request, AnalyticsRequest):
            raise AnalyticsValidationError(
                ["Input must be an AnalyticsRequest object."]
            )

        # ----------------------------------------------------
        # B. Load dataset profile
        # ----------------------------------------------------

        try:
            profile = get_dataset_profile(request.dataset_id)
        except (ValueError, KeyError):
            message = (
                f"Dataset '{request.dataset_id}' is not registered."
            )

            raise AnalyticsValidationError(
                errors=[message],
                details=[
                    {
                        "code": "UNKNOWN_DATASET",
                        "message": message,
                        "dataset_id": request.dataset_id,
                    }
                ],
            ) from None

        # ----------------------------------------------------
        # C. Discover actual dataset schema
        # ----------------------------------------------------

        try:
            schema = discover_dataset_schema(request.dataset_id)
        except Exception as exc:
            raise AnalyticsValidationError(
                [
                    "Unable to discover the actual dataset schema. "
                    f"Details: {type(exc).__name__}: {exc}"
                ]
            ) from None

        actual_fields = schema.get("actual_fields", {})
        profile_fields = profile.get("fields", {})

        if not schema.get("schema_consistent", False):
            comparison = schema.get("comparison", {})
            errors.append(
                "Dataset profile and actual schema are inconsistent. "
                f"Comparison details: {comparison}"
            )

        if not actual_fields:
            errors.append(
                "Dataset schema contains no discoverable fields."
            )

        # ----------------------------------------------------
        # D. Validate group_by fields
        # ----------------------------------------------------


        for field_name in request.group_by:
            self._validate_field(
                field_name=field_name,
                required_role="group_by",
                profile_fields=profile_fields,
                actual_fields=actual_fields,
                errors=errors,
            )

            actual_definition = actual_fields.get(field_name)

            if (
                actual_definition is not None
                and not actual_definition.get("aggregatable", False)
            ):
                errors.append(
                    f"Field '{field_name}' cannot be used in group_by "
                    "because it is not aggregatable in the actual schema."
                )


        # ----------------------------------------------------
        # E. Validate metrics
        # ----------------------------------------------------

        for metric in request.metrics:
            self._validate_metric(
                metric=metric,
                profile_fields=profile_fields,
                actual_fields=actual_fields,
                errors=errors,
            )

        # ----------------------------------------------------
        # F. Validate filters recursively
        # ----------------------------------------------------

        if request.filters is not None:
            self._validate_filter_group(
                group=request.filters,
                profile_fields=profile_fields,
                actual_fields=actual_fields,
                errors=errors,
            )

        # ----------------------------------------------------
        # G. Validate sorting
        # ----------------------------------------------------

        if request.sort:

            # ------------------------------------------------
            # SELECT
            # ------------------------------------------------
            # Sorting is performed directly on dataset fields.
            # ------------------------------------------------
            if request.operation == AnalyticsOperation.SELECT:

                for sort_item in request.sort:
                    self._validate_field(
                        field_name=sort_item.field,
                        required_role="sort",
                        profile_fields=profile_fields,
                        actual_fields=actual_fields,
                        errors=errors,
                    )

                    actual_definition = actual_fields.get(sort_item.field)

                    if (
                        actual_definition is not None
                        and not actual_definition.get("aggregatable", False)
                    ):
                        errors.append(
                            f"Field '{sort_item.field}' cannot be used in sort "
                            "because it is not aggregatable in the actual schema."
                        )

            # ------------------------------------------------
            # COUNT
            # ------------------------------------------------
            # COUNT does not accept sorting.
            # The AnalyticsRequest model already rejects it,
            # so this branch is defensive.
            # ------------------------------------------------
            elif request.operation == AnalyticsOperation.COUNT:

                errors.append(
                    "'count' operation does not accept sort."
                )

            # ------------------------------------------------
            # AGGREGATE
            # ------------------------------------------------
            # Sorting is allowed only by:
            #   1. group_by fields
            #   2. declared metric aliases
            # ------------------------------------------------
            elif request.operation == AnalyticsOperation.AGGREGATE:

                group_fields = set(request.group_by)

                metric_aliases = {
                    metric.alias
                    for metric in request.metrics
                    if metric.alias is not None
                }

                for sort_item in request.sort:
                    if (
                        sort_item.field not in group_fields
                        and sort_item.field not in metric_aliases
                    ):
                        errors.append(
                            f"Sort field '{sort_item.field}' is invalid. "
                            "It must refer to a group_by field "
                            "or a declared metric alias."
                        )
        # ----------------------------------------------------
        # H. Return validation report
        # ----------------------------------------------------

        report = ValidationReport(
            valid=not errors,
            dataset_id=request.dataset_id,
            errors=errors,
            warnings=warnings,
        )

        if errors:
            for error in errors:
                if (
                    "is not registered in the dataset profile"
                    in error
                ):
                    field_name = error.split("'")[1]

                    error_details.append(
                        {
                            "code": "INVALID_FIELD",
                            "message": error,
                            "dataset_id": request.dataset_id,
                            "field": field_name,
                        }
                    )

            raise AnalyticsValidationError(
                errors=errors,
                details=error_details,
            )

        return report

    # ========================================================
    # 4. Field Validation
    # ========================================================

    @staticmethod
    def _validate_field(
        field_name: str,
        required_role: str,
        profile_fields: dict,
        actual_fields: dict,
        errors: list[str],
    ) -> None:

        profile_definition = profile_fields.get(field_name)

        if profile_definition is None:
            errors.append(
                f"Field '{field_name}' is not registered "
                "in the dataset profile."
            )
            return

        roles = profile_definition.get("roles", [])

        if required_role not in roles:
            errors.append(
                f"Field '{field_name}' does not support "
                f"the required role '{required_role}'."
            )

        actual_definition = actual_fields.get(field_name)

        if actual_definition is None:
            errors.append(
                f"Field '{field_name}' does not exist "
                "in the actual dataset schema."
            )
            return

        if actual_definition.get("type_conflict", False):
            errors.append(
                f"Field '{field_name}' has conflicting actual data types."
            )

    # ========================================================
    # 5. Metric Validation
    # ========================================================

    def _validate_metric(
        self,
        metric,
        profile_fields: dict,
        actual_fields: dict,
        errors: list[str],
    ) -> None:

        function = metric.function

        # count_documents does not require a field.
        if function == MetricFunction.COUNT_DOCUMENTS:
            return

        field_name = metric.field

        if field_name is None:
            errors.append(
                f"Metric '{function.value}' requires a field."
            )
            return

        self._validate_field(
            field_name=field_name,
            required_role="metric",
            profile_fields=profile_fields,
            actual_fields=actual_fields,
            errors=errors,
        )

        profile_definition = profile_fields.get(field_name)
        actual_definition = actual_fields.get(field_name)

        if not profile_definition or not actual_definition:
            return

        if not actual_definition.get("aggregatable", False):
            errors.append(
                f"Field '{field_name}' is not aggregatable "
                "in the actual dataset schema."
            )
            return

        actual_types = actual_definition.get("types", [])

        if not actual_types:
            errors.append(
                f"Actual data type of field '{field_name}' is unknown."
            )
            return

        if function in (
            MetricFunction.SUM,
            MetricFunction.AVG,
        ):
            if not all(
                actual_type in NUMERIC_TYPES
                for actual_type in actual_types
            ):
                errors.append(
                    f"Metric '{function.value}' requires a numeric field. "
                    f"Field '{field_name}' has types: {actual_types}."
                )

        elif function in (
            MetricFunction.MIN,
            MetricFunction.MAX,
        ):
            if not all(
                actual_type in RANGE_TYPES
                for actual_type in actual_types
            ):
                errors.append(
                    f"Metric '{function.value}' requires a numeric "
                    "or date field. "
                    f"Field '{field_name}' has types: {actual_types}."
                )

        elif function == MetricFunction.CARDINALITY:
            # Cardinality supports aggregatable field types.
            pass

        elif function == MetricFunction.VALUE_COUNT:
            # Value count supports aggregatable field types.
            pass

    # ========================================================
    # 6. Recursive Filter Validation
    # ========================================================

    def _validate_filter_group(
        self,
        group: FilterGroup,
        profile_fields: dict,
        actual_fields: dict,
        errors: list[str],
    ) -> None:

        for condition in group.conditions:

            if isinstance(condition, FilterGroup):
                self._validate_filter_group(
                    group=condition,
                    profile_fields=profile_fields,
                    actual_fields=actual_fields,
                    errors=errors,
                )

            elif isinstance(condition, FilterCondition):
                self._validate_filter_condition(
                    condition=condition,
                    profile_fields=profile_fields,
                    actual_fields=actual_fields,
                    errors=errors,
                )

    # ========================================================
    # 7. Individual Filter Validation
    # ========================================================

    def _validate_filter_condition(
        self,
        condition: FilterCondition,
        profile_fields: dict,
        actual_fields: dict,
        errors: list[str],
    ) -> None:

        field_name = condition.field
        operator = condition.operator
        value = condition.value

        self._validate_field(
            field_name=field_name,
            required_role="filter",
            profile_fields=profile_fields,
            actual_fields=actual_fields,
            errors=errors,
        )

        profile_definition = profile_fields.get(field_name)
        actual_definition = actual_fields.get(field_name)

        if not profile_definition or not actual_definition:
            return

        if not actual_definition.get("searchable", False):
            errors.append(
                f"Field '{field_name}' is not searchable "
                "in the actual dataset schema."
            )
            return

        actual_types = actual_definition.get("types", [])

        if not actual_types:
            errors.append(
                f"Actual data type of filter field "
                f"'{field_name}' is unknown."
            )
            return

        # Range operators currently support numeric fields only.
        if operator in (
            FilterOperator.GT,
            FilterOperator.GTE,
            FilterOperator.LT,
            FilterOperator.LTE,
            FilterOperator.BETWEEN,
        ):
            if not all(
                actual_type in NUMERIC_TYPES
                for actual_type in actual_types
            ):
                errors.append(
                    f"Operator '{operator.value}' requires a numeric field. "
                    f"Field '{field_name}' has types: {actual_types}."
                )
                return

            values = value if isinstance(value, list) else [value]

            for item in values:
                if isinstance(item, bool) or not isinstance(
                    item, (int, float)
                ):
                    errors.append(
                        f"Operator '{operator.value}' requires numeric values "
                        f"for field '{field_name}'."
                    )
                    return

            if operator == FilterOperator.BETWEEN:
                if value[0] > value[1]:
                    errors.append(
                        f"Invalid range for field '{field_name}': "
                        "the lower bound exceeds the upper bound."
                    )
                    return

        # IN and NOT_IN must contain a list.
        if operator in (
            FilterOperator.IN,
            FilterOperator.NOT_IN,
        ):
            if not isinstance(value, list) or not value:
                errors.append(
                    f"Operator '{operator.value}' requires "
                    "a non-empty list."
                )
                
        # Validate the type of each filter value.
        if operator in (
            FilterOperator.EQ,
            FilterOperator.NEQ,
            FilterOperator.IN,
            FilterOperator.NOT_IN,
        ):
            values = value if isinstance(value, list) else [value]

            for item in values:
                if not _is_value_compatible(item, actual_types):
                    errors.append(
                        f"Filter value {item!r} is incompatible with "
                        f"field '{field_name}' and its actual types "
                        f"{actual_types}."
                    )
                    break


    # ========================================================
    # 8. Convenience Function
    # ========================================================


def validate_analytics_request(
    request: AnalyticsRequest,
) -> ValidationReport:
    """
    Validate an AnalyticsRequest against its registered profile
    and the actual discovered dataset schema.

    Returns ValidationReport on success.
    Raises AnalyticsValidationError on validation failure.
    """

    validator = AnalyticsQueryValidator()
    return validator.validate(request)
