"""Measure description availability and count explicit skill references per posting."""
import argparse
import csv
import json
from collections import Counter
from pathlib import Path

from tools.computational_engine.course_alignment import TITLE_PATTERNS
from tools.computational_engine.field_rules import evaluate_rule

DESCRIPTION_FIELDS = (
    "Jobpost_Description", "Jobpost_JobDescription", "Jobpost_Responsibilities",
    "Jobpost_Requirements", "Jobpost_Qualifications",
)

def clean(text):
    text = (text or "").strip()
    return "" if text.casefold() in {"null", "none", "n/a", "nan", "-", "[]"} else text


def audit(path, description_fields=None):
    coverage = Counter()
    counts = {skill: Counter() for skill in TITLE_PATTERNS}
    examples = {}
    seen = set()
    with path.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        headers = set(reader.fieldnames or [])
        if not {"RowNumber", "Jobpost_RawTitle", "Jobpost_SoftwareSkills"} <= headers:
            raise ValueError("Expected the original JobVision posting columns")
        fields = tuple(dict.fromkeys(description_fields or (f for f in DESCRIPTION_FIELDS if f in headers)))
        if set(fields) - headers:
            raise ValueError("A requested description column is absent")
        for row in reader:
            identity = clean(row["RowNumber"])
            if not identity or identity in seen:
                raise ValueError("Expected unique nonempty RowNumber values")
            seen.add(identity)
            title = clean(row["Jobpost_RawTitle"])
            texts = {field: clean(row[field]) for field in fields}
            coverage.update(field for field, value in texts.items() if value)
            coverage["any_description"] += any(texts.values())
            skills = evaluate_rule(row, dict(op="canonical_labels", inputs=["Jobpost_SoftwareSkills"], key="TitleEn"))
            for skill, pattern in TITLE_PATTERNS.items():
                sources = {}
                if skill in skills:
                    sources["Jobpost_SoftwareSkills"] = skill
                    counts[skill]["structured_skills"] += 1
                title_match = pattern.search(title)
                if title_match:
                    sources["Jobpost_RawTitle"] = title_match.group()
                    counts[skill]["title"] += 1
                description_matches = {field: match.group() for field, value in texts.items()
                                       if (match := pattern.search(value))}
                if description_matches:
                    sources.update(description_matches)
                    counts[skill]["description"] += 1
                    examples.setdefault(skill, dict(posting_id=identity, evidence=sources))
                counts[skill]["unique_postings"] += bool(sources)
    return dict(postings=len(seen), headers=reader.fieldnames, description_columns=fields,
                postings_with_description=coverage["any_description"],
                nonempty_by_description_column={field: coverage[field] for field in fields},
                matches={skill: dict(title=n["title"], structured_skills=n["structured_skills"],
                                     description=n["description"] if coverage["any_description"] else None,
                                     unique_postings=n["unique_postings"]) for skill, n in counts.items()},
                description_examples=examples)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--description-column", action="append")
    args = parser.parse_args()
    print(json.dumps(audit(args.input, args.description_column), indent=2))
