from scripts.assess_bilingual_equivalence import build_assessment


PAIR_FIELDS = [
    ("Company_ActivityTypeFa", "Company_ActivityTypeEn"),
    ("Company_CityFa", "Company_CityEn"),
    ("Company_IndustryFa", "Company_IndustryEn"),
    ("Company_ProvinceFa", "Company_ProvinceEn"),
    ("Company_SizeFa", "Company_SizeEn"),
    ("Jobpost_BenefitFa", "Jobpost_BenefitEn"),
    ("Jobpost_IndustryFa", "Jobpost_IndustryEn"),
    ("Jobpost_ProvinceFa", "Jobpost_ProvinceEn"),
    ("Jobpost_WorkTypeFa", "Jobpost_WorkTypeEn"),
    ("Comany_CompanyOwnershipTypesFa", "Company_CompanyOwnershipTypesEn"),
]


def _content_report():
    return {
        "source": {
            "rows_read": 100,
            "row_count_matches_profile": True,
            "profiled_row_count": 100,
        },
        "bilingual_content_audit": [
            {
                "fields": list(fields),
                "rows": 100,
                "left_null_right_present_rows": 0,
                "right_null_left_present_rows": 0,
                "rows_with_token_count_mismatch": 0,
                "left_tokens_with_multiple_right_candidates": 0,
                "right_tokens_with_multiple_left_candidates": 0,
            }
            for fields in PAIR_FIELDS
        ],
    }


def test_assessment_separates_three_dimensions_and_keeps_read_only_policy():
    report = build_assessment(_content_report())

    assert report["pair_count"] == 10
    assert report["summary"]["structural_alignment"] == {"aligned": 10}
    assert report["summary"]["semantic_equivalence"] == {
        "equivalent": 6,
        "partial": 4,
    }
    assert report["summary"]["translation_quality"] == {
        "good": 5,
        "material_issues": 4,
        "minor_issues": 1,
    }
    assert report["policy"]["read_only"] is True
    assert report["policy"]["mapping_approval"] is False
    assert report["policy"]["automatic_column_dropping"] is False


def test_structural_alignment_fails_when_token_cardinality_mismatch_exists():
    report = _content_report()
    report["bilingual_content_audit"][0]["rows_with_token_count_mismatch"] = 1

    result = build_assessment(report)
    first = result["assessments"][0]["structural_alignment"]

    assert first["status"] == "not_established"
    assert first["checks"]["no_token_count_mismatches"] is False
    assert result["summary"]["structural_alignment"] == {
        "aligned": 9,
        "not_established": 1,
    }


def test_structural_alignment_requires_source_row_count_to_match_profile():
    report = _content_report()
    report["source"]["row_count_matches_profile"] = False

    result = build_assessment(report)

    assert all(
        item["structural_alignment"]["status"] == "not_established"
        for item in result["assessments"]
    )


def test_assessment_rejects_incomplete_or_unexpected_pair_inventory():
    report = _content_report()
    report["bilingual_content_audit"].pop()

    try:
        build_assessment(report)
    except ValueError as error:
        assert "inventory mismatch" in str(error)
    else:
        raise AssertionError("Incomplete pair inventory must be rejected")
