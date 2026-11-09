from __future__ import annotations

from copy import deepcopy

import pytest

from tools.analytics_engine.analytics_service import AnalyticsService
from tools.analytics_engine.models import (
    AnalyticsOperation,
    AnalyticsRequest,
    FilterCondition,
    FilterGroup,
    FilterLogic,
    FilterOperator,
    MetricFunction,
    MetricSpec,
    SortOrder,
    SortSpec,
)


DATASET_ID = "pipeline_fixture"

PROFILE = {
    "dataset_id": DATASET_ID,
    "index": "pipeline-fixture-index",
    "source_type": "elasticsearch",
    "fields": {
        "major": {"type": "keyword", "roles": ["group_by", "filter", "sort"]},
        "career_relevance": {"type": "float", "roles": ["metric", "filter", "sort"]},
        "employment_months": {"type": "integer", "roles": ["metric", "filter", "sort"]},
    },
}

ACTUAL_FIELDS = {
    "major": {
        "types": ["keyword"], "mapping_type": "keyword",
        "searchable": True, "aggregatable": True, "type_conflict": False,
    },
    "career_relevance": {
        "types": ["float"], "mapping_type": "float",
        "searchable": True, "aggregatable": True, "type_conflict": False,
    },
    "employment_months": {
        "types": ["integer"], "mapping_type": "integer",
        "searchable": True, "aggregatable": True, "type_conflict": False,
    },
}

SCHEMA = {
    "schema_consistent": True,
    "actual_fields": ACTUAL_FIELDS,
    "comparison": {},
}


class RecordingAdapter:
    def __init__(self, result):
        self.result = deepcopy(result)
        self.plans = []

    def execute(self, plan):
        self.plans.append(deepcopy(plan))
        return deepcopy(self.result)


@pytest.fixture
def pipeline_environment(monkeypatch):
    import tools.analytics_engine.field_resolver as field_resolver
    import tools.analytics_engine.query_validator as query_validator

    monkeypatch.setattr(field_resolver, "get_dataset_profile", lambda dataset_id: deepcopy(PROFILE))
    monkeypatch.setattr(field_resolver, "discover_dataset_schema", lambda dataset_id: deepcopy(SCHEMA))
    monkeypatch.setattr(query_validator, "get_dataset_profile", lambda dataset_id: deepcopy(PROFILE))
    monkeypatch.setattr(query_validator, "discover_dataset_schema", lambda dataset_id: deepcopy(SCHEMA))


def test_analytics_pipeline_executes_nested_filters_and_formats_aggregate(pipeline_environment):
    adapter = RecordingAdapter({
        "operation": "aggregate",
        "buckets": [{
            "key": {"major": "Computer Engineering"},
            "doc_count": 7,
            "metrics": {"avg_relevance": 4.4},
        }],
        "execution_time_ms": 3.5,
        "total_records": None,
        "warnings": [],
    })
    nested_filters = FilterGroup(
        logic=FilterLogic.AND,
        conditions=(
            FilterCondition("career_relevance", FilterOperator.GTE, 4),
            FilterGroup(
                logic=FilterLogic.OR,
                conditions=(
                    FilterCondition("employment_months", FilterOperator.GT, 6),
                    FilterCondition("major", FilterOperator.EQ, "Computer Engineering"),
                ),
            ),
        ),
    )
    request = AnalyticsRequest(
        dataset_id=DATASET_ID,
        operation=AnalyticsOperation.AGGREGATE,
        group_by=("major",),
        metrics=(
            MetricSpec(MetricFunction.AVG, "career_relevance", "avg_relevance"),
        ),
        filters=nested_filters,
        sort=(SortSpec("avg_relevance", SortOrder.DESC),),
        limit=25,
    )

    response = AnalyticsService(adapter=adapter).analyze(request)

    assert response["status"] == "success"
    assert response["dataset_id"] == DATASET_ID
    assert response["operation"] == "aggregate"
    assert response["result"]["buckets"] == [{
        "group": {"major": "Computer Engineering"},
        "metrics": {"avg_relevance": 4.4},
        "document_count": 7,
    }]
    assert response["metadata"]["returned_records"] == 1
    assert response["metadata"]["total_records"] is None
    assert adapter.plans[0]["filters"] == {
        "node_type": "group",
        "logic": "and",
        "children": [
            {
                "node_type": "condition",
                "field": {
                    "name": "career_relevance",
                    "profile_type": "float",
                    "actual_types": ["float"],
                    "mapping_type": "float",
                    "searchable": True,
                },
                "operator": "gte",
                "value": 4,
            },
            {
                "node_type": "group",
                "logic": "or",
                "children": [
                    {
                        "node_type": "condition",
                        "field": {
                            "name": "employment_months",
                            "profile_type": "integer",
                            "actual_types": ["integer"],
                            "mapping_type": "integer",
                            "searchable": True,
                        },
                        "operator": "gt",
                        "value": 6,
                    },
                    {
                        "node_type": "condition",
                        "field": {
                            "name": "major",
                            "profile_type": "keyword",
                            "actual_types": ["keyword"],
                            "mapping_type": "keyword",
                            "searchable": True,
                        },
                        "operator": "eq",
                        "value": "Computer Engineering",
                    },
                ],
            },
        ],
    }
    assert adapter.plans[0]["aggregation"]["metrics"][0]["alias"] == "avg_relevance"
    assert adapter.plans[0]["aggregation"]["sort"] == [{
        "target_type": "metric",
        "target": "avg_relevance",
        "order": "desc",
    }]


def test_analytics_pipeline_count_preserves_exact_filtered_count(pipeline_environment):
    adapter = RecordingAdapter({
        "operation": "count",
        "count": 12,
        "execution_time_ms": 1,
        "warnings": [],
    })
    request = AnalyticsRequest(
        dataset_id=DATASET_ID,
        operation=AnalyticsOperation.COUNT,
        filters=FilterGroup(
            logic=FilterLogic.AND,
            conditions=(
                FilterCondition("career_relevance", FilterOperator.GTE, 4),
            ),
        ),
    )

    response = AnalyticsService(adapter=adapter).analyze(request)

    assert response["status"] == "success"
    assert response["result"] == {"count": 12}
    assert response["metadata"]["returned_records"] == 1
    assert response["metadata"]["total_records"] == 12
    assert adapter.plans[0]["operation"] == "count"
    assert adapter.plans[0]["filters"]["children"][0]["value"] == 4


def test_analytics_pipeline_select_preserves_records_sort_and_totals(pipeline_environment):
    records = [
        {"major": "Computer Engineering", "career_relevance": 4.7},
        {"major": "Computer Engineering", "career_relevance": 4.2},
    ]
    adapter = RecordingAdapter({
        "operation": "select",
        "records": records,
        "returned_records": 2,
        "total_records": 9,
        "execution_time_ms": 2,
        "warnings": [],
    })
    request = AnalyticsRequest(
        dataset_id=DATASET_ID,
        operation=AnalyticsOperation.SELECT,
        filters=FilterGroup(
            logic=FilterLogic.AND,
            conditions=(
                FilterCondition("career_relevance", FilterOperator.GTE, 4),
            ),
        ),
        sort=(SortSpec("career_relevance", SortOrder.DESC),),
        limit=2,
    )

    response = AnalyticsService(adapter=adapter).analyze(request)

    assert response["status"] == "success"
    assert response["result"] == records
    assert response["metadata"]["returned_records"] == 2
    assert response["metadata"]["total_records"] == 9
    assert adapter.plans[0]["sort"] == [{
        "field": "career_relevance",
        "order": "desc",
    }]
    assert adapter.plans[0]["limit"] == 2


def test_analytics_pipeline_rejects_profile_schema_drift_before_adapter_execution(
    pipeline_environment, monkeypatch
):
    import tools.analytics_engine.field_resolver as field_resolver
    import tools.analytics_engine.query_validator as query_validator

    inconsistent_schema = deepcopy(SCHEMA)
    inconsistent_schema["schema_consistent"] = False
    monkeypatch.setattr(
        field_resolver, "discover_dataset_schema",
        lambda dataset_id: deepcopy(inconsistent_schema),
    )
    monkeypatch.setattr(
        query_validator, "discover_dataset_schema",
        lambda dataset_id: deepcopy(inconsistent_schema),
    )
    adapter = RecordingAdapter({
        "operation": "count", "count": 0,
        "execution_time_ms": 0, "warnings": [],
    })
    request = AnalyticsRequest(
        dataset_id=DATASET_ID,
        operation=AnalyticsOperation.COUNT,
    )

    with pytest.raises(Exception, match="inconsistent"):
        AnalyticsService(adapter=adapter).analyze(request)

    assert adapter.plans == []
