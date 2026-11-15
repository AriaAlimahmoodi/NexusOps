import csv
import json
import sys

from scripts.audit_jobvision_record_grain import main


def test_record_grain_audit_detects_duplicate_ids_and_skill_expansion(tmp_path, monkeypatch):
    source_path = tmp_path / "source.csv"
    output_path = tmp_path / "report.json"
    rows = [
        {
            "RowNumber": "1",
            "Jobpost_MainJobCategory": "Software",
            "Jobpost_SecondaryJobCategories": "Software,Data",
            "Jobpost_SoftwareSkills": json.dumps(
                [
                    {"TitleEn": "Python", "TitleFa": "پایتون"},
                    {"TitleEn": "Python", "TitleFa": "پایتون"},
                    {"TitleEn": "SQL", "TitleFa": "اس کیو ال"},
                ],
                ensure_ascii=False,
            ),
        },
        {
            "RowNumber": "1",
            "Jobpost_MainJobCategory": "Data",
            "Jobpost_SecondaryJobCategories": "",
            "Jobpost_SoftwareSkills": json.dumps(
                [{"TitleEn": "Python", "TitleFa": "پایتون"}],
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
            "audit_jobvision_record_grain",
            "--input",
            str(source_path),
            "--output",
            str(output_path),
        ],
    )
    assert main() == 0

    report = json.loads(output_path.read_text(encoding="utf-8"))
    identity = report["record_identity_analysis"]
    skills = report["software_skill_record_grain"]
    expansion = report["category_skill_expansion"]

    assert identity["unique_row_number_values"] == 1
    assert identity["duplicate_row_number_value_count"] == 1
    assert identity["row_number_matches_csv_position"] is False
    assert skills["rows_with_duplicate_title_en_within_same_post"] == 1
    assert skills["duplicate_title_en_excess_items_within_posts"] == 1
    assert skills["per_skill_post_and_mention_counts"][0] == {
        "title_en": "Python",
        "distinct_posts_with_skill": 2,
        "skill_mentions": 3,
        "duplicate_mentions_within_same_post": 1,
    }
    assert expansion["skill_rows_if_one_row_per_post_skill_using_main_category_only"] == 4
    assert expansion["skill_rows_if_each_post_skill_is_repeated_for_every_unique_main_and_secondary_category"] == 7
    assert report["scope_and_safety"]["ingestion_authorized"] is False
