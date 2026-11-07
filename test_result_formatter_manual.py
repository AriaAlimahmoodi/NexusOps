
from pprint import pprint

from tools.analytics_engine.result_formatter import (
    ResultFormatter,
    ResultFormattingError,
    format_analytics_result,
)


def run_test(name, callback):
    try:
        callback()
        print(f"[PASS] {name}")
    except Exception as exc:
        print(f"[FAIL] {name}: {exc}")
        raise


# Test 1: Basic count formatting
def test_count():
    result = format_analytics_result(
        dataset_id="labor_market",
        operation="count",
        execution_result={
            "operation": "count",
            "count": 60,
            "execution_time_ms": 5,
            "warnings": [],
        },
    )

    assert result["status"] == "success"
    assert result["result"]["count"] == 60
    assert result["metadata"]["total_records"] == 60


# Test 2: Basic aggregate formatting
def test_aggregate():
    result = format_analytics_result(
        dataset_id="labor_market",
        operation="aggregate",
        execution_result={
            "operation": "aggregate",
            "buckets": [
                {
                    "key": {"skill": "Python"},
                    "doc_count": 4,
                    "metrics": {
                        "avg_demand_score": 4.57,
                        "total_frequency": 2910,
                    },
                }
            ],
            "execution_time_ms": 12,
            "total_records": 30,
            "warnings": [],
        },
    )

    assert result["status"] == "success"
    assert len(result["result"]["buckets"]) == 1
    assert result["result"]["buckets"][0]["group"]["skill"] == "Python"
    assert result["result"]["buckets"][0]["document_count"] == 4
    assert result["metadata"]["returned_records"] == 1
    assert result["metadata"]["total_records"] == 30


# Test 3: Multiple aggregate buckets
def test_multiple_buckets():
    result = format_analytics_result(
        "labor_market",
        "aggregate",
        {
            "operation": "aggregate",
            "buckets": [
                {
                    "key": {"skill": "Python"},
                    "doc_count": 4,
                    "metrics": {"avg_demand_score": 4.5},
                },
                {
                    "key": {"skill": "Java"},
                    "doc_count": 3,
                    "metrics": {"avg_demand_score": 4.2},
                },
            ],
            "execution_time_ms": 10,
            "total_records": 30,
            "warnings": [],
        },
    )

    assert result["metadata"]["returned_records"] == 2
    assert len(result["result"]["buckets"]) == 2


# Test 4: Aggregate with unknown total_records
def test_unknown_total_records():
    result = format_analytics_result(
        "labor_market",
        "aggregate",
        {
            "operation": "aggregate",
            "buckets": [],
            "execution_time_ms": 3,
            "total_records": None,
            "warnings": [],
        },
    )

    assert result["metadata"]["returned_records"] == 0
    assert result["metadata"]["total_records"] is None


# Test 5: Warnings preservation
def test_warnings():
    result = format_analytics_result(
        "labor_market",
        "count",
        {
            "operation": "count",
            "count": 60,
            "execution_time_ms": 5,
            "warnings": ["Result is based on approximate data."],
        },
    )

    assert len(result["warnings"]) == 1
    assert "approximate" in result["warnings"][0]


# Test 6: Error formatting
def test_error_formatting():
    result = ResultFormatter.format_error(
        dataset_id="labor_market",
        operation="aggregate",
        error_code="VALIDATION_ERROR",
        message="Invalid metric field.",
    )

    assert result["status"] == "error"
    assert result["result"] is None
    assert result["error"]["code"] == "VALIDATION_ERROR"


# Test 7: Invalid count
def test_invalid_count():
    try:
        format_analytics_result(
            "labor_market",
            "count",
            {
                "operation": "count",
                "count": -5,
                "execution_time_ms": 5,
                "warnings": [],
            },
        )
    except ResultFormattingError:
        return

    raise AssertionError("Invalid count was accepted.")


# Test 8: Operation mismatch
def test_operation_mismatch():
    try:
        format_analytics_result(
            "labor_market",
            "count",
            {
                "operation": "aggregate",
                "buckets": [],
                "execution_time_ms": 5,
                "warnings": [],
            },
        )
    except ResultFormattingError:
        return

    raise AssertionError("Operation mismatch was accepted.")


# Test 9: Invalid bucket structure
def test_invalid_bucket():
    try:
        format_analytics_result(
            "labor_market",
            "aggregate",
            {
                "operation": "aggregate",
                "buckets": ["invalid bucket"],
                "execution_time_ms": 5,
                "warnings": [],
            },
        )
    except ResultFormattingError:
        return

    raise AssertionError("Invalid bucket was accepted.")


# Test 10: Invalid execution time
def test_invalid_execution_time():
    try:
        format_analytics_result(
            "labor_market",
            "count",
            {
                "operation": "count",
                "count": 60,
                "execution_time_ms": -1,
                "warnings": [],
            },
        )
    except ResultFormattingError:
        return

    raise AssertionError("Invalid execution time was accepted.")


# Run all tests
tests = [
    ("Count formatting", test_count),
    ("Aggregate formatting", test_aggregate),
    ("Multiple buckets", test_multiple_buckets),
    ("Unknown total records", test_unknown_total_records),
    ("Warnings preservation", test_warnings),
    ("Error formatting", test_error_formatting),
    ("Invalid count rejection", test_invalid_count),
    ("Operation mismatch rejection", test_operation_mismatch),
    ("Invalid bucket rejection", test_invalid_bucket),
    ("Invalid execution time rejection", test_invalid_execution_time),
]

for name, callback in tests:
    run_test(name, callback)

print("\nAll Result Formatter tests passed.")

print("\nSample formatted response:")
sample = format_analytics_result(
    "labor_market",
    "aggregate",
    {
        "operation": "aggregate",
        "buckets": [
            {
                "key": {"skill": "Python"},
                "doc_count": 4,
                "metrics": {
                    "avg_demand_score": 4.57,
                    "total_frequency": 2910,
                },
            }
        ],
        "execution_time_ms": 12,
        "total_records": 30,
        "warnings": [],
    },
)

pprint(sample)
