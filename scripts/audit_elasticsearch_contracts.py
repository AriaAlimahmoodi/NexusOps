"""Check published Elasticsearch mappings, required field coverage and stored formulas."""
import json
import math
from collections import Counter
from getpass import getpass
import os

from tools.dataset_registry import canonical_mapping
from tools.data_normalization import normalize_real_record
from tools.dataset_registry import get_dataset_profile, list_registered_datasets


FORMULAS = {
    "job_postings": {"skill_count": (("skills",), len)},
    "us_unemployment_monthly": {
        "unemployment_rate_fraction": (("unemployment_rate_pct",), lambda pct: pct / 100),
    },
    "us_college_institutions": {
        "out_of_state_tuition_difference_usd": (
            ("out_of_state_tuition_fees_usd", "in_state_tuition_fees_usd"), lambda a, b: a - b),
    },
    "skill_mapping": {"market_gap": (("market_demand", "course_coverage"), lambda a, b: a - b)},
}


def audit_index(dataset, classification, mappings, hits):
    profile = get_dataset_profile(dataset)
    expected = canonical_mapping(dataset)["properties"]
    if classification == "synthetic":
        expected = {key: value for key, value in expected.items() if key in profile["fields"]}
    required = set(profile["validation"]["required_fields"])
    if classification == "real":
        required.update(profile["provenance_contract"]["required_fields"])
    mapping_issues = {
        index: {
            field: {"expected": spec["type"], "actual": actual.get("type")}
            for field, spec in expected.items()
            if (actual := mapping["mappings"].get("properties", {}).get(field, {})).get("type")
            != spec["type"] and (actual or field in required)
        }
        for index, mapping in mappings.items()
    }
    formulas = FORMULAS.get(dataset, {})
    checks = {field: Counter(passed=0, failed=0, unavailable=0) for field in formulas}
    issues = Counter()
    coverage = Counter()
    identities = set()
    identified = 0
    identity_fields = profile.get("document_id_fields", [])
    classifications = Counter()
    records = 0
    for hit in hits:
        records += 1
        row = hit["_source"]
        label = row.get("data_classification", row.get("classification"))
        classifications[label if label in ("real", "synthetic") else "unknown"] += 1
        identity = tuple(row.get(field) for field in identity_fields)
        if identity and all(isinstance(value, (str, int)) and value != "" for value in identity):
            identities.add(identity)
            identified += 1
        coverage.update(field for field in expected if row.get(field) is not None)
        _, errors = normalize_real_record(dataset, row, record_id=hit["_id"])
        if classification == "synthetic":
            errors = [error for error in errors if error.get("field") in profile["fields"]]
        issues.update(error["code"] for error in errors)
        for field, (inputs, compute) in formulas.items():
            values = [row.get(key) for key in inputs]
            value = row.get(field)
            if any(item is None for item in values):
                checks[field]["unavailable" if value is None else "failed"] += 1
                continue
            try:
                expected_value = compute(*values)
                passed = math.isclose(value, expected_value, rel_tol=0, abs_tol=1e-6)
            except (TypeError, ValueError, OverflowError):
                passed = False
            checks[field]["passed" if passed else "failed"] += 1
    return dict(documents=records, expected_classification=classification,
                observed_classifications=classifications, identity_fields=identity_fields,
                identified_records=identified, unique_configured_identities=len(identities) if identity_fields else None,
                duplicate_identity_records=identified - len(identities) if identity_fields else None, mapping_issues=mapping_issues, record_issues=issues,
                stored_formula_checks=checks,
                populated_fields={field: coverage[field] for field in expected})


def audit(client):
    from elasticsearch.helpers import scan

    result = {}
    for profile in list_registered_datasets():
        for classification, index in (("synthetic", profile["index"]), ("real", profile["real_index"])):
            if not index:
                continue
            if not client.indices.exists(index=index):
                result[index] = {"status": "missing"}
                continue
            mappings = client.indices.get_mapping(index=index)
            hits = scan(client, index=index, query={"query": {"match_all": {}}},
                        allow_partial_search_results=False)
            result[index] = audit_index(profile["dataset_id"], classification, mappings, hits)
    return result


def inventory(client):
    """Inventory indices visible to the audit account and inspect known publications."""
    from elasticsearch.helpers import scan

    visible = client.indices.get(index="*", allow_no_indices=True, expand_wildcards="open")
    indices = {
        name: {"aliases": sorted(metadata.get("aliases", {})),
               "documents": client.count(index=name)["count"]}
        for name, metadata in sorted(visible.items())
    }
    dynamic = "nexusops_real_dynamic_datasets_v1"
    publications = {"status": "not_visible"}
    if dynamic in indices:
        publications = {"status": "visible", "datasets": []}
        hits = scan(client, index=dynamic, allow_partial_search_results=False,
                    query={"_source": ["schema", "classification", "row_count", "data.source.kind",
                                       "data.source.sha256"], "query": {"match_all": {}}})
        for hit in hits:
            source = hit["_source"]
            origin = source.get("data", {}).get("source", {})
            publications["datasets"].append({
                "id": hit["_id"], "schema": source.get("schema"),
                "declared_classification": source.get("classification"),
                "rows": source.get("row_count"), "source_kind": origin.get("kind"),
                "source_sha256": origin.get("sha256"),
            })
        publications["datasets"].sort(key=lambda item: item["id"])
    return {"visible_open_indices": indices, "registered_contracts": audit(client),
            "dynamic_publications": publications}


if __name__ == "__main__":
    if not os.getenv("ELASTICSEARCH_PASSWORD"):
        os.environ["ELASTICSEARCH_PASSWORD"] = getpass("Elasticsearch password: ")
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inventory", action="store_true", help="Include visible indices and dynamic publications")
    args = parser.parse_args()
    from config import get_elasticsearch_client

    with get_elasticsearch_client() as client:
        print(json.dumps(inventory(client) if args.inventory else audit(client), indent=2))
