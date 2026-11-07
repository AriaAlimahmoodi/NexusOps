"""
University Courses Dataset Profile

This module defines the semantic and analytical configuration
of the university_courses dataset.

Important:
- Elasticsearch mapping and runtime statistics are discovered dynamically.
- This profile contains stable semantic configuration.
- Observed values and dataset statistics must NOT be hardcoded here.
"""

UNIVERSITY_COURSES_PROFILE = {
    # ---------------------------------------------------------
    # Dataset identification
    # ---------------------------------------------------------

    "dataset_id": "university_courses",

    "index": "university_courses",

    "description": (
        "University courses dataset containing course identifiers, "
        "course names, course categories, credit values, and skills."
    ),

    "source_type": "elasticsearch",

    "primary_key": "course_id",

    # ---------------------------------------------------------
    # Field definitions
    #
    # Field types must be checked against the live ES mapping.
    # Roles describe semantic meaning, not Elasticsearch types.
    # ---------------------------------------------------------

    "fields": {

        "course_id": {
            "type": "keyword",
            "roles": [
                "identifier",
                "filter"
            ],
        },

        "course_name": {
            "type": "keyword",
            "roles": [
                "dimension",
                "filter",
                "group_by"
            ],
        },

        "course_category": {
            "type": "keyword",
            "roles": [
                "dimension",
                "filter",
                "group_by"
            ],
        },

        "credits": {
            "type": "integer",
            "roles": [
                "metric",
                "filter",
                "sort"
            ],
            "aggregations": [
                "sum",
                "avg",
                "min",
                "max"
            ],
        },

        "skills": {
            "type": "keyword",
            "roles": [
                "dimension",
                "filter",
                "group_by"
            ],
        },
    },

    # ---------------------------------------------------------
    # Default analytical configuration
    # ---------------------------------------------------------

    "default_group_by": "course_category",

    "default_metrics": {

        "total_credits": {
            "field": "credits",
            "aggregation": "sum",
        },

        "average_credits": {
            "field": "credits",
            "aggregation": "avg",
        },
    },

    # ---------------------------------------------------------
    # Dataset-specific analytical semantics
    # ---------------------------------------------------------

    "analytical_semantics": {

        "dimensions": [
            "course_name",
            "course_category",
            "skills",
        ],

        "metrics": [
            "credits",
        ],

        "default_sort": {
            "field": "credits",
            "aggregation": "sum",
            "order": "desc",
        },
    },

    # ---------------------------------------------------------
    # Validation policy
    #
    # These are domain expectations, not observed statistics.
    # Runtime profiling must independently inspect actual data.
    # ---------------------------------------------------------

    "validation": {

        "required_fields": [
            "course_id",
            "course_name",
            "course_category",
            "credits",
            "skills",
        ],

        "expected_numeric_ranges": {

            "credits": {
                "min": 0,
                "basis": "domain_expectation",
            },
        },
    },
}