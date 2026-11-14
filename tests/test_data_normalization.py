from tools.data_normalization import normalize_real_record


def valid_labor_market_record(**overrides):
    record = {
        "market_record_id": "LM-0001",
        "skill": "  Python  ",
        "demand_score": "4.25",
        "frequency": "120",
        "source": "https://example.org/records/1",
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
    assert normalized["data_classification"] == "real"


def test_normalizer_rejects_fields_outside_the_registered_schema():
    _, issues = normalize_real_record(
        "labor_market",
        valid_labor_market_record(JobVision_PrivateColumn="must-not-leak"),
    )

    assert any(issue["code"] == "UNKNOWN_DATASET_FIELD" for issue in issues)


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


def test_normalizer_does_not_mutate_source_record():
    source = valid_labor_market_record()
    original = dict(source)

    normalize_real_record("labor_market", source)

    assert source == original
