import csv
import json
import sys

from scripts.audit_jobvision_semantics_v3 import main


def test_alias_collision_counts_include_comma_separated_alias_tokens(tmp_path, monkeypatch):
    source_path = tmp_path / "source.csv"
    output_path = tmp_path / "report.json"
    rows = [
        {
            "RowNumber": "1",
            "Jobpost_MainJobCategory": "فناوری اطلاعات",
            "Jobpost_SecondaryJobCategories": "",
            "Jobpost_SoftwareSkills": json.dumps(
                [{"TitleEn": "SAP", "TitleFa": "اس ای پی,سپ", "Level": "متوسط"}],
                ensure_ascii=False,
            ),
        },
        {
            "RowNumber": "2",
            "Jobpost_MainJobCategory": "فناوری اطلاعات",
            "Jobpost_SecondaryJobCategories": "",
            "Jobpost_SoftwareSkills": json.dumps(
                [{"TitleEn": "SAP2000", "TitleFa": "اس ای پی,سپ", "Level": "متوسط"}],
                ensure_ascii=False,
            ),
        },
    ]
    with source_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "RowNumber",
                "Jobpost_MainJobCategory",
                "Jobpost_SecondaryJobCategories",
                "Jobpost_SoftwareSkills",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    monkeypatch.setattr(
        sys,
        "argv",
        [
            "audit_jobvision_semantics_v3",
            "--input",
            str(source_path),
            "--output",
            str(output_path),
        ],
    )
    assert main() == 0

    report = json.loads(output_path.read_text(encoding="utf-8"))
    collisions = {
        item["alias"]: item
        for item in report["software_skill_analysis"][
            "title_fa_alias_collisions_across_multiple_title_en"
        ]
    }
    assert collisions["اس ای پی"]["skill_names"] == ["SAP", "SAP2000"]
    assert collisions["اس ای پی"]["mention_count_for_alias"] == 2
    assert collisions["سپ"]["mention_count_for_alias"] == 2
