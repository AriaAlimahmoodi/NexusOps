from tools.semantic_matching import match_source_profile, normalize_semantic_text


def _profiles():
    return [
        {
            "dataset_id": "labor_market",
            "fields": {
                "job_title": {"type": "keyword", "roles": ["dimension", "group_by"]},
                "job_field": {"type": "keyword", "roles": ["dimension", "group_by"]},
                "skill": {"type": "keyword", "roles": ["dimension", "group_by"]},
                "demand_score": {"type": "float", "roles": ["metric"]},
            },
        },
        {
            "dataset_id": "university_graduates",
            "fields": {
                "major": {"type": "keyword", "roles": ["dimension", "group_by"]},
            },
        },
    ]


def test_normalizes_persian_arabic_characters_and_separators():
    assert normalize_semantic_text("Jobpost_RawTitle") == "jobpost rawtitle"
    assert normalize_semantic_text("كاربَر ي") == "کاربر ی"


def test_exact_domain_alias_proposes_job_title_match():
    result = match_source_profile(
        {"source_name": "jobs.csv", "row_count": 10, "columns": {
            "Jobpost_RawTitle": {"inferred_type": "string", "null_ratio": 0.0},
        }},
        _profiles(),
    )

    match = result["matches"][0]
    assert match["status"] == "auto_match_candidate"
    assert match["best_candidate"]["dataset_id"] == "labor_market"
    assert match["best_candidate"]["target_field"] == "job_title"


def test_json_skill_array_requires_review_and_extraction():
    result = match_source_profile(
        {"columns": {
            "Jobpost_SoftwareSkills": {"inferred_type": "json_array", "null_ratio": 0.4},
        }},
        _profiles(),
    )

    match = result["matches"][0]
    assert match["status"] == "manual_review"
    assert match["best_candidate"]["warning"] == "requires_nested_value_extraction"


def test_semantically_related_but_not_equivalent_field_is_not_forced():
    result = match_source_profile(
        {"columns": {
            "Jobpost_RequiredExperienceYears": {
                "inferred_type": "integer", "null_ratio": 0.0,
            },
        }},
        _profiles(),
    )

    assert result["matches"][0]["status"] == "unmatched"


def test_incompatible_type_is_not_matched():
    result = match_source_profile(
        {"columns": {
            "Jobpost_RawTitle": {"inferred_type": "boolean", "null_ratio": 0.0},
        }},
        _profiles(),
    )

    assert result["matches"][0]["status"] == "unmatched"


def test_reports_all_columns_and_does_not_mutate_profiles():
    profiles = _profiles()
    before = repr(profiles)
    result = match_source_profile(
        {"source_name": "x.csv", "row_count": 3, "columns": {
            "Jobpost_RawTitle": {"inferred_type": "string"},
            "UnrecognizedField": {"inferred_type": "string"},
        }},
        profiles,
    )

    assert len(result["matches"]) == 2
    assert result["summary"]["column_count"] == 2
    assert result["summary"]["unmatched"] == 1
    assert repr(profiles) == before
    assert result["policy"]["automatic_schema_mutation"] is False


def test_rejects_invalid_thresholds_and_top_k():
    profile = {"columns": {}}
    try:
        match_source_profile(profile, _profiles(), review_threshold=0.9, auto_match_threshold=0.8)
    except ValueError as error:
        assert "thresholds" in str(error)
    else:
        raise AssertionError("invalid thresholds should fail")

    try:
        match_source_profile(profile, _profiles(), top_k=0)
    except ValueError as error:
        assert "top_k" in str(error)
    else:
        raise AssertionError("top_k=0 should fail")

def test_equal_matches_across_datasets_are_flagged_as_ambiguous():
    profiles = [
        {"dataset_id": "labor_market", "fields": {
            "job_title": {"type": "keyword", "roles": ["dimension"]},
        }},
        {"dataset_id": "university_graduates", "fields": {
            "job_title": {"type": "keyword", "roles": ["dimension"]},
        }},
    ]
    result = match_source_profile(
        {"columns": {
            "Jobpost_RawTitle": {"inferred_type": "string", "null_ratio": 0.0},
        }},
        profiles,
    )

    match = result["matches"][0]
    assert match["status"] == "manual_review"
    assert match["ambiguous"] is True
    assert "ambiguous_top_candidates" in match["best_candidate"]["warnings"]
