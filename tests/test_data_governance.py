import pytest

from tools.data_governance import (
    audit_dataset_provenance,
    audit_skill_mapping,
    validate_record_provenance,
)


def test_provenance_accepts_traceable_timezone_aware_record():
    record = {
        "source": "https://example.org/dataset/record-1",
        "observed_at": "2026-10-01T12:30:00Z",
        "published_at": "2026-09-30T08:00:00+00:00",
        "collection_batch": "batch-2026-10-01",
    }
    assert validate_record_provenance(record) == []


def test_provenance_requires_source_observation_time_and_batch():
    issues = validate_record_provenance({"graduate_id": "G0001"})
    assert {item["field"] for item in issues} == {
        "source", "observed_at", "collection_batch",
    }
    assert all(item["code"] == "MISSING_PROVENANCE_FIELD" for item in issues)


@pytest.mark.parametrize("timestamp", [
    "2026-10-01T12:30:00",
    "not-a-date",
])
def test_provenance_rejects_invalid_or_timezone_naive_observation_time(timestamp):
    issues = validate_record_provenance({
        "source": "source:one",
        "observed_at": timestamp,
        "collection_batch": "batch-1",
    })
    assert any(item["code"] == "INVALID_TIMESTAMP" for item in issues)


def test_provenance_rejects_publication_after_observation():
    issues = validate_record_provenance({
        "source": "source:one",
        "published_at": "2026-10-02T00:00:00Z",
        "observed_at": "2026-10-01T00:00:00Z",
        "collection_batch": "batch-1",
    })
    assert any(item["code"] == "PUBLICATION_AFTER_OBSERVATION" for item in issues)


def test_dataset_audit_distinguishes_verified_unverified_and_invalid_records():
    result = audit_dataset_provenance([
        {
            "_id": "verified",
            "source": "source:one",
            "observed_at": "2026-10-01T00:00:00Z",
            "collection_batch": "batch-1",
        },
        {"_id": "legacy"},
        {
            "_id": "invalid",
            "source": "source:two",
            "observed_at": "bad-date",
            "collection_batch": "batch-2",
        },
    ], dataset_id="labor_market")
    assert result["total_records"] == 3
    assert result["verified_records"] == 1
    assert result["unverified_records"] == 1
    assert result["invalid_records"] == 1
    assert result["provenance_coverage"] == pytest.approx(1 / 3)


def test_skill_mapping_validates_course_skill_and_gap_definition():
    result = audit_skill_mapping(
        mappings=[{
            "_id": "m1",
            "skill": "Python",
            "course_id": "C001",
            "course_name": "برنامه‌سازی",
            "course_coverage": 2.0,
            "market_demand": 4.5,
            "market_gap": 2.5,
        }],
        courses=[{"course_id": "C001", "course_name": "برنامه‌سازی"}],
        market_records=[{"skill": "Python"}],
    )
    assert result["valid_records"] == 1
    assert result["invalid_records"] == 0
    assert result["gap_definition"] == "market_gap = market_demand - course_coverage"


def test_skill_mapping_reports_broken_references_and_gap_formula_mismatch():
    result = audit_skill_mapping(
        mappings=[{
            "_id": "m2",
            "skill": "Unknown",
            "course_id": "C999",
            "course_name": "Missing",
            "course_coverage": 2.0,
            "market_demand": 4.5,
            "market_gap": 1.0,
        }],
        courses=[],
        market_records=[],
    )
    codes = {item["code"] for item in result["issues"]}
    assert {
        "UNKNOWN_MARKET_SKILL",
        "UNKNOWN_COURSE",
        "MARKET_GAP_FORMULA_MISMATCH",
    } <= codes


def test_skill_mapping_rejects_boolean_metrics_and_duplicate_pairs():
    base = {
        "skill": "Python",
        "course_id": "C001",
        "course_name": "Programming",
        "course_coverage": True,
        "market_demand": 4.0,
        "market_gap": 3.0,
    }
    result = audit_skill_mapping(
        mappings=[base, {**base, "course_coverage": 1.0}],
        courses=[{"course_id": "C001", "course_name": "Programming"}],
        market_records=[{"skill": "Python"}],
    )
    codes = {item["code"] for item in result["issues"]}
    assert "INVALID_MAPPING_METRIC" in codes
    assert "DUPLICATE_SKILL_COURSE_MAPPING" in codes


def test_skill_mapping_rejects_invalid_gap_tolerance():
    with pytest.raises(ValueError, match="gap_tolerance"):
        audit_skill_mapping([], [], [], gap_tolerance=-1)


def test_all_dataset_profiles_register_queryable_provenance_fields():
    from tools.dataset_registry import DATASET_PROFILES

    for dataset_id, profile in DATASET_PROFILES.items():
        fields = profile["fields"]
        assert {"source", "observed_at", "published_at", "collection_batch"} <= set(fields)
        assert "filter" in fields["source"]["roles"]
        assert "filter" in fields["observed_at"]["roles"]
        assert "filter" in fields["published_at"]["roles"]
        assert "filter" in fields["collection_batch"]["roles"]
