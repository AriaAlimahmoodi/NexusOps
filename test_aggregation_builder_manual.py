
from tools.analytics_engine.aggregation_builder import (
    AggregationPlanBuilder,
    AggregationPlanError,
)


def make_field(name, actual_types, mapping_type):
    return {
        "name": name,
        "profile_type": mapping_type,
        "actual_types": actual_types,
        "mapping_type": mapping_type,
        "aggregatable": True,
    }


def make_resolved_request():
    return {
        "dataset_id": "labor_market",
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
                "alias": "average_demand",
            },
            {
                "function": "sum",
                "field": make_field(
                    "frequency", ["integer"], "integer"
                ),
                "alias": "total_frequency",
            },
        ],
        "sort": [
            {
                "field_type": "metric",
                "alias": "average_demand",
                "order": "desc",
            }
        ],
        "limit": 10,
        "options": {},
    }


builder = AggregationPlanBuilder()


# Test 1: Basic aggregation plan
request_1 = make_resolved_request()
plan_1 = builder.build(request_1)

assert plan_1["dataset_id"] == "labor_market"
assert plan_1["group_by"][0]["name"] == "skill"
assert len(plan_1["metrics"]) == 2
assert plan_1["metrics"][0]["function"] == "avg"
assert plan_1["metrics"][1]["function"] == "sum"
assert plan_1["limit"] == 10

print("Test 1 passed: Basic aggregation plan built")


# Test 2: Multiple group_by fields
request_2 = make_resolved_request()
request_2["group_by"].append(
    make_field("job_field", ["keyword"], "keyword")
)

plan_2 = builder.build(request_2)

assert len(plan_2["group_by"]) == 2
assert plan_2["group_by"][1]["name"] == "job_field"

print("Test 2 passed: Multiple group_by fields handled")


# Test 3: count_documents metric
request_3 = make_resolved_request()

request_3["metrics"] = [
    {
        "function": "count_documents",
        "field": None,
        "alias": "document_count",
    }
]

request_3["sort"] = [
    {
        "field_type": "metric",
        "alias": "document_count",
        "order": "desc",
    }
]

plan_3 = builder.build(request_3)

assert plan_3["metrics"][0]["function"] == "count_documents"
assert plan_3["metrics"][0]["field"] is None
assert plan_3["sort"][0]["target"] == "document_count"

print("Test 3 passed: count_documents metric handled")


# Test 4: Sorting by metric alias
request_4 = make_resolved_request()
plan_4 = builder.build(request_4)

assert plan_4["sort"][0] == {
    "target_type": "metric",
    "target": "average_demand",
    "order": "desc",
}

print("Test 4 passed: Metric alias sorting handled")


# Test 5: Sorting by group field
request_5 = make_resolved_request()
request_5["sort"] = [
    {
        "field_type": "group_by",
        "field": make_field("skill", ["keyword"], "keyword"),
        "order": "asc",
    }
]

plan_5 = builder.build(request_5)

assert plan_5["sort"][0]["target_type"] == "group_field"
assert plan_5["sort"][0]["target"] == "skill"

print("Test 5 passed: Group field sorting handled")


# Test 6: Duplicate metric aliases rejected
request_6 = make_resolved_request()
request_6["metrics"].append({
    "function": "max",
    "field": make_field("frequency", ["integer"], "integer"),
    "alias": "average_demand",
})

try:
    builder.build(request_6)
    raise AssertionError("Duplicate metric alias was not rejected")
except AggregationPlanError:
    print("Test 6 passed: Duplicate metric alias rejected")


# Test 7: Unsupported aggregation function rejected
request_7 = make_resolved_request()
request_7["metrics"][0]["function"] = "median"

try:
    builder.build(request_7)
    raise AssertionError("Unsupported metric was not rejected")
except AggregationPlanError:
    print("Test 7 passed: Unsupported metric function rejected")


# Test 8: Missing metric field rejected
request_8 = make_resolved_request()
request_8["metrics"][0]["field"] = None

try:
    builder.build(request_8)
    raise AssertionError("Missing metric field was not rejected")
except AggregationPlanError:
    print("Test 8 passed: Missing metric field rejected")


# Test 9: Invalid sort target rejected
request_9 = make_resolved_request()
request_9["sort"] = [
    {
        "field_type": "metric",
        "alias": "unknown_field",
        "order": "desc",
    }
]

try:
    builder.build(request_9)
    raise AssertionError("Invalid sort target was not rejected")
except AggregationPlanError:
    print("Test 9 passed: Invalid sort target rejected")


# Test 10: Invalid sort order rejected
request_10 = make_resolved_request()
request_10["sort"] = [
    {
        "field_type": "group_by",
        "field": make_field("skill", ["keyword"], "keyword"),
        "order": "sideways",
    }
]

try:
    builder.build(request_10)
    raise AssertionError("Invalid sort order was not rejected")
except AggregationPlanError:
    print("Test 10 passed: Invalid sort order rejected")


print("\nAll aggregation builder manual tests passed successfully.")
