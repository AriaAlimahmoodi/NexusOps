from pathlib import Path

from scripts.audit_source_semantic_coverage import _pair_stats, build_audit


def test_pair_stats_detects_row_level_conflicts():
    rows = [
        {"fa": "الف", "en": "A"},
        {"fa": "الف", "en": "A"},
        {"fa": "ب", "en": "B"},
        {"fa": "الف", "en": "X"},
        {"fa": "", "en": "C"},
        {"fa": "ج", "en": ""},
        {"fa": "", "en": ""},
    ]
    result = _pair_stats("fa", "en", rows)
    assert result["rows"] == 7
    assert result["both_non_null_rows"] == 4
    assert result["both_null_rows"] == 1
    assert result["left_null_right_present_rows"] == 1
    assert result["right_null_left_present_rows"] == 1
    assert result["left_values_with_multiple_right_translations"] == 1
    assert result["rows_in_left_to_multiple_right_conflicts"] == 3


def test_pair_stats_normalizes_whitespace_and_case():
    rows = [
        {"fa": " Full Time ", "en": "full time"},
        {"fa": "PART TIME", "en": "part time"},
    ]
    result = _pair_stats("fa", "en", rows)
    assert result["exact_normalized_equal_rows"] == 2
    assert result["exact_normalized_equal_ratio"] == 1.0


def test_build_audit_covers_all_profile_columns_without_csv():
    import json
    from pathlib import Path

    profile_path = Path("jobvision-source-profile.json")
    if not profile_path.is_file():
        return
    profile = json.loads(profile_path.read_text(encoding="utf-8"))
    report = build_audit(profile)
    assert len(report["field_reviews"]) == 43
    assert report["csv_validation"] is None
    assert report["policy"]["read_only"] is True
    assert report["policy"]["ingestion"] is False



def test_build_audit_reads_csv_and_checks_bilingual_pairs(tmp_path):
    import csv
    import json

    profile = json.loads(Path("jobvision-source-profile.json").read_text(encoding="utf-8"))
    headers = list(profile["columns"])
    csv_path = tmp_path / "source.csv"
    rows = [
        {
            "Jobpost_ProvinceFa": "تهران",
            "Jobpost_ProvinceEn": "Tehran",
            "Jobpost_WorkTypeFa": "تمام وقت",
            "Jobpost_WorkTypeEn": "Full Time",
            "Company_CityFa": "تهران",
            "Company_CityEn": "Tehran",
            "Company_SizeFa": "بزرگ",
            "Company_SizeEn": "Large",
            "Company_ActivityTypeFa": "خصوصی",
            "Company_ActivityTypeEn": "Private",
            "Jobpost_IndustryFa": "فناوری",
            "Jobpost_IndustryEn": "Technology",
            "Jobpost_BenefitFa": "بیمه",
            "Jobpost_BenefitEn": "Insurance",
            "Company_ProvinceFa": "تهران",
            "Company_ProvinceEn": "Tehran",
            "Comany_CompanyOwnershipTypesFa": "خصوصی",
            "Company_CompanyOwnershipTypesEn": "Private",
        },
        {
            "Jobpost_ProvinceFa": "اصفهان",
            "Jobpost_ProvinceEn": "Isfahan",
            "Jobpost_WorkTypeFa": "پاره وقت",
            "Jobpost_WorkTypeEn": "Part Time",
            "Company_CityFa": "اصفهان",
            "Company_CityEn": "Isfahan",
            "Company_SizeFa": "کوچک",
            "Company_SizeEn": "Small",
            "Company_ActivityTypeFa": "دولتی",
            "Company_ActivityTypeEn": "Public",
            "Jobpost_IndustryFa": "مالی",
            "Jobpost_IndustryEn": "Finance",
            "Jobpost_BenefitFa": "مرخصی",
            "Jobpost_BenefitEn": "Leave",
            "Company_ProvinceFa": "اصفهان",
            "Company_ProvinceEn": "Isfahan",
            "Comany_CompanyOwnershipTypesFa": "دولتی",
            "Company_CompanyOwnershipTypesEn": "Public",
        },
    ]
    with csv_path.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)

    report = build_audit(profile, csv_path)
    assert report["csv_validation"]["rows_read"] == 2
    assert report["csv_validation"]["row_count_matches_profile"] is False
    assert report["csv_validation"]["pair_count_checked"] == 10
    assert len(report["bilingual_row_level_validation"]) == 10
    assert all(item["both_non_null_rows"] == 2 for item in report["bilingual_row_level_validation"])
