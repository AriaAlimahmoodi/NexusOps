from copy import deepcopy

from tools.datasets.course_graduate_records import COURSE_GRADUATE_RECORDS_PROFILE
from tools.datasets.labor_market import LABOR_MARKET_PROFILE
from tools.datasets.skill_mapping import SKILL_MAPPING_PROFILE
from tools.datasets.university_courses import UNIVERSITY_COURSES_PROFILE
from tools.datasets.university_graduates import UNIVERSITY_GRADUATES_PROFILE


DATASET_PROFILES = {
    profile["dataset_id"]: profile
    for profile in (
        LABOR_MARKET_PROFILE,
        UNIVERSITY_COURSES_PROFILE,
        UNIVERSITY_GRADUATES_PROFILE,
        COURSE_GRADUATE_RECORDS_PROFILE,
        SKILL_MAPPING_PROFILE,
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
