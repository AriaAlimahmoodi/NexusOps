"""Stream JobVision and export original candidate rows selected independently of skill labels."""
import argparse
import csv
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

from tools.computational_engine.field_rules import evaluate_rule

ROLE = re.compile(r"\b(?:fpga|asic|rtl|firmware|embedded|digital (?:logic|design)|hardware design)\b|امبدد|تعبیه شده|نهفته|طراحی (?:مدار دیجیتال|سخت افزار)|فریمور", re.I)
FIELDS = ("Jobpost_RawTitle", "Jobpost_MainJobCategory", "Jobpost_SecondaryJobCategories",
          "Jobpost_Description", "Jobpost_JobDescription", "Jobpost_Responsibilities")


def audit(source, dest):
    if source.resolve() == dest.resolve():
        raise ValueError("Output must differ from input")
    counts = Counter()
    skills = Counter()
    sample = []
    tmp = dest.with_suffix(".partial")
    with source.open(encoding="utf-8-sig", newline="") as f, tmp.open("x", encoding="utf-8-sig", newline="") as out:
        try:
            reader = csv.DictReader(f)
            fields = [k for k in FIELDS if k in reader.fieldnames]
            if not {"RowNumber", "Jobpost_RawTitle", "Jobpost_SoftwareSkills"}.issubset(reader.fieldnames):
                raise ValueError("Missing required JobVision columns")
            writer = csv.DictWriter(out, fieldnames=reader.fieldnames)
            writer.writeheader()
            for row in reader:
                counts["read"] += 1
                hits = [k for k in fields if ROLE.search((row[k] or "").replace("\u200c", " ").replace("ي","ی").replace("ك","ک"))]
                if not hits:
                    continue
                labels = evaluate_rule(row, dict(op="canonical_labels", inputs=["Jobpost_SoftwareSkills"], key="TitleEn"))
                counts["candidates"] += 1
                counts["with_skills"] += bool(labels)
                skills.update(labels)
                if len(sample) < 25:
                    sample.append(dict(row=row["RowNumber"], title=row["Jobpost_RawTitle"], matched_fields=hits))
                writer.writerow(row)
        except BaseException:
            out.close()
            tmp.unlink()
            raise
    tmp.replace(dest)
    with dest.open("rb") as f:
        batch = hashlib.file_digest(f, "sha256").hexdigest()
    return dict(counts=counts, selection_fields=fields, posting_counts_by_skill=skills,
                candidate_sample=sample, collection_batch=batch)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--input", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args()
    print(json.dumps(audit(args.input, args.output), indent=2))
