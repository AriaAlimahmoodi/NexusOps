"""
Course-Graduate Records Dataset Profile.

This is a denormalized relationship dataset. Registering it enables
single-index analytics only; it does not implement cross-index JOINs.
"""

COURSE_GRADUATE_RECORDS_PROFILE = {
    "dataset_id": "course_graduate_records",
    "index": "course_graduate_records",
    "description": (
        "Course-to-graduate relationship records with course identity, "
        "graduate identity, job field, and related skills."
    ),
    "source_type": "elasticsearch",
    "fields": {
        "course_id": {
            "type": "keyword",
            "roles": ["identifier", "dimension", "filter", "group_by"],
        },
        "course_name": {
            "type": "keyword",
            "roles": ["dimension", "filter", "group_by"],
        },
        "graduate_id": {
            "type": "keyword",
            "roles": ["dimension", "filter", "group_by"],
        },
        "job_field": {
            "type": "keyword",
            "roles": ["dimension", "filter", "group_by"],
        },
        "related_skills": {
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
    "default_group_by": "course_name",
    "default_metrics": {
        "relationship_record_count": {
            "function": "count_documents",
        },
    },
    "analytical_semantics": {
        "dimensions": [
            "course_id", "course_name", "graduate_id",
            "job_field", "related_skills",
        ],
        "metrics": [],
    },
    "validation": {
        "required_fields": [
            "course_id", "course_name", "graduate_id",
            "job_field", "related_skills",
        ],
    },
}
