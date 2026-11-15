"""Independent, read-only assessment of JobVision bilingual field pairs.

Consumes the JSON report produced by scripts.audit_bilingual_content and
separates structural alignment from human-reviewed semantic equivalence and
translation quality. It never approves mappings or mutates source data.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


# Human-reviewed judgments are deliberately separate from row/token statistics.
# "structural_alignment" is computed from the input report; the other two
# dimensions require domain interpretation and are explicitly catalogued here.
_PAIR_REVIEW: dict[tuple[str, str], dict[str, Any]] = {
    ("Company_ActivityTypeFa", "Company_ActivityTypeEn"): {
        "semantic_equivalence": "equivalent",
        "translation_quality": "good",
        "evidence": ["Observed category pairs are semantically aligned."],
        "issues": [],
    },
    ("Company_CityFa", "Company_CityEn"): {
        "semantic_equivalence": "equivalent",
        "translation_quality": "good",
        "evidence": ["Persian city names correspond to English transliterations or established geographic names."],
        "issues": [],
    },
    ("Company_IndustryFa", "Company_IndustryEn"): {
        "semantic_equivalence": "partial",
        "translation_quality": "material_issues",
        "evidence": ["Most observed industry labels align at category level.", "تجارت / بازرگانی is paired with Trading / International Affairs."],
        "issues": ["Trading / International Affairs does not reliably preserve the meaning of تجارت / بازرگانی."],
    },
    ("Company_ProvinceFa", "Company_ProvinceEn"): {
        "semantic_equivalence": "equivalent",
        "translation_quality": "good",
        "evidence": ["Province names correspond through transliteration or established English names."],
        "issues": [],
    },
    ("Company_SizeFa", "Company_SizeEn"): {
        "semantic_equivalence": "partial",
        "translation_quality": "material_issues",
        "evidence": ["Employee-size categories are aligned in general.", "بیش از 5000 نفر is paired with More than 5001 employees."],
        "issues": ["The upper-bound wording changes the boundary from more than 5000 to more than 5001."],
    },
    ("Jobpost_BenefitFa", "Jobpost_BenefitEn"): {
        "semantic_equivalence": "equivalent",
        "translation_quality": "minor_issues",
        "evidence": ["Benefit concepts align across the observed pairs.", "پورسانت is paired with Commision."],
        "issues": ["Commision is a spelling error; the correct spelling is Commission."],
    },
    ("Jobpost_IndustryFa", "Jobpost_IndustryEn"): {
        "semantic_equivalence": "partial",
        "translation_quality": "material_issues",
        "evidence": ["Several industry labels are aligned, but some English values broaden, narrow, or alter the Persian concept."],
        "issues": [
            "تجارت / بازرگانی is paired with Trading / International Affairs.",
            "حسابرسی is paired with Accountancy, a broader concept than auditing.",
            "خدمات برگزاری همایش، مجالس، سمینار و نمایشگاه is shortened to Event Services.",
            "Consumer Electonics and Hair Saloons contain spelling errors.",
        ],
    },
    ("Jobpost_ProvinceFa", "Jobpost_ProvinceEn"): {
        "semantic_equivalence": "equivalent",
        "translation_quality": "good",
        "evidence": ["Province names correspond through transliteration or established English names."],
        "issues": [],
    },
    ("Jobpost_WorkTypeFa", "Jobpost_WorkTypeEn"): {
        "semantic_equivalence": "partial",
        "translation_quality": "material_issues",
        "evidence": ["Full-time and part-time categories align.", "قراردادی / پروژه ای is paired with Project - based."],
        "issues": ["The English value omits the contract aspect of قراردادی / پروژه ای."],
    },
    ("Comany_CompanyOwnershipTypesFa", "Company_CompanyOwnershipTypesEn"): {
        "semantic_equivalence": "equivalent",
        "translation_quality": "good",
        "evidence": ["Private, governmental, and non-profit/NGO/charity ownership categories align."],
        "issues": [],
    },
}


def _structural_assessment(pair: dict[str, Any], source: dict[str, Any]) -> dict[str, Any]:
    checks = {
        "pair_rows_match_source_rows": pair.get("rows") == source.get("rows_read"),
        "no_asymmetric_nulls": (
            pair.get("left_null_right_present_rows") == 0
            and pair.get("right_null_left_present_rows") == 0
        ),
        "no_token_count_mismatches": pair.get("rows_with_token_count_mismatch") == 0,
        "no_left_to_multiple_right_conflicts": pair.get("left_tokens_with_multiple_right_candidates") == 0,
        "no_right_to_multiple_left_conflicts": pair.get("right_tokens_with_multiple_left_candidates") == 0,
    }
    source_rows_match_profile = source.get("row_count_matches_profile") is True
    aligned = source_rows_match_profile and all(checks.values())
    return {
        "status": "aligned" if aligned else "not_established",
        "checks": checks,
        "source_row_count_matches_profile": source_rows_match_profile,
        "interpretation": (
            "The two columns are structurally aligned in row coverage and token cardinality; "
            "this does not prove semantic equivalence or translation correctness."
            if aligned else
            "Structural alignment is not established; inspect the failed checks before relying on this pair."
        ),
    }


def build_assessment(content_report: dict[str, Any]) -> dict[str, Any]:
    source = content_report.get("source")
    pairs = content_report.get("bilingual_content_audit")
    if not isinstance(source, dict) or not isinstance(pairs, list):
        raise ValueError("Input must be a bilingual content audit report with source and bilingual_content_audit.")
    if source.get("row_count_matches_profile") is not True:
        # Keep the report useful, but every pair will fail the structural gate.
        pass

    observed = {}
    for pair in pairs:
        fields = pair.get("fields")
        if not isinstance(fields, list) or len(fields) != 2:
            raise ValueError("Each bilingual pair must contain exactly two field names.")
        key = (fields[0], fields[1])
        if key in observed:
            raise ValueError(f"Duplicate bilingual pair in input: {key}")
        observed[key] = pair

    expected = set(_PAIR_REVIEW)
    actual = set(observed)
    if actual != expected:
        missing = sorted(expected - actual)
        unexpected = sorted(actual - expected)
        raise ValueError(f"Bilingual pair inventory mismatch; missing={missing}, unexpected={unexpected}")

    results = []
    for fields, review in _PAIR_REVIEW.items():
        pair = observed[fields]
        results.append({
            "fields": list(fields),
            "structural_alignment": _structural_assessment(pair, source),
            "semantic_equivalence": review["semantic_equivalence"],
            "translation_quality": review["translation_quality"],
            "semantic_and_translation_review": {
                "evidence": review["evidence"],
                "issues": review["issues"],
                "basis": "Explicit domain-review catalog; not inferred from positional token pairing.",
            },
        })

    structural_counts: dict[str, int] = {}
    semantic_counts: dict[str, int] = {}
    quality_counts: dict[str, int] = {}
    for item in results:
        for counts, value in (
            (structural_counts, item["structural_alignment"]["status"]),
            (semantic_counts, item["semantic_equivalence"]),
            (quality_counts, item["translation_quality"]),
        ):
            counts[value] = counts.get(value, 0) + 1

    return {
        "assessment_version": 1,
        "source": source,
        "pair_count": len(results),
        "summary": {
            "structural_alignment": structural_counts,
            "semantic_equivalence": semantic_counts,
            "translation_quality": quality_counts,
        },
        "assessments": results,
        "policy": {
            "read_only": True,
            "schema_mutation": False,
            "source_data_mutation": False,
            "ingestion": False,
            "mapping_approval": False,
            "automatic_column_dropping": False,
        },
        "limitations": [
            "Structural alignment is derived from row/token statistics and is not proof of translation correctness.",
            "Semantic equivalence and translation quality are explicit human-reviewed judgments for this source's current ten-pair inventory.",
            "This assessment does not establish that either column should be retained or dropped.",
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Assess structural, semantic, and translation quality of bilingual fields.")
    parser.add_argument("content_audit", help="JSON produced by scripts.audit_bilingual_content.")
    parser.add_argument("--output", default="jobvision-bilingual-final-assessment.json")
    args = parser.parse_args()

    try:
        report = json.loads(Path(args.content_audit).read_text(encoding="utf-8"))
        assessment = build_assessment(report)
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError) as error:
        parser.error(str(error))

    output = Path(args.output)
    output.write_text(json.dumps(assessment, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "completed",
        "pairs_assessed": assessment["pair_count"],
        "summary": assessment["summary"],
        "report_path": str(output),
        "policy": assessment["policy"],
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
