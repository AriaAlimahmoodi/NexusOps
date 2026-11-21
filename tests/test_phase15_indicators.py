import csv
import json
from hashlib import sha256

import pytest

from scripts.profile_jobvision_role import profile
from tools.computational_engine import indicators
from tools.computational_engine.fpga_course_evidence import assess_skill
from tools.computational_engine.skill_ids import canonical


def _course(code, kind, mentions, absences=()):
    publication = {
        "course_id": code, "institution": "Fixture university", "term": "2024", "section": None,
        "source": {"kind": kind, "url": f"https://example.org/{code}"},
        "mentions": {skill: {"phrase": skill, "section": "Topics"} for skill in mentions},
        "reviewed_absences": absences,
    }
    return {**publication, "skills": [assess_skill(publication, skill) for skill in
                                     ("fpga", "vhdl", "verilog", "matlab")]}


def _assessment(skill, minimum, statuses):
    context = dict(skill_id=skill, role_id="fpga", program_id="fixture", level="intro", reference_version="1")
    evidence = {str(index): {"status": status, "source_reference": f"fixture:assessment:{skill}:{index}"}
                for index, status in enumerate(statuses, 1)}
    return {
        "target": dict(context, source_reference="fixture:target", competency_ids=list(evidence),
                       minimum_covered=minimum),
        "curriculum": dict(context, source_reference="fixture:curriculum", competencies=evidence),
    }


def test_manual_acceptance_matches_engine_with_posting_and_course_drilldown(tmp_path, monkeypatch):
    path = tmp_path / "fixture.csv"
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["RowNumber", "Jobpost_RawTitle", "Jobpost_SoftwareSkills", "Jobpost_ActivationTime_YEAR_MONTH"])
        for row_id, title, skills in (
            (1, "FPGA 1", ["VHDL", "وي‌اچ‌دي‌ال", "Verilog"]),
            (2, "FPGA 2", ["VHDL", "متلب"]),
            (3, "FPGA 3", ["VHDL", "وریلاگ"]),
            (4, "FPGA 4", []),
            (5, "FPGA 1", ["VHDL", "وي‌اچ‌دي‌ال", "Verilog"]),
            (6, "Software engineer", ["VHDL"]),
        ):
            writer.writerow([row_id, title, json.dumps([{"TitleEn": skill} for skill in skills]), "2024-03"])

    role_profile = profile(path, "fpga")
    assert role_profile["counts"]["exact_duplicate_matching_rows"] == 1
    skills = ("fpga", "vhdl", "verilog", "matlab")
    snapshot = {
        "source": role_profile["source"], "role": role_profile["role"], "total_postings": 4,
        "first_activation_month": "2024-03", "last_activation_month": "2024-03",
        "missing": {"structured_skills": 1, "description": 4, "activation_month": 0},
        "observations": {skill: {"unique_postings": count} for skill, count in zip(skills, (4, 3, 2, 1))},
    }
    education = {
        "scope": {"course_review_version": "fixture"}, "skill_ids": skills,
        "courses": [_course("A", "full_syllabus", ("fpga", "vhdl"), ("verilog", "matlab")),
                    _course("B", "catalog_description", ("verilog",))],
    }
    missing, covered, mention = "verified_not_covered", "taught_and_assessed", "mention_only"
    assessments = {
        "fpga": _assessment("fpga", 1, [missing]),
        "vhdl": _assessment("vhdl", 3, [covered, missing, missing, missing]),
        "verilog": _assessment("verilog", 1, [missing]),
        "matlab": _assessment("matlab", 1, [mention]),
    }
    monkeypatch.setattr(indicators, "POSTING_IDS_SHA256", sha256(b"1,2,3,4").hexdigest())
    monkeypatch.setattr(indicators, "load_snapshot", lambda: snapshot)
    monkeypatch.setattr(indicators, "course_evidence_report", lambda _: education)
    rows = {row["skill_id"]: row for row in
            indicators.fpga_indicators(role_profile=role_profile, assessments=assessments)["skills"]}
    row = rows["vhdl"]
    assert row["market_demand"]["result"] == 75
    postings = row["market_demand"]["posting_evidence"]
    assert postings["denominator_ids"] == ["1", "2", "3", "4"]
    assert postings["matches"] == dict.fromkeys(["1", "2", "3"], {"Jobpost_SoftwareSkills": "vhdl"})
    assert row["education_coverage"]["result"] == 50
    assert row["education_coverage"]["possible_percent_max"] == 100
    assert row["education_coverage"]["publications"][0]["evidence"]["url"] == "https://example.org/A"
    gap = row["competency_gap"]
    assert (gap["observed_coverage"], gap["target_coverage"], gap["result"]) == (0.25, 0.75, 50)
    assert gap["competency_evidence"]["1"]["source_reference"] == "fixture:assessment:vhdl:1"
    assert rows["verilog"]["competency_gap"]["result"] == 50
    assert rows["verilog"]["gap_rank"] == 1
    assert row["gap_rank"] == 2
    assert rows["fpga"]["gap_rank"] is None
    assert rows["matlab"]["gap_rank"] is None
    assert rows["matlab"]["competency_gap"]["limitation"] == "incomplete_competency_evidence"

    with pytest.raises(ValueError, match="requires the verified posting records"):
        indicators.fpga_indicators(assessments=assessments)
    with pytest.raises(ValueError, match="do not reproduce"):
        indicators.fpga_indicators(role_profile={**role_profile, "postings": role_profile["postings"][:-1]})


@pytest.mark.parametrize(("label", "skill"), [
    ("System-Verilog", "systemverilog"), ("سيستم‌وريلوگ", "systemverilog"),
    ("وریلوگ", "verilog"), ("اف‌پی‌جی‌ای", "fpga"), ("مت‌لب", "matlab"),
    ("VHSIC Hardware Description Language", "vhdl"),
])
def test_exact_bilingual_aliases(label, skill):
    assert canonical(label) == skill


def test_real_pilot_retains_market_limits_and_leaves_gap_unscored():
    report = indicators.fpga_indicators()
    rows = {row["skill_id"]: row for row in report["skills"]}
    assert report["market_scope"]["missing"] == {"structured_skills": 22, "description": 120, "activation_month": 0}
    assert [rows[skill]["market_demand"]["numerator"] for skill in rows] == [120, 87, 52, 42, 0]
    assert rows["systemverilog"]["market_demand"]["field_counts"]["description"] is None
    assert rows["systemverilog"]["market_demand"]["posting_evidence"]["status"] == "aggregate_snapshot"
    assert rows["systemverilog"]["education_coverage"]["result"] == 20
    assert rows["systemverilog"]["education_coverage"]["possible_percent_max"] == 60
    assert all(row["competency_gap"]["limitation"] == "missing_competency_target" for row in rows.values())
    assert all(row["competency_gap"]["result"] is None and row["gap_rank"] is None for row in rows.values())
