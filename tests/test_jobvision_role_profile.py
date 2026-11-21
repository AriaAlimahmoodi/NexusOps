import csv
import hashlib

import pytest

from scripts.profile_jobvision_role import profile


def write_snapshot(path, rows):
    with path.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["RowNumber", "Jobpost_RawTitle", "Jobpost_SoftwareSkills",
                         "Jobpost_Description", "Jobpost_ActivationTime_YEAR_MONTH"])
        writer.writerows(rows)


def test_profile_reconciles_matches_duplicates_and_missing_data(tmp_path):
    path = tmp_path / "jobvision.csv"
    skills = '[{"TitleEn":"SystemVerilog"},{"TitleEn":"SystemVerilog"}]'
    payload = ("FPGA Designer", skills, "Uses System-Verilog", "2024-03")
    write_snapshot(path, [
        ("1", *payload), ("2", *payload), ("3", "FPGAs Engineer", "[]", "", ""),
        ("", "FPGA Engineer", "[]", "", ""), ("4", "NotFPGA", skills, "", ""),
        ("5", "", "[]", "", ""),
    ])

    result = profile(path, "fpga")

    assert result["source"]["collection_batch_sha256"] == hashlib.sha256(path.read_bytes()).hexdigest()
    assert result["counts"] == dict(rows_read=6, rows_missing_title=1, matching_title_rows=4,
                                    matching_rows_missing_id=1, exact_duplicate_matching_rows=1)
    assert result["denominator"]["postings"] == 2
    assert result["missing_in_denominator"] == dict(structured_skills=1, description=1, activation_month=1)
    assert result["structured_skill_posting_counts"] == {"systemverilog": 1}
    assert result["skill_evidence_posting_counts"] == {"fpga": 2, "systemverilog": 1}
    assert result["postings"][0]["duplicate_row_numbers"] == ["2"]
    assert result["postings"][0]["evidence"]["systemverilog"]["Jobpost_Description"] == "System-Verilog"


def test_profile_rejects_conflicting_identity(tmp_path):
    path = tmp_path / "jobvision.csv"
    write_snapshot(path, [("1", "FPGA Designer", "", "", ""), ("1", "FPGA Engineer", "", "", "")])

    with pytest.raises(ValueError, match="Conflicting payloads for matching RowNumber 1"):
        profile(path, "fpga")
