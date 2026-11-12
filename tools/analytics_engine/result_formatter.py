from __future__ import annotations

from typing import Any
import math


class ResultFormattingError(ValueError):
    """Raised when an execution result cannot be formatted."""


class ResultFormatter:
    """
    Converts normalized execution results into a stable,
    backend-independent analytics response.
    """

    SUPPORTED_OPERATIONS = {"select", "count", "aggregate"}

    @classmethod
    def format_success(
        cls,
        dataset_id: str,
        operation: str,
        execution_result: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Format a successful normalized execution result.

        Expected normalized input:

        COUNT:
        {
            "operation": "count",
            "count": 60,
            "execution_time_ms": 5,
            "warnings": []
        }

        AGGREGATE:
        {
            "operation": "aggregate",
            "buckets": [
                {
                    "key": {"skill": "Python"},
                    "doc_count": 4,
                    "metrics": {"avg_demand_score": 4.5}
                }
            ],
            "execution_time_ms": 12,
            "total_records": 30,
            "warnings": []
        }
        """

        cls._validate_dataset_id(dataset_id)
        cls._validate_operation(operation)
        cls._validate_execution_result(execution_result)

        result_operation = execution_result.get("operation")

        if result_operation != operation:
            raise ResultFormattingError(
                "Execution result operation does not match requested operation."
            )

        warnings = cls._normalize_warnings(
            execution_result.get("warnings", [])
        )

        execution_time_ms = cls._validate_execution_time(
            execution_result.get("execution_time_ms", 0)
        )

        if operation == "select":
            result, returned_records, total_records = (
                cls._format_select_result(execution_result)
            )
        elif operation == "count":
            result, returned_records, total_records = (
                cls._format_count_result(execution_result)
            )
        else:
            result, returned_records, total_records = (
                cls._format_aggregate_result(execution_result)
            )

        return {
            "status": "success",
            "dataset_id": dataset_id,
            "operation": operation,
            "result": result,
            "metadata": {
                "execution_time_ms": execution_time_ms,
                "returned_records": returned_records,
                "total_records": total_records,
            },
            "warnings": warnings,
            "error": None,
        }

    @classmethod
    def format_error(
        cls,
        dataset_id: str,
        operation: str,
        error_code: str,
        message: str,
    ) -> dict[str, Any]:
        """
        Format an execution or validation error into the
        standard analytics response structure.
        """

        cls._validate_dataset_id(dataset_id)
        cls._validate_operation(operation)

        if not isinstance(error_code, str) or not error_code.strip():
            raise ResultFormattingError(
                "error_code must be a non-empty string."
            )

        if not isinstance(message, str) or not message.strip():
            raise ResultFormattingError(
                "message must be a non-empty string."
            )

        return {
            "status": "error",
            "dataset_id": dataset_id,
            "operation": operation,
            "result": None,
            "metadata": {
                "execution_time_ms": None,
                "returned_records": 0,
                "total_records": None,
            },
            "warnings": [],
            "error": {
                "code": error_code,
                "message": message,
            },
        }

    @classmethod
    def _format_select_result(
        cls,
        execution_result: dict[str, Any],
    ) -> tuple[list[dict[str, Any]], int, int]:

        records = execution_result.get("records")

        if not isinstance(records, list):
            raise ResultFormattingError(
                "SELECT execution result must contain a records list."
            )

        for record in records:
            if not isinstance(record, dict):
                raise ResultFormattingError(
                    "Each SELECT record must be an object."
                )

        returned_records = execution_result.get(
            "returned_records",
            len(records),
        )

        total_records = execution_result.get(
            "total_records",
            len(records),
        )

        if (
            isinstance(returned_records, bool)
            or not isinstance(returned_records, int)
            or returned_records < 0
        ):
            raise ResultFormattingError(
                "SELECT returned_records must be a non-negative integer."
            )

        if (
            isinstance(total_records, bool)
            or not isinstance(total_records, int)
            or total_records < 0
        ):
            raise ResultFormattingError(
                "SELECT total_records must be a non-negative integer."
            )

        if returned_records != len(records):
            raise ResultFormattingError(
                "SELECT returned_records does not match the number of records."
            )

        if total_records < returned_records:
            raise ResultFormattingError(
                "SELECT total_records cannot be less than returned_records."
            )

        return records, returned_records, total_records


    @classmethod
    def _format_count_result(
        cls,
        execution_result: dict[str, Any],
    ) -> tuple[dict[str, Any], int, int]:

        count = execution_result.get("count")

        if (
            isinstance(count, bool)
            or not isinstance(count, int)
            or count < 0
        ):
            raise ResultFormattingError(
                "Count result must be a non-negative integer."
            )

        return (
            {"count": count},
            1,
            count,
        )

    @classmethod
    def _format_aggregate_result(
        cls,
        execution_result: dict[str, Any],
    ) -> tuple[dict[str, Any], int, int | None]:

        buckets = execution_result.get("buckets")

        if not isinstance(buckets, list):
            raise ResultFormattingError(
                "Aggregate result must contain a buckets list."
            )

        formatted_buckets = []

        for index, bucket in enumerate(buckets):
            if not isinstance(bucket, dict):
                raise ResultFormattingError(
                    f"Bucket at index {index} must be a dictionary."
                )

            key = bucket.get("key")
            doc_count = bucket.get("doc_count")
            metrics = bucket.get("metrics", {})

            if not isinstance(key, dict):
                raise ResultFormattingError(
                    f"Bucket key at index {index} must be a dictionary."
                )

            if (
                isinstance(doc_count, bool)
                or not isinstance(doc_count, int)
                or doc_count < 0
            ):
                raise ResultFormattingError(
                    f"Bucket doc_count at index {index} "
                    "must be a non-negative integer."
                )

            if not isinstance(metrics, dict):
                raise ResultFormattingError(
                    f"Bucket metrics at index {index} "
                    "must be a dictionary."
                )

            cls._validate_metrics(metrics, index)

            formatted_buckets.append(
                {
                    "group": key,
                    "metrics": metrics,
                    "document_count": doc_count,
                }
            )

        total_records = execution_result.get("total_records")

        if total_records is not None:
            if (
                isinstance(total_records, bool)
                or not isinstance(total_records, int)
                or total_records < 0
            ):
                raise ResultFormattingError(
                    "total_records must be a non-negative integer or None."
                )

        return (
            {"buckets": formatted_buckets},
            len(formatted_buckets),
            total_records,
        )

    @staticmethod
    def _validate_metrics(
        metrics: dict[str, Any],
        bucket_index: int,
    ) -> None:

        for metric_name, value in metrics.items():
            if not isinstance(metric_name, str) or not metric_name.strip():
                raise ResultFormattingError(
                    f"Invalid metric name in bucket {bucket_index}."
                )

            if value is None:
                continue

            if (
                isinstance(value, bool)
                or not isinstance(value, (int, float))
                or (isinstance(value, float) and not math.isfinite(value))
            ):
                raise ResultFormattingError(
                    f"Metric {metric_name!r} in bucket {bucket_index} "
                    "must be a finite numeric value or None."
                )

    @staticmethod
    def _validate_dataset_id(dataset_id: str) -> None:

        if not isinstance(dataset_id, str) or not dataset_id.strip():
            raise ResultFormattingError(
                "dataset_id must be a non-empty string."
            )

    @classmethod
    def _validate_operation(cls, operation: str) -> None:

        if (
            not isinstance(operation, str)
            or operation not in cls.SUPPORTED_OPERATIONS
        ):
            raise ResultFormattingError(
                f"Unsupported operation: {operation}"
            )
    @staticmethod
    def _validate_execution_result(
        execution_result: dict[str, Any],
    ) -> None:

        if not isinstance(execution_result, dict):
            raise ResultFormattingError(
                "execution_result must be a dictionary."
            )

    @staticmethod
    def _validate_execution_time(value: Any) -> int | float:

        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
            or value < 0
        ):
            raise ResultFormattingError(
                "execution_time_ms must be a non-negative finite number."
            )

        return value

    @staticmethod
    def _normalize_warnings(warnings: Any) -> list[str]:

        if not isinstance(warnings, list):
            raise ResultFormattingError(
                "warnings must be a list."
            )

        if not all(
            isinstance(item, str) and item.strip()
            for item in warnings
        ):
            raise ResultFormattingError(
                "Every warning must be a non-empty string."
            )

        return warnings


def format_analytics_result(
    dataset_id: str,
    operation: str,
    execution_result: dict[str, Any],
) -> dict[str, Any]:
    """Convenience function for formatting successful results."""

    return ResultFormatter.format_success(
        dataset_id=dataset_id,
        operation=operation,
        execution_result=execution_result,
    )
