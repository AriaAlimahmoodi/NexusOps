from copy import deepcopy

from tools.datasets.course_graduate_records import COURSE_GRADUATE_RECORDS_PROFILE
from tools.datasets.curriculum_catalog import COURSE_EVIDENCE_PROFILE, CURRICULUM_CATALOG_PROFILE
from tools.datasets.job_postings import JOB_POSTINGS_PROFILE
from tools.datasets.labor_market import LABOR_MARKET_PROFILE
from tools.datasets.skill_mapping import SKILL_MAPPING_PROFILE
from tools.datasets.university_courses import UNIVERSITY_COURSES_PROFILE
from tools.datasets.university_graduates import UNIVERSITY_GRADUATES_PROFILE
from tools.datasets.us_public import (
    US_COLLEGE_INSTITUTIONS_PROFILE,
    US_UNEMPLOYMENT_MONTHLY_PROFILE,
)


DATASET_PROFILES = {
    profile["dataset_id"]: profile
    for profile in (
        LABOR_MARKET_PROFILE,
        JOB_POSTINGS_PROFILE,
        UNIVERSITY_COURSES_PROFILE,
        UNIVERSITY_GRADUATES_PROFILE,
        COURSE_GRADUATE_RECORDS_PROFILE,
        SKILL_MAPPING_PROFILE,
        US_UNEMPLOYMENT_MONTHLY_PROFILE,
        US_COLLEGE_INSTITUTIONS_PROFILE,
        COURSE_EVIDENCE_PROFILE,
        CURRICULUM_CATALOG_PROFILE,
    )
}


def get_dataset_profile(dataset_id: str) -> dict:
    """Return an isolated copy of a registered dataset profile."""
    profile = DATASET_PROFILES.get(dataset_id)
    if profile is None:
        raise ValueError(f"Dataset '{dataset_id}' is not registered.")
    return deepcopy(profile)


def list_registered_datasets() -> list[dict]:
    """Return basic information about all registered datasets."""
    return [
        {
            "dataset_id": profile["dataset_id"],
            "index": profile["index"],
            "description": profile["description"],
            "data_classification": profile.get("data_classification", "unspecified"),
            "real_index": profile.get("real_index"),
        }
        for profile in DATASET_PROFILES.values()
    ]


def validate_dataset_field(
    dataset_id: str,
    field: str,
    required_role: str,
) -> bool:
    """Validate whether a field supports a specific analytical role."""
    profile = get_dataset_profile(dataset_id)
    field_config = profile["fields"].get(field)

    if field_config is None:
        raise ValueError(
            f"Field '{field}' does not exist in dataset '{dataset_id}'."
        )

    if required_role not in field_config["roles"]:
        raise ValueError(
            f"Field '{field}' does not support the role '{required_role}'."
        )

    return True


def get_dataset_index(dataset_id: str, classification: str = "synthetic") -> str:
    """Resolve the isolated Elasticsearch index for a registered data class."""
    profile = get_dataset_profile(dataset_id)
    if classification == "synthetic":
        return profile["index"]
    if classification == "real":
        return profile["real_index"]
    raise ValueError("classification must be 'synthetic' or 'real'.")


def get_dataset_query_fields(profile: dict, classification: str) -> dict:
    """Expose registered real-data provenance for querying, outside analytical profiles."""
    fields = dict(profile.get("fields", {}))
    if classification == "real":
        required = profile.get("provenance_contract", {}).get("required_fields", [])
        for name in ("source", "collection_batch", "time_granularity"):
            if name in required:
                fields[name] = {"type": "keyword", "roles": ["filter", "group_by"]}
    return fields


def canonical_mapping(dataset_id: str) -> dict:
    profile = get_dataset_profile(dataset_id)
    properties = {
        field: {"type": config["type"]}
        for field, config in profile.get("fields", {}).items()
        if config.get("type")
    }

    provenance_contract = profile.get("provenance_contract", {})
    timestamp_fields = {"observed_at", "published_at", "valid_from", "valid_until"}
    for field in (
        list(provenance_contract.get("required_fields", []))
        + list(provenance_contract.get("optional_fields", []))
    ):
        properties[field] = {
            "type": "date" if field in timestamp_fields else "keyword"
        }

    properties["data_classification"] = {"type": "keyword"}
    return {"dynamic": "strict", "properties": properties}
