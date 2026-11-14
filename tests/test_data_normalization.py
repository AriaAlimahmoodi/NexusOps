from tools.data_normalization import normalize_real_record


def valid_labor_market_record(**overrides):
    record = {
        "market_record_id": "LM-0001",
        "skill": "  Python  ",
        "demand_score": "4.25",
        "frequency": "120",
        "source": " https://example.org/records/1 ",
        "observed_at": "2026-11-14T09:00:00Z",
        "collection_batch": "jobvision-2026-11-14",
        "time_granularity": "monthly",
    }
    record.update(overrides)
    return record


def test_normalizer_coerces_canonical_numeric_types_and_trims_strings():
    normalized, issues = normalize_real_record(
        "labor_market", valid_labor_market_record()
    )

    assert issues == []
    assert normalized["skill"] == "Python"
    assert normalized["demand_score"] == 4.25
    assert normalized["frequency"] == 120
    assert isinstance(normalized["frequency"], int)
    assert normalized["source"] == "https://example.org/records/1"
    assert normalized["data_classification"] == "real"


def test_normalizer_discards_fields_outside_the_registered_contract():
    source = valid_labor_market_record(
        JobVision_PrivateColumn="must-not-leak",
        salary_range="unsupported-capability",
        remote_policy="unsupported-capability",
    )

    normalized, issues = normalize_real_record("labor_market", source)

    assert issues == []
    assert "JobVision_PrivateColumn" not in normalized
    assert "salary_range" not in normalized
    assert "remote_policy" not in normalized
    assert set(normalized).issubset({
        "market_record_id", "job_title", "job_field", "skill",
        "demand_score", "frequency", "experience_level", "source_type",
        "source", "observed_at", "collection_batch", "time_granularity",
        "published_at", "valid_from", "valid_until", "data_classification",
    })


def test_normalizer_preserves_supported_provenance_separately_from_dataset_fields():
    normalized, issues = normalize_real_record(
        "labor_market",
        valid_labor_market_record(
            published_at=" 2026-11-13T09:00:00Z ",
            valid_from="2026-11-01T00:00:00Z",
            valid_until="2026-11-30T23:59:59Z",
        ),
    )

    assert issues == []
    assert normalized["published_at"] == "2026-11-13T09:00:00Z"
    assert normalized["valid_from"] == "2026-11-01T00:00:00Z"
    assert normalized["valid_until"] == "2026-11-30T23:59:59Z"


def test_absent_optional_provenance_fields_are_not_synthesized_as_null():
    normalized, issues = normalize_real_record(
        "labor_market", valid_labor_market_record()
    )

    assert issues == []
    assert "published_at" not in normalized
    assert "valid_from" not in normalized
    assert "valid_until" not in normalized


def test_absent_required_dataset_fields_remain_invalid():
    source = valid_labor_market_record()
    source.pop("frequency")

    normalized, issues = normalize_real_record("labor_market", source)

    assert "frequency" not in normalized
    assert any(
        issue["code"] == "MISSING_DATA_FIELD"
        and issue["field"] == "frequency"
        for issue in issues
    )


def test_normalizer_enforces_registered_numeric_ranges():
    _, issues = normalize_real_record(
        "labor_market", valid_labor_market_record(demand_score="5.5")
    )

    assert any(
        issue["code"] == "NUMERIC_VALUE_OUT_OF_RANGE"
        and issue["field"] == "demand_score"
        for issue in issues
    )


def test_normalizer_rejects_boolean_as_numeric_metric():
    _, issues = normalize_real_record(
        "labor_market", valid_labor_market_record(frequency=True)
    )

    assert any(
        issue["code"] == "INVALID_FIELD_TYPE"
        and issue["field"] == "frequency"
        for issue in issues
    )


def test_normalizer_rejects_missing_required_provenance():
    _, issues = normalize_real_record(
        "labor_market", valid_labor_market_record(source="")
    )

    assert any(
        issue["code"] == "MISSING_PROVENANCE_FIELD"
        and issue["field"] == "source"
        for issue in issues
    )


def test_normalizer_does_not_mutate_source_record():
    source = valid_labor_market_record(
        JobVision_PrivateColumn="must-not-leak"
    )
    original = dict(source)

    normalize_real_record("labor_market", source)

    assert source == original
