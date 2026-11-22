"""Calculate explicitly scoped first-destination employment measures."""
import argparse
import json
from pathlib import Path

CATEGORIES = (
    "employed", "continuing_education", "seeking_employment",
    "seeking_education", "not_seeking", "other",
)


def summarize(cohort, *, allow_synthetic=False):
    classification = cohort["data_classification"]
    if classification != "real" and not (allow_synthetic and classification == "synthetic"):
        raise ValueError("The cohort must be real, or explicitly enabled for synthetic testing.")

    counts = cohort["counts"]
    if set(counts) != set(CATEGORIES):
        raise ValueError("Every published outcome category is required.")
    unknown = cohort["no_response"]
    total = cohort["cohort_total"]
    reported = cohort["reported_total"]
    if any(type(value) is not int or value < 0 for value in (*counts.values(), unknown, total, reported)):
        raise ValueError("Counts must be nonnegative integers.")
    if sum(counts.values()) != reported or reported + unknown != total:
        raise ValueError("Outcome totals do not reconcile.")

    # Other is a reported destination, but its employment status is unresolved.
    known = reported - counts["other"]
    employed = counts["employed"]
    return {
        "metric_version": "1.0.0",
        "data_classification": classification,
        "scope": cohort["scope"],
        "source": cohort["source"],
        "counts": counts,
        "reported_total": reported,
        "cohort_total": total,
        "no_response": unknown,
        "employment_status_unknown": total - known,
        "response_coverage_pct": 100 * reported / total if total else None,
        "published_employed_destination_share": {
            "numerator": employed, "denominator": reported,
            "percent": 100 * employed / reported if reported else None,
        },
        "cohort_employed_destination_share": {
            "numerator": employed, "denominator": total,
            "percent": 100 * employed / total if total and known == total else None,
            "status": "computed" if total and known == total else "insufficient_evidence",
        },
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("cohort", type=Path)
    parser.add_argument("--allow-synthetic", action="store_true")
    args = parser.parse_args()
    cohort = json.loads(args.cohort.read_text(encoding="utf-8"))
    print(json.dumps(summarize(cohort, allow_synthetic=args.allow_synthetic), indent=2))


if __name__ == "__main__":
    main()
