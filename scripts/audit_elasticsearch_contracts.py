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
    records = 0
    for hit in hits:
        records += 1
        row = hit["_source"]
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
    return dict(documents=records, mapping_issues=mapping_issues, record_issues=issues,
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


if __name__ == "__main__":
    os.environ["ELASTICSEARCH_PASSWORD"] = getpass("Elasticsearch password: ")
    from config import get_elasticsearch_client

    with get_elasticsearch_client() as client:
        print(json.dumps(audit(client), indent=2))
