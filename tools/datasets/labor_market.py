
"""
Labor Market Dataset Profile

This module defines the semantic and analytical configuration
of the labor_market dataset.

Important:
- Elasticsearch mapping and runtime statistics are discovered dynamically.
- This profile contains stable semantic configuration.
- Observed values and dataset statistics must NOT be hardcoded here.
"""

LABOR_MARKET_PROFILE = {
    # ---------------------------------------------------------
    # Dataset identification
    # ---------------------------------------------------------

    "dataset_id": "labor_market",

    "index": "labor_market",

    "description": (
        "Labor market dataset containing job skills, job titles, "
        "job fields, experience levels, demand scores, and "
        "skill frequency information."
    ),

    "source_type": "elasticsearch",

    "primary_key": "market_record_id",

    # ---------------------------------------------------------
    # Field definitions
    #
    # Field types must be checked against the live ES mapping.
    # Roles describe semantic meaning, not Elasticsearch types.
    # ---------------------------------------------------------

    "fields": {

        "market_record_id": {
            "type": "keyword",
            "roles": [
                "identifier",
                "filter"
            ],
        },

        "job_title": {
            "type": "keyword",
            "roles": [
                "dimension",
                "filter",
                "group_by"
            ],
        },

        "job_field": {
            "type": "keyword",
            "roles": [
                "dimension",
                "filter",
                "group_by"
            ],
        },

        "skill": {
            "type": "keyword",
            "roles": [
                "dimension",
                "filter",
                "group_by"
            ],
        },

        "demand_score": {
            "type": "float",
            "roles": [
                "metric",
                "filter",
                "sort"
            ],
            "aggregations": [
                "avg",
                "min",
                "max"
            ],
        },

        "frequency": {
            "type": "integer",
            "roles": [
                "metric",
                "filter",
                "sort"
            ],
            "aggregations": [
                "sum",
                "avg",
                "min",
                "max"
            ],
        },

        "experience_level": {
            "type": "keyword",
            "roles": [
                "dimension",
                "filter",
                "group_by"
            ],
        },

        "source_type": {
            "type": "keyword",
            "roles": [
                "dimension",
                "filter",
                "group_by"
            ],
        },

        "source": {
            "type": "keyword",
            "roles": ["dimension", "filter", "group_by"],
        },
        "observed_at": {
            "type": "date",
            "roles": ["dimension", "filter", "group_by", "sort"],
        },
        "published_at": {
            "type": "date",
            "roles": ["dimension", "filter", "group_by", "sort"],
        },
        "collection_batch": {
            "type": "keyword",
            "roles": ["dimension", "filter", "group_by"],
        },
    },

    # ---------------------------------------------------------
    # Default analytical configuration
    # ---------------------------------------------------------

    "default_group_by": "skill",

    "default_metrics": {

        "average_demand_score": {
            "field": "demand_score",
            "aggregation": "avg",
        },

        "total_frequency": {
            "field": "frequency",
            "aggregation": "sum",
        },
    },

    # ---------------------------------------------------------
    # Dataset-specific analytical semantics
    # ---------------------------------------------------------

    "analytical_semantics": {

        "dimensions": [
            "skill",
            "job_title",
            "job_field",
            "experience_level",
            "source_type",
        ],

        "metrics": [
            "demand_score",
            "frequency",
        ],

        "default_sort": {
            "field": "demand_score",
            "aggregation": "avg",
            "order": "desc",
        },
    },

    # ---------------------------------------------------------
    # Validation policy
    #
    # These are domain expectations, not observed statistics.
    # Runtime profiling must independently inspect actual data.
    # ---------------------------------------------------------

    "validation": {

        "required_fields": [
            "market_record_id",
            "skill",
            "demand_score",
            "frequency",
        ],

        "expected_numeric_ranges": {

            "demand_score": {
                "min": 0,
                "max": 5,
                "basis": "domain_expectation",
            },

            "frequency": {
                "min": 0,
                "basis": "domain_expectation",
            },
        },
    },
}
