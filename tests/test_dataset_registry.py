import pytest

from tools.dataset_registry import (
    DATASET_PROFILES,
    get_dataset_profile,
    list_registered_datasets,
    validate_dataset_field,
)


EXPECTED_DATASETS = {
    "university_courses",
    "labor_market",
    "university_graduates",
    "course_graduate_records",
    "skill_mapping",
}


def test_all_primary_indexes_are_registered_for_single_dataset_analytics():
    assert set(DATASET_PROFILES) == EXPECTED_DATASETS
    assert {
        item["index"] for item in list_registered_datasets()
    } == EXPECTED_DATASETS


@pytest.mark.parametrize(
    ("dataset_id", "field", "role"),
    [
        ("university_graduates", "career_relevance", "metric"),
        ("university_graduates", "major", "group_by"),
        ("course_graduate_records", "graduate_id", "filter"),
        ("course_graduate_records", "course_name", "group_by"),
        ("skill_mapping", "market_gap", "metric"),
        ("skill_mapping", "skill", "group_by"),
        ("labor_market", "demand_score", "metric"),
        ("university_courses", "course_name", "group_by"),
    ],
)
def test_registered_field_roles(dataset_id, field, role):
    assert validate_dataset_field(dataset_id, field, role) is True


def test_profile_is_returned_as_deep_copy():
    profile = get_dataset_profile("skill_mapping")
    profile["fields"]["market_gap"]["roles"].clear()

    fresh_profile = get_dataset_profile("skill_mapping")
    assert "metric" in fresh_profile["fields"]["market_gap"]["roles"]


def test_unknown_dataset_is_rejected():
    with pytest.raises(ValueError, match="not registered"):
        get_dataset_profile("unknown_dataset")


def test_registered_profiles_separate_synthetic_and_real_indexes():
    from tools.dataset_registry import get_dataset_index

    for dataset_id, profile in DATASET_PROFILES.items():
        assert profile["data_classification"] == "synthetic"
        assert profile["real_index"] == f"{dataset_id}_real"
        assert get_dataset_index(dataset_id, "synthetic") == dataset_id
        assert get_dataset_index(dataset_id, "real") == f"{dataset_id}_real"
