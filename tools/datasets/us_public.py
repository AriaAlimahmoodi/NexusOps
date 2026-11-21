"""Canonical contracts for the two U.S. public CSV sources."""

from tools.data_governance import OPTIONAL_PROVENANCE_FIELDS, REQUIRED_PROVENANCE_FIELDS


def _profile(dataset_id, description, fields, keys, required, ranges):
    return {
        "dataset_id": dataset_id,
        "index": dataset_id,
        "real_index": f"{dataset_id}_real",
        "description": description,
        "source_type": "elasticsearch",
        "data_classification": "synthetic",
        "document_id_fields": keys,
        "provenance_contract": {
            "required_fields": list(REQUIRED_PROVENANCE_FIELDS),
            "optional_fields": list(OPTIONAL_PROVENANCE_FIELDS),
        },
        "fields": fields,
        "validation": {
            "required_fields": required,
            "expected_numeric_ranges": ranges,
        },
    }


def _dimension(field_type="keyword"):
    return {"type": field_type, "roles": ["dimension", "filter", "group_by"]}


def _metric(field_type="integer"):
    return {"type": field_type, "roles": ["metric", "filter"]}


US_UNEMPLOYMENT_MONTHLY_PROFILE = _profile(
    "us_unemployment_monthly",
    "Monthly national unemployment rate from BLS, seasonally adjusted.",
    {
        "series_id": _dimension(),
        "month_start": _dimension("date"),
        "unemployment_rate_pct": _metric("double"),
        "unemployment_rate_fraction": _metric("double"),
        "footnote_codes": _dimension(),
    },
    ["series_id", "month_start"],
    ["series_id", "month_start"],
    {"unemployment_rate_pct": {"min": 0, "max": 100},
     "unemployment_rate_fraction": {"min": 0, "max": 1}},
)

US_COLLEGE_INSTITUTIONS_PROFILE = _profile(
    "us_college_institutions",
    "Institution-level College Scorecard data, including archived cohorts.",
    {
        "unitid": {"type": "keyword", "roles": ["identifier", "filter"]},
        "institution_name": _dimension(),
        "city": _dimension(),
        "state_or_territory": _dimension(),
        "postal_code": _dimension(),
        "control_code": _dimension(),
        "predominant_degree_code": _dimension(),
        "undergraduate_enrollment": _metric(),
        "in_state_tuition_fees_usd": _metric(),
        "out_of_state_tuition_fees_usd": _metric(),
        "out_of_state_tuition_difference_usd": _metric(),
    },
    ["unitid"],
    ["unitid", "institution_name"],
    {field: {"min": 0} for field in (
        "undergraduate_enrollment", "in_state_tuition_fees_usd",
        "out_of_state_tuition_fees_usd",
    )},
)
