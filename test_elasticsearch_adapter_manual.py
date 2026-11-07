
from pprint import pprint

from tools.adapters.elasticsearch_adapter import (
    ElasticsearchAdapter,
    ElasticsearchAdapterError,
)


# ============================================================
# Fake Elasticsearch Client
# ============================================================

class FakeElasticsearchClient:

    def __init__(self):
        self.count_response = {"count": 12}

        self.search_response = {
            "took": 5,
            "timed_out": False,
            "_shards": {"total": 1, "successful": 1, "failed": 0},
            "hits": {"total": {"value": 12, "relation": "eq"}},
            "aggregations": {},
        }

        self.last_count_request = None
        self.last_search_request = None
        self.raise_error = False

    def count(self, **kwargs):
        self.last_count_request = kwargs

        if self.raise_error:
            raise RuntimeError("Simulated Elasticsearch failure")

        return self.count_response

    def search(self, **kwargs):
        self.last_search_request = kwargs

        if self.raise_error:
            raise RuntimeError("Simulated Elasticsearch failure")

        return self.search_response


# ============================================================
# Test Setup
# ============================================================

fake_client = FakeElasticsearchClient()
adapter = ElasticsearchAdapter(client=fake_client)

BASE_DATASET = {
    "dataset_id": "labor_market",
    "index": "labor_market",
    "source_type": "elasticsearch",
    "schema_consistent": True,
}


def make_query_plan(
    operation="aggregate",
    filters=None,
    aggregation=None,
):
    return {
        "plan_version": "1.0",
        "dataset": BASE_DATASET.copy(),
        "operation": operation,
        "filters": filters,
        "options": {},
        **(
            {"aggregation": aggregation}
            if aggregation is not None
            else {}
        ),
    }


def make_aggregation_plan(
    group_by=None,
    metrics=None,
    sort=None,
    limit=10,
):
    return {
        "dataset_id": "labor_market",
        "group_by": group_by or [],
        "metrics": metrics or [],
        "sort": sort or [],
        "limit": limit,
        "options": {},
    }


def make_field(name):
    return {
        "name": name,
        "profile_type": "keyword",
        "actual_types": ["keyword"],
        "mapping_type": "keyword",
        "searchable": True,
    }


# ============================================================
# Test 1: Dependency Injection
# ============================================================

assert adapter.client is fake_client

print("Test 1 passed: Fake client dependency injection")


# ============================================================
# Test 2: Equality Filter
# ============================================================

filter_plan = {
    "node_type": "condition",
    "field": make_field("job_field"),
    "operator": "eq",
    "value": "Software",
}

query = adapter._build_query(filter_plan)

assert query == {
    "term": {
        "job_field": "Software"
    }
}

print("Test 2 passed: Equality filter")


# ============================================================
# Test 3: All Filter Operators
# ============================================================

operator_cases = [
    (
        "neq",
        "Software",
        {
            "bool": {
                "must_not": [
                    {"term": {"job_field": "Software"}}
                ]
            }
        },
    ),
    (
        "in",
        ["Software", "Hardware"],
        {
            "terms": {
                "job_field": ["Software", "Hardware"]
            }
        },
    ),
    (
        "not_in",
        ["Software", "Hardware"],
        {
            "bool": {
                "must_not": [
                    {
                        "terms": {
                            "job_field": ["Software", "Hardware"]
                        }
                    }
                ]
            }
        },
    ),
    (
        "gt",
        3,
        {"range": {"demand_score": {"gt": 3}}},
    ),
    (
        "gte",
        3,
        {"range": {"demand_score": {"gte": 3}}},
    ),
    (
        "lt",
        5,
        {"range": {"demand_score": {"lt": 5}}},
    ),
    (
        "lte",
        5,
        {"range": {"demand_score": {"lte": 5}}},
    ),
    (
        "between",
        [3, 5],
        {
            "range": {
                "demand_score": {
                    "gte": 3,
                    "lte": 5,
                }
            }
        },
    ),
    (
        "exists",
        None,
        {"exists": {"field": "job_field"}},
    ),
    (
        "not_exists",
        None,
        {
            "bool": {
                "must_not": [
                    {"exists": {"field": "job_field"}}
                ]
            }
        },
    ),
]

for operator, value, expected in operator_cases:
    field_name = (
        "demand_score"
        if operator in {"gt", "gte", "lt", "lte", "between"}
        else "job_field"
    )

    condition = {
        "node_type": "condition",
        "field": make_field(field_name),
        "operator": operator,
        "value": value,
    }

    actual = adapter._build_filter_node(condition)

    assert actual == expected, (
        f"Operator {operator} failed.\n"
        f"Expected: {expected}\n"
        f"Actual: {actual}"
    )

print("Test 3 passed: All 10 filter operators")


# ============================================================
# Test 4: Nested AND / OR Filters
# ============================================================

nested_filter = {
    "node_type": "group",
    "logic": "and",
    "children": [
        {
            "node_type": "condition",
            "field": make_field("job_field"),
            "operator": "eq",
            "value": "Software",
        },
        {
            "node_type": "group",
            "logic": "or",
            "children": [
                {
                    "node_type": "condition",
                    "field": make_field("experience_level"),
                    "operator": "eq",
                    "value": "Junior",
                },
                {
                    "node_type": "condition",
                    "field": make_field("experience_level"),
                    "operator": "eq",
                    "value": "Mid",
                },
            ],
        },
    ],
}

nested_query = adapter._build_query(nested_filter)

assert "bool" in nested_query
assert len(nested_query["bool"]["filter"]) == 2

or_query = nested_query["bool"]["filter"][1]

assert len(or_query["bool"]["should"]) == 2
assert or_query["bool"]["minimum_should_match"] == 1

print("Test 4 passed: Nested AND / OR filters")


# ============================================================
# Test 5: Empty Filter
# ============================================================

assert adapter._build_query(None) == {"match_all": {}}

print("Test 5 passed: Empty filter")


# ============================================================
# Test 6: Invalid Filter Rejection
# ============================================================

invalid_filter = {
    "node_type": "condition",
    "field": make_field("job_field"),
    "operator": "unsupported_operator",
    "value": "Software",
}

try:
    adapter._build_filter_node(invalid_filter)
    raise AssertionError("Invalid operator was not rejected.")
except ElasticsearchAdapterError:
    pass

print("Test 6 passed: Invalid filter rejected")


# ============================================================
# Test 7: Metric Aggregations
# ============================================================

metrics = [
    {
        "function": "avg",
        "field": {"name": "demand_score"},
        "alias": "average_demand",
    },
    {
        "function": "sum",
        "field": {"name": "frequency"},
        "alias": "total_frequency",
    },
    {
        "function": "max",
        "field": {"name": "demand_score"},
        "alias": "maximum_demand",
    },
    {
        "function": "min",
        "field": {"name": "demand_score"},
        "alias": "minimum_demand",
    },
    {
        "function": "value_count",
        "field": {"name": "skill"},
        "alias": "skill_count",
    },
    {
        "function": "cardinality",
        "field": {"name": "skill"},
        "alias": "unique_skills",
    },
    {
        "function": "count_documents",
        "field": None,
        "alias": "document_count",
    },
]

metric_aggs = adapter._build_metric_aggregations(metrics)

assert metric_aggs == {
    "average_demand": {
        "avg": {"field": "demand_score"}
    },
    "total_frequency": {
        "sum": {"field": "frequency"}
    },
    "maximum_demand": {
        "max": {"field": "demand_score"}
    },
    "minimum_demand": {
        "min": {"field": "demand_score"}
    },
    "skill_count": {
        "value_count": {"field": "skill"}
    },
    "unique_skills": {
        "cardinality": {"field": "skill"}
    },
}

assert "document_count" not in metric_aggs

print("Test 7 passed: All metric aggregation functions")


# ============================================================
# Test 8: Single Group By
# ============================================================

single_group_plan = make_aggregation_plan(
    group_by=[make_field("skill")],
    metrics=[
        {
            "function": "avg",
            "field": {"name": "demand_score"},
            "alias": "average_demand",
        }
    ],
)

single_group_aggs = adapter._build_aggregations(single_group_plan)

assert "group_0" in single_group_aggs

single_terms = single_group_aggs["group_0"]["terms"]

assert single_terms["field"] == "skill"
assert single_terms["size"] == 10

print("Test 8 passed: Single group-by aggregation")


# ============================================================
# Test 9: Multiple Group By
# ============================================================

multi_group_plan = make_aggregation_plan(
    group_by=[
        make_field("job_field"),
        make_field("experience_level"),
    ],
    metrics=[
        {
            "function": "avg",
            "field": {"name": "demand_score"},
            "alias": "average_demand",
        }
    ],
)

multi_group_aggs = adapter._build_aggregations(multi_group_plan)

assert "group_0" in multi_group_aggs

outer_aggs = multi_group_aggs["group_0"]["aggs"]

assert "group_1" in outer_aggs

inner_aggs = outer_aggs["group_1"]["aggs"]

assert "average_demand" in inner_aggs

print("Test 9 passed: Multiple nested group-by fields")


# ============================================================
# Test 10: Sorting by Group Field
# ============================================================

group_sort_plan = make_aggregation_plan(
    group_by=[make_field("skill")],
    sort=[
        {
            "target": "skill",
            "target_type": "group_field",
            "order": "asc",
        }
    ],
)

group_sort_aggs = adapter._build_aggregations(group_sort_plan)

assert group_sort_aggs["group_0"]["terms"]["order"] == [
    {"_key": "asc"}
]

print("Test 10 passed: Sorting by group field")


# ============================================================
# Test 11: Sorting by Metric Alias
# ============================================================

metric_sort_plan = make_aggregation_plan(
    group_by=[make_field("skill")],
    metrics=[
        {
            "function": "avg",
            "field": {"name": "demand_score"},
            "alias": "average_demand",
        }
    ],
    sort=[
        {
            "target": "average_demand",
            "target_type": "metric_alias",
            "order": "desc",
        }
    ],
)

metric_sort_aggs = adapter._build_aggregations(metric_sort_plan)

assert metric_sort_aggs["group_0"]["terms"]["order"] == [
    {"average_demand": "desc"}
]

print("Test 11 passed: Sorting by metric alias")


# ============================================================
# Test 12: Count Operation
# ============================================================

fake_client.count_response = {"count": 42}

count_plan = make_query_plan(
    operation="count",
    filters={
        "node_type": "condition",
        "field": make_field("job_field"),
        "operator": "eq",
        "value": "Software",
    },
)

count_result = adapter.execute(count_plan)

assert count_result["operation"] == "count"
assert count_result["count"] == 42
assert fake_client.last_count_request["index"] == "labor_market"
assert fake_client.last_count_request["query"] == {
    "term": {"job_field": "Software"}
}

print("Test 12 passed: Count operation")


# ============================================================
# Test 13: Aggregate Response Normalization
# ============================================================

fake_client.search_response = {
    "took": 5,
    "timed_out": False,
    "_shards": {
        "total": 1,
        "successful": 1,
        "failed": 0,
    },
    "hits": {
        "total": {
            "value": 12,
            "relation": "eq",
        }
    },
    "aggregations": {
        "group_0": {
            "buckets": [
                {
                    "key": "Python",
                    "doc_count": 8,
                    "average_demand": {"value": 4.5},
                    "total_frequency": {"value": 700},
                    "document_count": {"value": 8},
                },
                {
                    "key": "Docker",
                    "doc_count": 4,
                    "average_demand": {"value": 4.0},
                    "total_frequency": {"value": 300},
                    "document_count": {"value": 4},
                },
            ]
        }
    },
}

response_plan = make_query_plan(
    operation="aggregate",
    aggregation=make_aggregation_plan(
        group_by=[make_field("skill")],
        metrics=[
            {
                "function": "avg",
                "field": {"name": "demand_score"},
                "alias": "average_demand",
            },
            {
                "function": "sum",
                "field": {"name": "frequency"},
                "alias": "total_frequency",
            },
            {
                "function": "count_documents",
                "field": None,
                "alias": "document_count",
            },
        ],
    ),
)

aggregate_result = adapter.execute(response_plan)

assert aggregate_result["operation"] == "aggregate"
assert len(aggregate_result["buckets"]) == 2

first_bucket = aggregate_result["buckets"][0]

assert first_bucket["key"] == {"skill": "Python"}
assert first_bucket["doc_count"] == 8
assert first_bucket["metrics"]["average_demand"] == 4.5
assert first_bucket["metrics"]["total_frequency"] == 700
assert first_bucket["metrics"]["document_count"] == 8

print("Test 13 passed: Aggregate response normalization")

print("\n========== NORMALIZED AGGREGATE RESULT ==========")
pprint(aggregate_result)


# ============================================================
# Test 14: Multiple Group By Response Normalization
# ============================================================

multi_group_response = {
    "took": 7,
    "timed_out": False,
    "_shards": {"total": 1, "successful": 1, "failed": 0},
    "hits": {"total": {"value": 12, "relation": "eq"}},
    "aggregations": {
        "group_0": {
            "buckets": [
                {
                    "key": "Software",
                    "doc_count": 12,
                    "group_1": {
                        "buckets": [
                            {
                                "key": "Junior",
                                "doc_count": 8,
                                "average_demand": {"value": 4.2},
                            },
                            {
                                "key": "Mid",
                                "doc_count": 4,
                                "average_demand": {"value": 4.6},
                            },
                        ]
                    },
                }
            ]
        }
    },
}

normalized_multi_group = adapter._normalize_aggregation_response(
    response=multi_group_response,
    aggregation_plan=multi_group_plan,
    execution_time_ms=7,
)

assert len(normalized_multi_group["buckets"]) == 2

assert normalized_multi_group["buckets"][0]["key"] == {
    "job_field": "Software",
    "experience_level": "Junior",
}

assert normalized_multi_group["buckets"][1]["key"] == {
    "job_field": "Software",
    "experience_level": "Mid",
}

print("Test 14 passed: Multiple group-by response normalization")


# ============================================================
# Test 15: Global Aggregation Without Group By
# ============================================================

global_response = {
    "took": 3,
    "timed_out": False,
    "_shards": {"total": 1, "successful": 1, "failed": 0},
    "hits": {"total": {"value": 30, "relation": "eq"}},
    "aggregations": {
        "average_demand": {"value": 4.3},
    },
}

global_plan = make_query_plan(
    aggregation=make_aggregation_plan(
        metrics=[
            {
                "function": "avg",
                "field": {"name": "demand_score"},
                "alias": "average_demand",
            },
            {
                "function": "count_documents",
                "field": None,
                "alias": "document_count",
            },
        ],
    )
)

fake_client.search_response = global_response

global_result = adapter.execute(global_plan)

assert global_result["operation"] == "aggregate"
assert global_result["buckets"][0]["metrics"]["average_demand"] == 4.3
assert global_result["buckets"][0]["metrics"]["document_count"] == 30

print("Test 15 passed: Global aggregation")


# ============================================================
# Test 16: Elasticsearch Execution Error
# ============================================================

fake_client.raise_error = True

try:
    adapter.execute(count_plan)
    raise AssertionError("Elasticsearch error was not wrapped.")
except ElasticsearchAdapterError:
    pass
finally:
    fake_client.raise_error = False

print("Test 16 passed: Elasticsearch execution error handling")


# ============================================================
# Final Result
# ============================================================

print("\nAll Elasticsearch Adapter tests completed.")
