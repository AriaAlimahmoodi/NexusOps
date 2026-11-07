from copy import deepcopy

from tools.datasets.labor_market import LABOR_MARKET_PROFILE
from tools.datasets.university_courses import UNIVERSITY_COURSES_PROFILE


DATASET_PROFILES = {
    LABOR_MARKET_PROFILE["dataset_id"]: LABOR_MARKET_PROFILE,
    UNIVERSITY_COURSES_PROFILE["dataset_id"]: UNIVERSITY_COURSES_PROFILE,
}







def get_dataset_profile(dataset_id: str) -> dict:
    """
    Return the configuration profile of a registered dataset.
    """

    profile = DATASET_PROFILES.get(dataset_id)

    if profile is None:
        raise ValueError(
            f"Dataset '{dataset_id}' is not registered."
        )

    return deepcopy(profile)


def list_registered_datasets() -> list[dict]:
    """
    Return basic information about registered datasets.
    """

    return [
        {
            "dataset_id": profile["dataset_id"],
            "index": profile["index"],
            "description": profile["description"],
        }
        for profile in DATASET_PROFILES.values()
    ]


def validate_dataset_field(
    dataset_id: str,
    field: str,
    required_role: str,
) -> bool:
    """
    Validate whether a field supports a specific operation.
    """

    profile = get_dataset_profile(dataset_id)

    field_config = profile["fields"].get(field)

    if field_config is None:
        raise ValueError(
            f"Field '{field}' does not exist "
            f"in dataset '{dataset_id}'."
        )

    if required_role not in field_config["roles"]:
        raise ValueError(
            f"Field '{field}' does not support "
            f"the role '{required_role}'."
        )

    return True
