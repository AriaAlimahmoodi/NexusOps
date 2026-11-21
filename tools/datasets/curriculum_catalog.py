"""Canonical course memberships for an explicitly scoped curriculum catalog."""

from tools.data_governance import OPTIONAL_PROVENANCE_FIELDS, REQUIRED_PROVENANCE_FIELDS


CURRICULUM_CATALOG_PROFILE = {
    "dataset_id": "curriculum_catalog",
    "index": "curriculum_catalog",
    "real_index": "curriculum_catalog_real",
    "description": "Course memberships in a reviewed academic program and collection batch.",
    "source_type": "elasticsearch",
    "data_classification": "synthetic",
    "document_id_fields": ["collection_batch", "program_id", "course_id"],
    "provenance_contract": {
        "required_fields": list(REQUIRED_PROVENANCE_FIELDS),
        "optional_fields": list(OPTIONAL_PROVENANCE_FIELDS),
    },
    "fields": {
        name: {"type": "keyword", "roles": ["dimension", "filter", "group_by"]}
        for name in ("program_id", "major", "study_level", "course_id", "course_name", "course_type", "skills")
    } | {"credits": {"type": "double", "roles": ["metric", "filter"]}},
    "validation": {
        "required_fields": ["program_id", "major", "study_level", "course_id", "course_name", "course_type"],
        "expected_numeric_ranges": {"credits": {"min": 0}},
    },
}


EVIDENCE_FIELDS = ('program_id', 'course_id', 'term', 'term_status', 'source_url', 'skill_id', 'source_phrase')
COURSE_EVIDENCE_PROFILE = {
    **CURRICULUM_CATALOG_PROFILE,
    "dataset_id": "course_skill_evidence",
    "index": "course_skill_evidence",
    "real_index": "course_skill_evidence_real",
    "description": "Reviewed course-skill statements with original phrase, term and source URL.",
    "document_id_fields": ["collection_batch", "program_id", "course_id", "skill_id", "source_url", "source_phrase"],
    "fields": {name: {"type": "keyword", "roles": ["dimension", "filter", "group_by"]} for name in EVIDENCE_FIELDS},
    "validation": {"required_fields": list(EVIDENCE_FIELDS)},
}
