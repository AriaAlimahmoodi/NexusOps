from tools.analytics_tool import run_analytics_query


result = run_analytics_query({
    "dataset_id": "university_courses",
    "operation": "aggregate",
    "group_by": ["course_name"],
    "metrics": [],
    "filters": {
        "logic": "and",
        "conditions": [
            {
                "field": "credits",
                "operator": "gt",
                "value": 3
            }
        ]
    },
    "sort": [],
    "limit": 10,
    "options": {}
})

print(result)