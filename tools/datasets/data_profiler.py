
"""
Generic Data Profiler

Profiles the actual contents of a registered Elasticsearch dataset.

Responsibilities:
- Count documents.
- Detect missing values.
- Calculate field cardinality.
- Calculate numeric statistics.
- Analyze categorical value distributions.
- Calculate date ranges.
- Check required fields and expected numeric ranges.
- Estimate duplicate identifier values.

The profiler uses discovered schema information.
It does not contain dataset-specific field names.
"""

from typing import Any

from config import get_elasticsearch_client
from tools.dataset_registry import get_dataset_profile
from tools.datasets.schema_discovery import discover_dataset_schema


NUMERIC_TYPES = {
    "byte",
    "short",
    "integer",
    "long",
    "unsigned_long",
    "half_float",
    "float",
    "double",
    "scaled_float",
}

CATEGORICAL_TYPES = {
    "keyword",
    "constant_keyword",
    "boolean",
}

NON_SCALAR_TYPES = {
    "object",
    "nested",
}


def _response_to_dict(response: Any) -> dict:
    """Normalize Elasticsearch responses to dictionaries."""

    if hasattr(response, "body"):
        return response.body

    return dict(response)


def _build_aggregations(
    actual_fields: dict,
    profile: dict,
    include_distributions: bool,
    terms_size: int,
) -> tuple[dict, dict]:
    """
    Build aggregations dynamically from discovered field metadata.

    Returns:
        aggregations: Elasticsearch aggregation definitions.
        field_plan: Mapping between generated aggregation names
                    and their corresponding fields.
    """

    aggregations = {}
    field_plan = {}

    for position, (field_name, field_info) in enumerate(
        actual_fields.items()
    ):
        mapping_type = field_info.get("mapping_type")

        if mapping_type in NON_SCALAR_TYPES:
            continue

        missing_key = f"missing_{position}"

        aggregations[missing_key] = {
            "filter": {
                "bool": {
                    "must_not": [
                        {
                            "exists": {
                                "field": field_name,
                            }
                        }
                    ]
                }
            }
        }

        field_plan[missing_key] = {
            "field": field_name,
            "operation": "missing",
        }

        if not field_info.get("aggregatable", False):
            continue

        cardinality_key = f"cardinality_{position}"

        aggregations[cardinality_key] = {
            "cardinality": {
                "field": field_name,
            }
        }

        field_plan[cardinality_key] = {
            "field": field_name,
            "operation": "cardinality",
        }

        if mapping_type in NUMERIC_TYPES:
            stats_key = f"numeric_stats_{position}"

            aggregations[stats_key] = {
                "stats": {
                    "field": field_name,
                }
            }

            field_plan[stats_key] = {
                "field": field_name,
                "operation": "numeric_stats",
            }

        elif mapping_type == "date":
            min_key = f"date_min_{position}"
            max_key = f"date_max_{position}"

            aggregations[min_key] = {
                "min": {
                    "field": field_name,
                }
            }

            aggregations[max_key] = {
                "max": {
                    "field": field_name,
                }
            }

            field_plan[min_key] = {
                "field": field_name,
                "operation": "date_min",
            }

            field_plan[max_key] = {
                "field": field_name,
                "operation": "date_max",
            }

        elif (
               include_distributions
               and mapping_type in CATEGORICAL_TYPES
               and "identifier" not in profile.get(
                "fields", {}
                ).get(field_name, {}).get("roles", [])
                and (
                 "dimension" in profile.get(
                 "fields", {}
                ).get(field_name, {}).get("roles", [])
                 or "group_by" in profile.get(
                 "fields", {}
                 ).get(field_name, {}).get("roles", [])
                 )
                 ):
            terms_key = f"distribution_{position}"

            aggregations[terms_key] = {
                "terms": {
                    "field": field_name,
                    "size": terms_size,
                }
            }

            field_plan[terms_key] = {
                "field": field_name,
                "operation": "distribution",
            }

    return aggregations, field_plan


def _extract_field_profiles(
    aggregation_results: dict,
    field_plan: dict,
    document_count: int,
) -> dict:
    """Convert Elasticsearch aggregation results into field profiles."""

    fields = {}

    for aggregation_key, plan in field_plan.items():
        field_name = plan["field"]
        operation = plan["operation"]

        fields.setdefault(
            field_name,
            {
                "missing_documents": 0,
                "missing_percentage": 0.0,
            },
        )

        result = aggregation_results.get(
            aggregation_key,
            {},
        )

        if operation == "missing":
            missing_count = result.get("doc_count", 0)

            missing_percentage = (
                (missing_count / document_count) * 100
                if document_count > 0
                else 0.0
            )

            fields[field_name]["missing_documents"] = (
                missing_count
            )

            fields[field_name]["missing_percentage"] = round(
                missing_percentage,
                2,
            )

        elif operation == "cardinality":
            fields[field_name]["distinct_values_approx"] = (
                result.get("value", 0)
            )

        elif operation == "numeric_stats":
            fields[field_name]["numeric_statistics"] = {
                "count": result.get("count", 0),
                "min": result.get("min"),
                "max": result.get("max"),
                "avg": result.get("avg"),
                "sum": result.get("sum"),
            }

        elif operation == "distribution":
            buckets = result.get("buckets", [])

            fields[field_name]["top_values"] = [
                {
                    "value": bucket.get("key"),
                    "document_count": bucket.get("doc_count"),
                }
                for bucket in buckets
            ]

        elif operation == "date_min":
            fields[field_name].setdefault(
                "date_statistics",
                {},
            )["min"] = result.get("value_as_string")

        elif operation == "date_max":
            fields[field_name].setdefault(
                "date_statistics",
                {},
            )["max"] = result.get("value_as_string")

    return fields


def _build_quality_report(
    profile: dict,
    field_profiles: dict,
) -> dict:
    """
    Check required fields and expected numeric ranges
    using semantic validation rules from the dataset profile.
    """

    validation = profile.get("validation", {})

    required_fields = validation.get(
        "required_fields",
        [],
    )

    required_field_issues = []

    for field_name in required_fields:
        field_info = field_profiles.get(field_name)

        if field_info is None:
            required_field_issues.append({
                "field": field_name,
                "issue": "field_not_profiled",
            })
            continue

        missing_count = field_info.get(
            "missing_documents",
            0,
        )

        if missing_count > 0:
            required_field_issues.append({
                "field": field_name,
                "issue": "missing_values",
                "missing_documents": missing_count,
            })

    expected_ranges = validation.get(
        "expected_numeric_ranges",
        {},
    )

    numeric_range_issues = []

    for field_name, expected in expected_ranges.items():
        field_info = field_profiles.get(field_name, {})

        stats = field_info.get(
            "numeric_statistics",
        )

        if not stats or stats.get("count", 0) == 0:
            continue

        actual_min = stats.get("min")
        actual_max = stats.get("max")

        minimum = expected.get("min")
        maximum = expected.get("max")

        violations = []

        if minimum is not None and actual_min < minimum:
            violations.append({
                "condition": "below_minimum",
                "observed": actual_min,
                "expected_minimum": minimum,
            })

        if maximum is not None and actual_max > maximum:
            violations.append({
                "condition": "above_maximum",
                "observed": actual_max,
                "expected_maximum": maximum,
            })

        if violations:
            numeric_range_issues.append({
                "field": field_name,
                "violations": violations,
            })

    return {
        "required_field_issues": required_field_issues,
        "numeric_range_issues": numeric_range_issues,
        "quality_check_passed": (
            not required_field_issues
            and not numeric_range_issues
        ),
    }


def profile_dataset(
    dataset_id: str,
    include_distributions: bool = True,
    terms_size: int = 10,
) -> dict:
    """
    Generate a generic data profile for a registered dataset.

    The actual index and field definitions are discovered
    dynamically rather than hardcoded.
    """

    if terms_size < 1:
        raise ValueError(
            "terms_size must be greater than or equal to 1."
        )

    profile = get_dataset_profile(dataset_id)

    schema_result = discover_dataset_schema(dataset_id)

    if not schema_result["schema_consistent"]:
        raise ValueError(
            "Dataset schema is inconsistent with its profile. "
            "Resolve schema validation issues before profiling."
        )

    index = schema_result["index"]
    actual_fields = schema_result["actual_fields"]

    client = get_elasticsearch_client()

    aggregations, field_plan = _build_aggregations(
        actual_fields=actual_fields,
        profile=profile,
        include_distributions=include_distributions,
        terms_size=terms_size,
    )

    response = _response_to_dict(
        client.search(
            index=index,
            size=0,
            track_total_hits=True,
            aggs=aggregations,
        )
    )

    hits_total = response.get(
        "hits",
        {},
    ).get(
        "total",
        0,
    )

    if isinstance(hits_total, dict):
        document_count = hits_total.get("value", 0)
        total_relation = hits_total.get("relation", "eq")
    else:
        document_count = hits_total
        total_relation = "eq"

    aggregation_results = response.get(
        "aggregations",
        {},
    )

    field_profiles = _extract_field_profiles(
        aggregation_results=aggregation_results,
        field_plan=field_plan,
        document_count=document_count,
    )

    primary_key = profile.get("primary_key")

    identifier_analysis = None

    if primary_key and primary_key in field_profiles:
        distinct_count = field_profiles[
            primary_key
        ].get(
            "distinct_values_approx",
            0,
        )

        identifier_analysis = {
            "field": primary_key,
            "distinct_values_approx": distinct_count,
            "estimated_duplicate_documents": max(
                0,
                document_count - distinct_count,
            ),
            "is_approximate": True,
        }

    quality_report = _build_quality_report(
        profile=profile,
        field_profiles=field_profiles,
    )

    return {
        "dataset_id": dataset_id,
        "index": index,
        "document_count": document_count,
        "document_count_relation": total_relation,
        "field_count": len(actual_fields),
        "fields": field_profiles,
        "identifier_analysis": identifier_analysis,
        "quality_report": quality_report,
    }
