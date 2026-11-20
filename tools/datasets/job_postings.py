"""Canonical posting-level job market observations."""

from tools.data_governance import OPTIONAL_PROVENANCE_FIELDS, REQUIRED_PROVENANCE_FIELDS


JOB_POSTINGS_PROFILE = {
    "dataset_id": "job_postings",
    "index": "job_postings",
    "real_index": "job_postings_real",
    "description": "One source posting per row within a collection snapshot.",
    "source_type": "elasticsearch",
    "data_classification": "synthetic",
    "document_id_fields": ["collection_batch", "posting_id"],
    "provenance_contract": {
        "required_fields": list(REQUIRED_PROVENANCE_FIELDS),
        "optional_fields": list(OPTIONAL_PROVENANCE_FIELDS),
    },
    "fields": {
        name: {"type": "keyword", "roles": ["dimension", "filter", "group_by"]}
        for name in ("posting_id", "job_field", "activation_month", "skills", "raw_skill_labels", "posting_title")
    } | {"skill_count": {"type": "integer", "roles": ["metric", "filter"]}},
    "validation": {
        "required_fields": ["posting_id", "job_field", "activation_month", "skills", "skill_count"],
        "expected_numeric_ranges": {"skill_count": {"min": 0}},
    },
}
