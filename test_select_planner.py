from tools.analytics_engine.query_executor import QueryExecutor


class FakeAdapter:
    def execute(self, plan):
        return plan


executor = QueryExecutor(adapter=FakeAdapter())

resolved_request = {
    "dataset": {
        "dataset_id": "university_courses",
        "index": "university_courses",
        "source_type": "elasticsearch",
        "schema_consistent": True,
    },
    "operation": "select",
    "filters": None,
    "sort": [
        {
            "field": "credits",
            "order": "desc",
        }
    ],
    "limit": 10,
    "options": {},
}

result = executor.execute(resolved_request)

print(result)