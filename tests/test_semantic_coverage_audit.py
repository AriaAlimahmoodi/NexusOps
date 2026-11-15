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
