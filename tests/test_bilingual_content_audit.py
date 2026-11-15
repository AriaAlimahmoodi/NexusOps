from collections import Counter

from scripts.audit_bilingual_content import (
    _consume_row,
    _finish_pair,
    _new_pair_state,
)


def test_multivalue_tokens_are_normalized_and_paired_positionally():
    state = _new_pair_state()
    rows = [
        {
            "fa": "مزایا, بیمه",
            "en": "Benefits, Insurance",
        },
        {
            "fa": "مزایا,\\r\\nبیمه",
            "en": "Benefits,\\r\\nInsurance",
        },
        {
            "fa": "مزایا, ناهار",
            "en": "Benefits",
        },
    ]
    for row in rows:
        _consume_row(state, row, "fa", "en")

    result = _finish_pair(state, "fa", "en")
    assert result["rows"] == 3
    assert result["comma_delimited_rows"] == 3
    assert result["rows_with_token_count_mismatch"] == 1
    assert result["rows_with_equal_token_count"] == 2
    assert result["distinct_positional_token_pairs"] == 2
    pairs = {
        (item["left_value"], item["right_value"]): item["row_count"]
        for item in result["positional_token_pair_candidates"]
    }
    assert pairs[("مزایا", "Benefits")] == 2
    assert pairs[("بیمه", "Insurance")] == 2
    assert result["value_pairs_with_token_count_mismatch"][0]["row_count"] == 1


def test_token_conflicts_are_reported_without_accepting_translations():
    state = _new_pair_state()
    rows = [
        {"fa": "مزایا", "en": "Benefits"},
        {"fa": "مزایا", "en": "Perks"},
        {"fa": "بیمه", "en": "Benefits"},
    ]
    for row in rows:
        _consume_row(state, row, "fa", "en")

    result = _finish_pair(state, "fa", "en")
    assert result["left_tokens_with_multiple_right_candidates"] == 1
    assert result["right_tokens_with_multiple_left_candidates"] == 1
    assert result["interpretation"].find("not verified translations") >= 0


def test_empty_values_and_whitespace_are_counted_consistently():
    state = _new_pair_state()
    rows = [
        {"fa": "  تهران  ", "en": " Tehran "},
        {"fa": "", "en": "Madrid"},
        {"fa": "اصفهان", "en": ""},
        {"fa": "", "en": ""},
    ]
    for row in rows:
        _consume_row(state, row, "fa", "en")

    result = _finish_pair(state, "fa", "en")
    assert result["both_non_null_rows"] == 1
    assert result["left_null_right_present_rows"] == 1
    assert result["right_null_left_present_rows"] == 1
    assert result["both_null_rows"] == 1
    assert result["distinct_observed_value_pairs"] == 1
