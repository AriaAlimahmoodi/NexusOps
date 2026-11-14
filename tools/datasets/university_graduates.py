"""
University Graduates Dataset Profile.

The profile describes the documented graduate-record fields.
Runtime Elasticsearch mappings and field capabilities remain authoritative.
"""

UNIVERSITY_GRADUATES_PROFILE = {
    "dataset_id": "university_graduates",
    "index": "university_graduates",
    "description": (
        "Graduate records containing academic background, employment "
        "outcomes, career relevance, and additional skills."
    ),
    "source_type": "elasticsearch",
    "data_classification": "synthetic",
    "document_id_fields": ["graduate_id"],
    "real_index": "university_graduates_real",
    "provenance_contract": {
        "required_fields": ["source", "observed_at", "collection_batch", "time_granularity"],
        "optional_fields": ["published_at", "valid_from", "valid_until"],
    },
    "fields": {
        "graduate_id": {
            "type": "keyword",
            "roles": ["identifier", "filter"],
        },
        "major": {
            "type": "keyword",
            "roles": ["dimension", "filter", "group_by"],
        },
        "graduation_year": {
            "type": "integer",
            "roles": ["dimension", "filter", "group_by", "sort"],
        },
        "study_level": {
            "type": "keyword",
            "roles": ["dimension", "filter", "group_by"],
        },
        "job_title": {
            "type": "keyword",
            "roles": ["dimension", "filter", "group_by"],
        },
        "job_field": {
            "type": "keyword",
            "roles": ["dimension", "filter", "group_by"],
        },
        "employment_months": {
            "type": "integer",
            "roles": ["metric", "filter", "sort"],
            "aggregations": ["sum", "avg", "min", "max"],
        },
        "career_relevance": {
            "type": "float",
            "roles": ["metric", "filter", "sort"],
            "aggregations": ["avg", "min", "max"],
        },
        "additional_training": {
            "type": "boolean",
            "roles": ["dimension", "filter", "group_by"],
        },
        "additional_skills": {
            "type": "keyword",
            "roles": ["dimension", "filter", "group_by"],
        },

        "source": {
            "type": "keyword",
            "roles": ["dimension", "filter", "group_by"],
        },
        "observed_at": {
            "type": "date",
            "roles": ["dimension", "filter", "group_by", "sort"],
        },
        "published_at": {
            "type": "date",
            "roles": ["dimension", "filter", "group_by", "sort"],
        },
        "collection_batch": {
            "type": "keyword",
            "roles": ["dimension", "filter", "group_by"],
        },
    },
    "default_group_by": "major",
    "default_metrics": {
        "average_career_relevance": {
            "field": "career_relevance",
            "aggregation": "avg",
        },
        "average_employment_months": {
            "field": "employment_months",
            "aggregation": "avg",
        },
    },
    "analytical_semantics": {
        "dimensions": [
            "major", "graduation_year", "study_level",
            "job_title", "job_field", "additional_training",
            "additional_skills",
        ],
        "metrics": ["employment_months", "career_relevance"],
    },
    "validation": {
        "required_fields": [
            "graduate_id", "major", "graduation_year", "study_level",
            "job_title", "job_field", "employment_months",
            "career_relevance", "additional_training", "additional_skills",
        ],
    },
}
