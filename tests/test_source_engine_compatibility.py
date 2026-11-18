import pytest

from tools.source_engine.compatibility import analyze_dataset_compatibility


def _profile(columns):
    return {
        "source_name": "fixture-api",
        "row_count": 3,
        "columns": {
            name: {"inferred_type": inferred_type}
            for name, inferred_type in columns.items()
        },
    }


def _compatible_labor_market_columns():
    return {
        "market_record_id": "string",
        "skill": "string",
        "demand_score": "float",
        "frequency": "integer",
        "source": "string",
        "observed_at": "datetime",
        "collection_batch": "string",
        "time_granularity": "string",
    }


def test_compatibility_checks_dataset_and_required_provenance_fields():
    report = analyze_dataset_compatibility(
        _profile(_compatible_labor_market_columns()), "labor_market"
    )

    assert report["decision"] == "compatible"
    assert report["missing_required_dataset_fields"] == []
    assert report["missing_required_provenance_fields"] == []
    assert report["optional_provenance_fields_not_present"] == [
        "published_at", "valid_from", "valid_until",
    ]
    assert report["mapping_created"] is False
    assert report["registry_mutated"] is False


def test_compatibility_reports_missing_canonical_dataset_fields():
    columns = _compatible_labor_market_columns()
    del columns["frequency"]
    report = analyze_dataset_compatibility(_profile(columns), "labor_market")

    assert report["decision"] == "incompatible"
    assert report["missing_required_dataset_fields"] == ["frequency"]
    assert "frequency" in report["missing_required_fields"]


def test_compatibility_reports_missing_required_provenance_separately():
    columns = _compatible_labor_market_columns()
    del columns["observed_at"]
    report = analyze_dataset_compatibility(_profile(columns), "labor_market")

    assert report["decision"] == "incompatible"
    assert report["missing_required_provenance_fields"] == ["observed_at"]
    assert report["missing_required_dataset_fields"] == []


def test_compatibility_checks_provenance_physical_types():
    columns = _compatible_labor_market_columns()
    columns["observed_at"] = "string"
    report = analyze_dataset_compatibility(_profile(columns), "labor_market")

    observed_at = next(
        item for item in report["fields"]
        if item["source_field"] == "observed_at"
    )
    assert observed_at["field_class"] == "provenance"
    assert observed_at["target_type"] == "date"
    assert observed_at["same_name_type_compatible"] is False
    assert report["decision"] == "incompatible"


def test_unknown_source_field_remains_unmatched_and_requires_review():
    columns = _compatible_labor_market_columns()
    columns["vendor_extension"] = "string"
    report = analyze_dataset_compatibility(_profile(columns), "labor_market")

    extension = next(
        item for item in report["fields"]
        if item["source_field"] == "vendor_extension"
    )
    assert extension["field_class"] == "unmatched"
    assert extension["same_name_target_exists"] is False
    assert extension["same_name_type_compatible"] is None
    assert report["decision"] == "partially_compatible"


@pytest.mark.parametrize("source_type", ["unknown", "mixed"])
def test_unknown_or_mixed_source_type_is_not_misclassified_as_mismatch(source_type):
    columns = _compatible_labor_market_columns()
    columns["demand_score"] = source_type
    report = analyze_dataset_compatibility(_profile(columns), "labor_market")

    demand_score = next(
        item for item in report["fields"]
        if item["source_field"] == "demand_score"
    )
    assert demand_score["same_name_type_compatible"] is None
    assert report["decision"] == "partially_compatible"

def test_string_arrays_are_compatible_with_keyword_fields():
    columns = _compatible_labor_market_columns()
    profile = _profile(columns)
    profile["columns"]["skill"] = {
        "inferred_type": "json_array",
        "json_array_item_types": {"str": 3},
    }

    report = analyze_dataset_compatibility(profile, "labor_market")
    skill = next(
        item for item in report["fields"] if item["source_field"] == "skill"
    )

    assert skill["same_name_type_compatible"] is True


def test_non_string_arrays_are_not_compatible_with_keyword_fields():
    columns = _compatible_labor_market_columns()
    profile = _profile(columns)
    profile["columns"]["skill"] = {
        "inferred_type": "json_array",
        "json_array_item_types": {"dict": 3},
    }

    report = analyze_dataset_compatibility(profile, "labor_market")
    skill = next(
        item for item in report["fields"] if item["source_field"] == "skill"
    )

    assert skill["same_name_type_compatible"] is False
    assert report["decision"] == "incompatible"

