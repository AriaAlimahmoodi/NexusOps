
from tools.analytics_engine.models import AnalyticsRequest


# Test 1: Basic aggregation request
request_data = {
    "dataset_id": "labor_market",
    "operation": "aggregate",
    "group_by": ["skill"],
    "metrics": [
        {
            "field": "demand_score",
            "function": "avg",
            "alias": "average_demand"
        },
        {
            "field": "frequency",
            "function": "sum",
            "alias": "total_frequency"
        }
    ],
    "filters": None,
    "sort": [
        {
            "field": "average_demand",
            "order": "desc"
        }
    ],
    "limit": 10,
    "options": {}
}

request = AnalyticsRequest.from_dict(request_data)

assert request.dataset_id == "labor_market"
assert request.operation.value == "aggregate"
assert request.group_by == ("skill",)
assert len(request.metrics) == 2
assert request.limit == 10

print("Test 1 passed: Basic aggregation request")


# Test 2: Nested filters
nested_request_data = {
    "dataset_id": "labor_market",
    "operation": "aggregate",
    "group_by": ["skill"],
    "metrics": [
        {
            "field": "demand_score",
            "function": "avg",
            "alias": "average_demand"
        }
    ],
    "filters": {
        "logic": "and",
        "conditions": [
            {
                "field": "job_field",
                "operator": "in",
                "value": ["Software", "Data"]
            },
            {
                "logic": "or",
                "conditions": [
                    {
                        "field": "experience_level",
                        "operator": "eq",
                        "value": "Junior"
                    },
                    {
                        "field": "experience_level",
                        "operator": "eq",
                        "value": "Mid"
                    }
                ]
            }
        ]
    },
    "limit": 10
}

nested_request = AnalyticsRequest.from_dict(nested_request_data)

assert nested_request.filters is not None
assert len(nested_request.filters.conditions) == 2

print("Test 2 passed: Nested AND/OR filters")


# Test 3: JSON-compatible serialization
serialized = request.to_dict()

assert serialized["dataset_id"] == "labor_market"
assert serialized["metrics"][0]["function"] == "avg"
assert serialized["sort"][0]["order"] == "desc"

print("Test 3 passed: Request serialization")


# Test 4: Invalid aggregation request
invalid_request = {
    "dataset_id": "labor_market",
    "operation": "aggregate",
    "group_by": [],
    "metrics": [],
    "limit": 10
}

try:
    AnalyticsRequest.from_dict(invalid_request)
    raise AssertionError("Invalid request was accepted.")

except ValueError:
    print("Test 4 passed: Invalid request rejected")


print("\nAll manual tests passed successfully.")
