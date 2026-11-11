import pytest

from tools.analytics_engine.models import FilterLogic
from tools.analytics_tool import build_analytics_request, run_analytics_query


def test_nested_filter_groups_are_preserved_recursively():
    request = build_analytics_request({
        "dataset_id": "labor_market",
        "operation": "select",
        "filters": {
            "logic": "and",
            "conditions": [
                {"field": "job_field", "operator": "eq", "value": "Software"}
            ],
            "groups": [
                {
                    "logic": "or",
                    "conditions": [
                        {"field": "skill", "operator": "eq", "value": "Python"},
                        {"field": "skill", "operator": "eq", "value": "SQL"}
                    ],
                    "groups": []
                }
            ]
        },
        "limit": 10
    })

    assert request.filters.logic is FilterLogic.AND
    nested = request.filters.conditions[1]
    assert nested.logic is FilterLogic.OR
    assert [item.value for item in nested.conditions] == ["Python", "SQL"]


def test_invalid_aggregate_request_returns_structured_error_without_connecting(monkeypatch):
    import tools.analytics_tool as analytics_tool

    def unexpected_connection():
        raise AssertionError("Elasticsearch must not be initialized for invalid input")

    monkeypatch.setattr(analytics_tool, "get_elasticsearch_client", unexpected_connection)

    result = run_analytics_query({
        "dataset_id": "labor_market",
        "operation": "aggregate",
        "group_by": [],
        "metrics": []
    })

    assert result["status"] == "error"
    assert result["error"]["code"] == "INVALID_ANALYTICS_REQUEST"
    assert result["error"]["stage"] == "request_validation"


def test_client_initialization_failure_returns_structured_error(monkeypatch):
    import tools.analytics_tool as analytics_tool

    def fail_connection():
        raise ConnectionError("simulated unavailable Elasticsearch")

    monkeypatch.setattr(analytics_tool, "get_elasticsearch_client", fail_connection)

    result = run_analytics_query({
        "dataset_id": "labor_market",
        "operation": "count"
    })

    assert result["status"] == "error"
    assert result["error"]["code"] == "ANALYTICS_CLIENT_INITIALIZATION_FAILED"
    assert result["error"]["stage"] == "client_initialization"
    assert result["error"]["exception_type"] == "ConnectionError"
