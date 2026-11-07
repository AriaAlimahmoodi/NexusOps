from tools.adapters.elasticsearch_adapter import ElasticsearchAdapter
from config import get_elasticsearch_client


client = get_elasticsearch_client()

adapter = ElasticsearchAdapter(client=client)


query_plan = {
    "plan_version": "1.0",

    "dataset": {
        "dataset_id": "university_courses",
        "index": "university_courses",
        "source_type": "elasticsearch",
        "schema_consistent": True,
    },

    "operation": "select",

    "filters": {
        "node_type": "condition",
        "field": {
            "name": "credits",
        },
        "operator": "gt",
        "value": 3,
    },

    "options": {},

    "sort": [
        {
            "field": "credits",
            "order": "desc",
        }
    ],

    "limit": 10,
}


result = adapter.execute(query_plan)

print("\n=== SELECT RESULT ===")

print(result)