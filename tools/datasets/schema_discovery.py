
"""
Schema Discovery Module

Discovers the actual Elasticsearch schema of a registered dataset
and compares it with its semantic Dataset Profile.

Responsibilities:
- Retrieve dataset profile from Dataset Registry.
- Discover Elasticsearch mappings.
- Discover field capabilities using Field Caps API.
- Compare actual schema with the registered profile.
- Report missing fields, type mismatches and capability issues.

This module is Elasticsearch-specific.
The analytical engine must not depend directly on this module.
"""

from typing import Any

from config import get_elasticsearch_client
from tools.dataset_registry import get_dataset_profile


def _response_to_dict(response: Any) -> dict:
    """
    Normalize Elasticsearch API responses to dictionaries.
    """

    if hasattr(response, "body"):
        return response.body

    return dict(response)


def _flatten_properties(
    properties: dict,
    parent_path: str = "",
) -> dict:
    """
    Convert nested Elasticsearch mapping properties
    into a flat dictionary using dot notation.
    """

    flattened = {}

    for field_name, definition in properties.items():
        full_path = (
            f"{parent_path}.{field_name}"
            if parent_path
            else field_name
        )

        field_type = definition.get("type")

        if field_type is None:
            field_type = (
                "nested"
                if definition.get("type") == "nested"
                else "object"
            )

        flattened[full_path] = {
            "type": field_type,
        }

        nested_properties = definition.get("properties", {})

        if nested_properties:
            flattened.update(
                _flatten_properties(
                    nested_properties,
                    full_path,
                )
            )
        sub_fields = definition.get("fields", {})

        if sub_fields:
            flattened.update(
                _flatten_properties(
                    sub_fields,
                    full_path,
                )
            )

    return flattened


def _discover_mappings(
    client,
    index: str,
) -> dict:
    """
    Retrieve and flatten the actual Elasticsearch mappings.
    """

    response = _response_to_dict(
        client.indices.get_mapping(index=index)
    )

    if not response:
        raise RuntimeError(
            f"No mapping information found for index '{index}'."
        )

    discovered_fields = {}

    for index_name, index_definition in response.items():
        mappings = index_definition.get("mappings", {})
        properties = mappings.get("properties", {})

        discovered_fields.update(
            _flatten_properties(properties)
        )

    return discovered_fields


def _discover_field_capabilities(
    client,
    index: str,
) -> dict:
    """
    Retrieve actual searchable and aggregatable capabilities.
    """

    response = _response_to_dict(
        client.field_caps(
            index=index,
            fields="*",
        )
    )

    return response.get("fields", {})


def _build_actual_schema(
    mapping_fields: dict,
    field_capabilities: dict,
) -> dict:
    """
    Combine mapping types with Elasticsearch field capabilities.

    Metadata fields not present in the document mapping are
    intentionally excluded.
    """

    actual_fields = {}

    for field_name, mapping_info in mapping_fields.items():
        capability_info = field_capabilities.get(
            field_name,
            {},
        )

        type_details = {}

        for field_type, capabilities in capability_info.items():
            type_details[field_type] = {
                "searchable": capabilities.get(
                    "searchable",
                    False,
                ),
                "aggregatable": capabilities.get(
                    "aggregatable",
                    False,
                ),
            }

        actual_types = sorted(
            type_details.keys()
        )

        actual_fields[field_name] = {
            "types": actual_types,
            "mapping_type": mapping_info["type"],
            "searchable": (
                all(
                    item["searchable"]
                    for item in type_details.values()
                )
                if type_details
                else False
            ),
            "aggregatable": (
                all(
                    item["aggregatable"]
                    for item in type_details.values()
                )
                if type_details
                else False
            ),
            "type_conflict": len(actual_types) > 1,
            "type_capabilities": type_details,
        }

    return actual_fields


def _compare_profile_with_schema(
    profile_fields: dict,
    actual_fields: dict,
) -> dict:
    """
    Compare semantic profile declarations with actual
    Elasticsearch fields and capabilities.
    """

    missing_fields = []
    type_mismatches = []
    capability_issues = []
    validated_fields = []

    required_capabilities = {
        "filter": "searchable",
        "group_by": "aggregatable",
        "metric": "aggregatable",
        "sort": "aggregatable",
    }

    for field_name, profile_config in profile_fields.items():

        actual_config = actual_fields.get(field_name)

        if actual_config is None:
            missing_fields.append(field_name)
            continue

        expected_type = profile_config.get("type")

        actual_types = actual_config.get("types", [])

        type_matches = expected_type in actual_types

        if not type_matches:
            type_mismatches.append({
                "field": field_name,
                "expected_type": expected_type,
                "actual_types": actual_types,
            })

        field_issues = []

        for role in profile_config.get("roles", []):
            required_capability = required_capabilities.get(role)

            if required_capability is None:
                continue

            if not actual_config.get(required_capability, False):
                field_issues.append({
                    "role": role,
                    "required_capability": required_capability,
                })

        if field_issues:
            capability_issues.append({
                "field": field_name,
                "issues": field_issues,
            })

        validated_fields.append({
            "field": field_name,
            "expected_type": expected_type,
            "actual_types": actual_types,
            "type_matches": type_matches,
            "searchable": actual_config["searchable"],
            "aggregatable": actual_config["aggregatable"],
        })

    return {
        "missing_profile_fields": missing_fields,
        "type_mismatches": type_mismatches,
        "capability_issues": capability_issues,
        "validated_fields": validated_fields,
    }


def discover_dataset_schema(
    dataset_id: str,
) -> dict:
    """
    Discover and validate the schema of a registered dataset.

    The dataset index is resolved dynamically from its profile.
    """

    profile = get_dataset_profile(dataset_id)

    source_type = profile.get(
        "source_type",
        "elasticsearch",
    )

    if source_type != "elasticsearch":
        raise NotImplementedError(
            f"Schema discovery for source type "
            f"'{source_type}' has not been implemented."
        )

    index = profile["index"]

    client = get_elasticsearch_client()

    mapping_fields = _discover_mappings(
        client,
        index,
    )

    field_capabilities = _discover_field_capabilities(
        client,
        index,
    )

    actual_fields = _build_actual_schema(
        mapping_fields,
        field_capabilities,
    )

    comparison = _compare_profile_with_schema(
        profile.get("fields", {}),
        actual_fields,
    )

    return {
        "dataset_id": dataset_id,
        "index": index,
        "source_type": source_type,
        "actual_field_count": len(actual_fields),
        "profile_field_count": len(profile.get("fields", {})),
        "actual_fields": actual_fields,
        "comparison": comparison,
        "schema_consistent": (
            not comparison["missing_profile_fields"]
            and not comparison["type_mismatches"]
            and not comparison["capability_issues"]
        ),
    }
