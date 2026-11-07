
from tools.analytics_engine.query_executor import (
    QueryExecutor,
    QueryExecutionError,
)


class FakeAdapter:
    """
    Simulates a data-source adapter.
    No real database connection is required.
    """

    def __init__(self):
        self.received_plan = None

    def execute(self, plan):
        self.received_plan = plan

        return {
            "status": "success",
            "received_operation": plan["operation"],
            "dataset_id": plan["dataset"]["dataset_id"],
        }


def make_field(name, actual_types, mapping_type):
    return {
        "name": name,
        "profile_type": mapping_type,
        "actual_types": actual_types,
        "mapping_type": mapping_type,
        "aggregatable": True,
    }


def make_aggregate_request():
    return {
        "dataset": {
            "dataset_id": "labor_market",
            "index": "labor_market",
            "source_type": "elasticsearch",
            "schema_consistent": True,
        },
        "operation": "aggregate",
        "group_by": [
            make_field("skill", ["keyword"], "keyword")
        ],
        "metrics": [
            {
                "function": "avg",
                "field": make_field(
                    "demand_score", ["float"], "float"
                ),
                "alias": None,
            },
            {
                "function": "sum",
                "field": make_field(
                    "frequency", ["integer"], "integer"
                ),
                "alias": "total_frequency",
            },
        ],
        "filters": {
            "type": "group",
            "logic": "and",
            "conditions": [
                {
                    "type": "condition",
                    "field": make_field(
                        "job_field", ["keyword"], "keyword"
                    ),
                    "operator": "eq",
                    "value": "Software",
                }
            ],
        },
        "sort": [
            {
                "field": "total_frequency",
                "order": "desc",
            }
        ],
        "limit": 10,
        "options": {},
    }


# Test 1: Aggregate execution delegated to adapter
adapter_1 = FakeAdapter()
executor_1 = QueryExecutor(adapter_1)

result_1 = executor_1.execute(
    make_aggregate_request()
)

assert result_1["status"] == "success"
assert result_1["received_operation"] == "aggregate"
assert result_1["dataset_id"] == "labor_market"

print("Test 1 passed: Aggregate plan delegated to adapter")


# Test 2: Filter plan included in execution plan
plan_2 = adapter_1.received_plan

assert plan_2["filters"]["node_type"] == "group"
assert plan_2["filters"]["logic"] == "and"
assert (
    plan_2["filters"]["children"][0]["value"]
    == "Software"
)

print("Test 2 passed: Filter plan included")


# Test 3: Aggregation plan included
aggregation_3 = plan_2["aggregation"]

assert aggregation_3["group_by"][0]["name"] == "skill"
assert aggregation_3["metrics"][0]["alias"] == "avg_demand_score"
assert aggregation_3["metrics"][1]["alias"] == "total_frequency"

print("Test 3 passed: Aggregation plan included")


# Test 4: Count operation
adapter_4 = FakeAdapter()
executor_4 = QueryExecutor(adapter_4)

count_request = {
    "dataset": {
        "dataset_id": "labor_market",
        "index": "labor_market",
        "source_type": "elasticsearch",
        "schema_consistent": True,
    },
    "operation": "count",
    "filters": None,
    "options": {},
}

result_4 = executor_4.execute(count_request)

assert result_4["status"] == "success"
assert result_4["received_operation"] == "count"
assert "aggregation" not in adapter_4.received_plan

print("Test 4 passed: Count operation delegated")


# Test 5: Inconsistent schema rejected
adapter_5 = FakeAdapter()
executor_5 = QueryExecutor(adapter_5)

invalid_request = make_aggregate_request()
invalid_request["dataset"]["schema_consistent"] = False

try:
    executor_5.execute(invalid_request)
    raise AssertionError("Inconsistent schema was not rejected")
except QueryExecutionError:
    print("Test 5 passed: Inconsistent schema rejected")


# Test 6: Missing dataset information rejected
invalid_request_6 = make_aggregate_request()
invalid_request_6["dataset"] = None

try:
    executor_5.execute(invalid_request_6)
    raise AssertionError("Missing dataset was not rejected")
except QueryExecutionError:
    print("Test 6 passed: Missing dataset rejected")


# Test 7: Unsupported operation rejected
invalid_request_7 = make_aggregate_request()
invalid_request_7["operation"] = "delete"

try:
    executor_5.execute(invalid_request_7)
    raise AssertionError("Unsupported operation was not rejected")
except QueryExecutionError:
    print("Test 7 passed: Unsupported operation rejected")


# Test 8: Adapter without execute method rejected
class InvalidAdapter:
    pass


try:
    QueryExecutor(InvalidAdapter())
    raise AssertionError("Invalid adapter was not rejected")
except QueryExecutionError:
    print("Test 8 passed: Invalid adapter rejected")


print("\nAll query executor manual tests passed successfully.")
