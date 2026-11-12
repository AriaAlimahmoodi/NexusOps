from __future__ import annotations

from typing import Any

from tools.analytics_engine.query_validator import (
    AnalyticsQueryValidator,
    AnalyticsValidationError,
)
from tools.analytics_engine.field_resolver import (
    resolve_analytics_request,
)
from tools.analytics_engine.query_executor import (
    execute_analytics_query,
)
from tools.analytics_engine.result_formatter import (
    format_analytics_result,
)


class AnalyticsServiceError(Exception):
    """Raised when the analytics service cannot complete a request."""

    def __init__(
        self,
        message: str,
        *,
        code: str = "ANALYTICS_SERVICE_ERROR",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.details = details or {}


class AnalyticsService:
    """
    High-level orchestration layer for the generic analytics engine.

    Pipeline:

        AnalyticsRequest
            ↓
        Validation
            ↓
        Field Resolution
            ↓
        Query Execution
            ↓
        Result Formatting
            ↓
        Standard Analytics Response
    """

    def __init__(
        self,
        validator: AnalyticsQueryValidator | None = None,
        adapter: Any = None,
    ) -> None:
        self.validator = validator or AnalyticsQueryValidator()

        if adapter is None:
            raise AnalyticsServiceError(
                "An analytics adapter is required."
            )

        self.adapter = adapter

    def analyze(self, request: Any) -> dict[str, Any]:
        """
        Execute the complete analytics pipeline.

        Backend-specific details remain hidden behind the adapter.
        """

        # ---------------------------------------------------------
        # 1. Validation
        # ---------------------------------------------------------
        try:
            validation_report = self.validator.validate(request)
        except AnalyticsValidationError as exc:
            if exc.details:
                primary_error = exc.details[0]

                raise AnalyticsServiceError(
                    primary_error["message"],
                    code=primary_error["code"],
                    details=primary_error,
                ) from exc

            raise AnalyticsServiceError(
                "Analytics request validation failed: "
                + "; ".join(str(error) for error in exc.errors),
                code="VALIDATION_ERROR",
            ) from exc

        if not validation_report.valid:
            raise AnalyticsServiceError(
                self._format_validation_error(validation_report)
            )

        # ---------------------------------------------------------
        # 2. Field resolution
        # ---------------------------------------------------------
        try:
            resolved_request = resolve_analytics_request(request)
        except Exception as exc:
            raise AnalyticsServiceError(
                f"Field resolution failed: "
                f"{type(exc).__name__}: {exc}"
            ) from exc

        # ---------------------------------------------------------
        # 3. Query execution
        # ---------------------------------------------------------
        try:
            execution_result = execute_analytics_query(
                resolved_request=resolved_request,
                adapter=self.adapter,
            )
        except Exception as exc:
            raise AnalyticsServiceError(
                f"Query execution failed: "
                f"{type(exc).__name__}: {exc}",
                code="ANALYTICS_QUERY_EXECUTION_FAILED",
                details=getattr(exc, "details", None),
            ) from exc

        # ---------------------------------------------------------
        # 4. Result formatting
        # ---------------------------------------------------------
        try:
            formatted_result = format_analytics_result(
                dataset_id=request.dataset_id,
                operation=request.operation.value,
                execution_result=execution_result,
            )
        except Exception as exc:
            raise AnalyticsServiceError(
                f"Result formatting failed: "
                f"{type(exc).__name__}: {exc}"
            ) from exc

        # ---------------------------------------------------------
        # 5. Attach validation warnings
        # ---------------------------------------------------------
        if validation_report.warnings:
            existing_warnings = formatted_result.get("warnings", [])

            formatted_result["warnings"] = (
                existing_warnings
                + validation_report.warnings
            )

        return formatted_result

    @staticmethod
    def _format_validation_error(report: Any) -> str:
        """
        Convert ValidationReport errors into a readable service error.
        """

        if report.errors:
            return (
                "Analytics request validation failed: "
                + "; ".join(str(error) for error in report.errors)
            )

        return "Analytics request validation failed."


def analyze_request(
    request: Any,
    *,
    adapter: Any,
    validator: AnalyticsQueryValidator | None = None,
) -> dict[str, Any]:
    """
    Convenience function for one-shot analytics execution.
    """

    service = AnalyticsService(
        validator=validator,
        adapter=adapter,
    )

    return service.analyze(request)