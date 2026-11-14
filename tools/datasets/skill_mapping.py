"""
University-Market Skill Mapping Dataset Profile.

Each document represents a skill-to-course mapping enriched with
course coverage, market demand, and market-gap values.
"""

SKILL_MAPPING_PROFILE = {
    "dataset_id": "skill_mapping",
    "index": "skill_mapping",
    "description": (
        "University-to-market skill mapping records containing the "
        "associated course and precomputed coverage, demand, and gap."
    ),
    "source_type": "elasticsearch",
    "data_classification": "synthetic",
    "document_id_fields": ["skill","course_id"],
    "real_index": "skill_mapping_real",
    "provenance_contract": {
        "required_fields": ["source", "observed_at", "collection_batch", "time_granularity"],
        "optional_fields": ["published_at", "valid_from", "valid_until"],
    },
    "fields": {
        "skill": {
            "type": "keyword",
            "roles": ["dimension", "filter", "group_by"],
        },
        "course_id": {
            "type": "keyword",
            "roles": ["dimension", "filter", "group_by"],
        },
        "course_name": {
            "type": "keyword",
            "roles": ["dimension", "filter", "group_by"],
        },
        "course_coverage": {
            "type": "float",
            "roles": ["metric", "filter", "sort"],
            "aggregations": ["avg", "min", "max"],
        },
        "market_demand": {
            "type": "float",
            "roles": ["metric", "filter", "sort"],
            "aggregations": ["avg", "min", "max"],
        },
        "market_gap": {
            "type": "float",
            "roles": ["metric", "filter", "sort"],
            "aggregations": ["avg", "min", "max"],
        },

    },
    "default_group_by": "skill",
    "default_metrics": {
        "average_course_coverage": {
            "field": "course_coverage",
            "aggregation": "avg",
        },
        "average_market_demand": {
            "field": "market_demand",
            "aggregation": "avg",
        },
        "average_market_gap": {
            "field": "market_gap",
            "aggregation": "avg",
        },
    },
    "analytical_semantics": {
        "dimensions": ["skill", "course_id", "course_name"],
        "metrics": ["course_coverage", "market_demand", "market_gap"],
    },
    "validation": {
        "required_fields": [
            "skill", "course_id", "course_name", "course_coverage",
            "market_demand", "market_gap",
        ],
    },
}
