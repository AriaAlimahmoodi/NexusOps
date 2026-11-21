"""Profile a JobVision role selected by title and retain evidence for review."""

import argparse
import csv
import hashlib
import io
import json
from collections import Counter
from pathlib import Path

from scripts.audit_jobvision_descriptions import DESCRIPTION_FIELDS, clean
from scripts.audit_jobvision_record_grain import row_fingerprint
from tools.computational_engine.course_alignment import TITLE_PATTERNS
from tools.computational_engine.field_rules import evaluate_rule

TITLE = "Jobpost_RawTitle"
SKILLS = "Jobpost_SoftwareSkills"
IDENTITY = "RowNumber"
MONTH = "Jobpost_ActivationTime_YEAR_MONTH"
ROLE_PATTERNS = {"fpga": TITLE_PATTERNS["fpga"]}
SKILL_RULE = {"op": "canonical_labels", "inputs": [SKILLS], "key": "TitleEn"}


def profile(path: Path, role: str) -> dict:
    pattern = ROLE_PATTERNS[role]
    counts = dict(rows_read=0, rows_missing_title=0, matching_title_rows=0,
                  matching_rows_missing_id=0, exact_duplicate_matching_rows=0)
    postings = []
    skills = Counter()
    evidence_counts = Counter()
    missing = Counter()
    fingerprints = {}
    identity_fingerprints = {}

    with path.open("rb") as source:
        batch = hashlib.file_digest(source, "sha256").hexdigest()
        source.seek(0)
        with io.TextIOWrapper(source, encoding="utf-8-sig", newline="") as stream:
            reader = csv.DictReader(stream, strict=True)
            headers = reader.fieldnames or []
            if not {IDENTITY, TITLE, SKILLS} <= set(headers) or len(headers) != len(set(headers)):
                raise ValueError("Expected unique JobVision headers with RowNumber, raw title and skills")
            descriptions = [field for field in DESCRIPTION_FIELDS if field in headers]
            payload_fields = [field for field in headers if field != IDENTITY]
            for row in reader:
                counts["rows_read"] += 1
                if None in row or None in row.values():
                    raise ValueError(f"Malformed CSV row at line {reader.line_num}")
                title = clean(row[TITLE])
                counts["rows_missing_title"] += not title
                match = pattern.search(title)
                if not match:
                    continue
                counts["matching_title_rows"] += 1
                identity = clean(row[IDENTITY])
                if not identity:
                    counts["matching_rows_missing_id"] += 1
                    continue
                fingerprint = row_fingerprint(row, payload_fields)
                previous = identity_fingerprints.setdefault(identity, fingerprint)
                if previous != fingerprint:
                    raise ValueError(f"Conflicting payloads for matching RowNumber {identity}")
                if fingerprint in fingerprints:
                    counts["exact_duplicate_matching_rows"] += 1
                    fingerprints[fingerprint]["duplicate_row_numbers"].append(identity)
                    continue

                labels = evaluate_rule({SKILLS: clean(row[SKILLS])}, SKILL_RULE)
                description_text = {field: clean(row[field]) for field in descriptions}
                evidence = {}
                for skill, skill_pattern in TITLE_PATTERNS.items():
                    fields = {field: hit.group() for field, value in {TITLE: title, **description_text}.items()
                              if (hit := skill_pattern.search(value))}
                    if skill in labels:
                        fields[SKILLS] = skill
                    if fields:
                        evidence[skill] = fields
                activation_month = clean(row.get(MONTH))
                missing.update(field for field, value in {
                    "structured_skills": labels, "description": any(description_text.values()),
                    "activation_month": activation_month,
                }.items() if not value)
                skills.update(labels)
                evidence_counts.update(evidence.keys())
                posting = dict(row_number=identity, title=title, role_match=match.group(),
                               activation_month=activation_month or None, structured_skills=labels,
                               evidence=evidence, duplicate_row_numbers=[])
                fingerprints[fingerprint] = posting
                postings.append(posting)

    return {
        "source": {"publisher": "JobVision", "country": "Iran", "input_file": path.name,
                   "collection_batch_sha256": batch, "identity_field": IDENTITY,
                   "description_columns": descriptions},
        "role": {"id": role, "selection_field": TITLE, "selection_pattern": pattern.pattern},
        "counts": counts,
        "denominator": {"unit": "unique valid title-matched rows in the input snapshot",
                        "postings": len(postings)},
        "missing_in_denominator": {field: missing[field] for field in
                                   ("structured_skills", "description", "activation_month")},
        "structured_skill_posting_counts": dict(sorted(skills.items())),
        "skill_evidence_posting_counts": {
            skill: evidence_counts[skill] for skill in TITLE_PATTERNS
        },
        "postings": postings,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--role", choices=ROLE_PATTERNS, required=True)
    args = parser.parse_args()
    try:
        report = profile(args.input, args.role)
    except (OSError, ValueError, KeyError, TypeError, csv.Error) as exc:
        parser.exit(1, f"{parser.prog}: {exc}\n")
    print(json.dumps(report, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
