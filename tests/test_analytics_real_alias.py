from types import SimpleNamespace

import pytest

from tools.adapters.elasticsearch_adapter import ElasticsearchAdapter
from tools.analytics_engine.analytics_service import AnalyticsService
from tools.analytics_engine.models import AnalyticsModelError, AnalyticsRequest
from tools.dataset_registry import get_dataset_query_fields, get_dataset_profile
from tools.datasets import schema_discovery


@pytest.mark.parametrize(("dataset_id","classification"), [
    ("curriculum_catalog", "real"),
    ("us_unemployment_monthly", "real"),
    ("us_college_institutions", "real"),
    ("university_courses", "synthetic"),
    ("university_graduates", "synthetic"),
    ("course_graduate_records", "synthetic"),
    ("labor_market", "synthetic"),
    ("skill_mapping", "synthetic"),
])
def test_schema_and_elasticsearch_count_use_the_same_registered_target(
    monkeypatch, dataset_id, classification,
):
    profile = get_dataset_profile(dataset_id)
    index = profile["real_index" if classification == "real" else "index"]
    fields = get_dataset_query_fields(profile, classification)
    lookups = []

    def mapping(client, target):
        lookups.append(target)
        return {key: {"type": spec["type"]} for key, spec in fields.items()}

    def caps(client, target):
        lookups.append(target)
        return {
            key: {spec["type"]: {"searchable": True, "aggregatable": True}}
            for key, spec in fields.items()
        }

    def count(*, index, query):
        lookups.append(index)
        if classification == "real":
            assert "'term': {'collection_batch': 'test-batch'}" in str(query)
        return {"count": 3}

    monkeypatch.setattr(schema_discovery, "get_elasticsearch_client", lambda: object())
    monkeypatch.setattr(schema_discovery, "_discover_mappings", mapping)
    monkeypatch.setattr(schema_discovery, "_discover_field_capabilities", caps)
    args = {"dataset_id": dataset_id, "operation": "count"}
    if classification == "real":
        args["options"] = {"data_classification": "real"}
        args["filters"] = {
            "logic": "and",
            "conditions": [{"field": "collection_batch", "operator": "eq", "value": "test-batch"}],
        }
    result = AnalyticsService(adapter=ElasticsearchAdapter(client=SimpleNamespace(count=count))).analyze(
        AnalyticsRequest.from_dict(args)
    )
    assert result["result"]["count"] == 3
    assert lookups == [index] * 5
    if classification == "real":
        assert result["data_source"] == {"classification": "real", "index": index}


def test_arbitrary_index_is_not_a_valid_classification():
    with pytest.raises(AnalyticsModelError, match="data_classification"):
        AnalyticsRequest.from_dict({
            "dataset_id": "curriculum_catalog",
            "operation": "count",
            "options": {"data_classification": "*"},
        })
