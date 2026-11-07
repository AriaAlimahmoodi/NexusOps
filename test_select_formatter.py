from tools.analytics_engine.result_formatter import ResultFormatter


execution_result = {
    "operation": "select",
    "records": [
        {
            "course_id": "C001",
            "course_name": "Algorithms",
            "course_category": "core",
            "credits": 4,
            "skills": [
                "Algorithm Design",
                "Problem Solving",
            ],
        },
        {
            "course_id": "C002",
            "course_name": "Operating Systems",
            "course_category": "core",
            "credits": 3,
            "skills": [
                "OS",
                "Systems Programming",
            ],
        },
    ],
    "returned_records": 2,
    "total_records": 2,
    "execution_time_ms": 4.25,
    "warnings": [],
}


result = ResultFormatter.format_success(
    dataset_id="university_courses",
    operation="select",
    execution_result=execution_result,
)


print("\n=== FORMATTER SELECT RESULT ===")
print(result)