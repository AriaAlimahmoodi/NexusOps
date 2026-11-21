"""Auditable market observations, course evidence and competency gaps."""
from calendar import monthrange
from fractions import Fraction
from hashlib import sha256
import re
import unicodedata

from tools.computational_engine.course_alignment import TITLE_PATTERNS
from tools.computational_engine.curriculum import MetricDefinition
from tools.computational_engine.fpga_course_evidence import course_evidence_report
from tools.computational_engine.gap_priority import compute_gap_priority
from tools.computational_engine.jobvision_fpga import load_snapshot
from tools.computational_engine.skill_ids import ALIAS_VERSION, PERSIAN_CHARACTERS, canonical

VERSION = "1.0.0"
POSTING_IDS_SHA256 = "05aafe358d34e71502bc189902a5b01b76ede8cfa2f9418977c564b6c828e42a"
SNAPSHOT_REFERENCE = "configs/evidence/jobvision-fpga-pilot.json"
COURSE_REFERENCE = "configs/evidence/fpga-course-syllabi.json"
DEMAND = MetricDefinition(VERSION, "percent", "100 × distinct matching postings / all scoped postings")
COVERAGE = MetricDefinition(VERSION, "percent", "100 × publications mentioning skill / scoped course publications")
MENTION = "mentioned"
ABSENT = "not_mentioned_in_full_syllabus"
UNKNOWN = "insufficient_course_information"


def publication_coverage(courses, skill_id):
    evidence = []
    counts = dict.fromkeys((MENTION, ABSENT, UNKNOWN), 0)
    for course in courses:
        skill = next(item for item in course["skills"] if item["skill_id"] == skill_id)
        counts[skill["status"]] += 1
        evidence.append({key: course[key] for key in ("institution", "course_id", "term", "section", "source")}
                        | skill)
    result = COVERAGE.evaluate(counts[MENTION], len(evidence))
    return dict(result, computation_id="observed_syllabus_mentions", status_counts=counts, publications=evidence,
                possible_percent_max=COVERAGE.evaluate(counts[MENTION] + counts[UNKNOWN], len(evidence))["result"])


def posting_references(postings, skill_id, source):
    """Trace matches and the denominator using the existing role profile."""
    structured_field = "Jobpost_SoftwareSkills"
    matches = {}
    for posting in postings:
        fields = dict(posting["evidence"].get(skill_id, {}))
        if skill_id in {canonical(label) for label in posting["structured_skills"]}:
            fields[structured_field] = skill_id
        if fields:
            matches[posting["row_number"]] = fields
    return {
        "status": "verified_rows",
        "identity_field": source["identity_field"],
        "denominator_ids": [posting["row_number"] for posting in postings],
        "matches": matches,
    }


def evaluate(snapshot, education, *, postings=None, assessments=None):
    """Evaluate one market snapshot and rank gaps for at most one program and level."""
    assessments = {} if assessments is None else assessments
    skills = education["skill_ids"]
    if set(assessments) - set(skills):
        raise ValueError("Assessment references a skill outside the pilot")
    targets = [assessment["target"] for assessment in assessments.values()]
    if len({(target["program_id"], target["level"], target["reference_version"]) for target in targets}) > 1:
        raise ValueError("Gap ranking requires one program, level and target reference version")

    source = snapshot["source"]
    role = snapshot["role"]
    total = snapshot["total_postings"]
    first = snapshot["first_activation_month"]
    year, month = map(int, snapshot["last_activation_month"].split("-"))
    market_scope = {
        "role_id": role["id"],
        "geography": source["country"],
        "start_date": first + "-01",
        "end_date": f"{year:04d}-{month:02d}-{monthrange(year, month)[1]:02d}",
        "population": role["selection_field"] + " / " + role["selection_pattern"],
        "denominator_definition": "unique valid title-matched postings in the verified snapshot",
        "source_reference": SNAPSHOT_REFERENCE + " / " + source["collection_batch_sha256"],
        "assessable_postings": total,
    }
    rows, rankable = [], []
    for skill in skills:
        observation = snapshot["observations"].get(skill, {})
        matching = observation.get("unique_postings", 0)
        trace = {"status": "aggregate_snapshot", "reference": SNAPSHOT_REFERENCE + "#observations"}
        if postings is not None:
            trace = posting_references(postings, skill, source)
            if len(trace["matches"]) != matching:
                raise ValueError(f"Posting evidence for {skill} disagrees with the verified snapshot")
        market = dict(market_scope, skill_id=skill, matching_postings=matching)
        gap = compute_gap_priority(skill, market, **assessments.get(skill, {}))
        selection_skill = skill == role["id"]
        field_counts = {
            "structured_skills": observation.get("structured_skills", 0),
            "posting_title": observation.get("posting_title", 0) if skill in TITLE_PATTERNS else None,
            "description": observation.get("description", 0) if source["description_columns"] and skill in TITLE_PATTERNS else None,
        }
        row = {
            "skill_id": skill,
            "market_demand": dict(DEMAND.evaluate(matching, total), computation_id="observed_demand_share",
                                  role_selection_skill=selection_skill, field_counts=field_counts,
                                  posting_evidence=trace),
            "education_coverage": publication_coverage(education["courses"], skill),
            "competency_gap": gap,
            "gap_rank": None,
            "ranking_limitation": "role_selection_skill" if selection_skill else gap["limitation"],
        }
        rows.append(row)
        if not selection_skill and gap["status"] == "computed":
            score = Fraction(matching * gap["competencies_needed"], total * gap["target"]["minimum_covered"])
            rankable.append((score, row))

    for rank, (_, row) in enumerate(sorted(rankable, key=lambda item: (-item[0], item[1]["skill_id"])), 1):
        row["gap_rank"] = rank
    return {
        "computation_id": "fpga_skill_indicators",
        "metric_version": VERSION,
        "skill_alias_version": ALIAS_VERSION,
        "ranking_rule": "Computed competency gap descending, then canonical skill ID ascending. Role selection skill excluded.",
        "market_scope": {"source": source, "role": role, "total_postings": total, "missing": snapshot["missing"],
                         "first_activation_month": first, "last_activation_month": snapshot["last_activation_month"],
                         "reference": SNAPSHOT_REFERENCE},
        "education_scope": dict(education["scope"], reference=COURSE_REFERENCE),
        "skills": rows,
    }


def fpga_indicators(*, role_profile=None, assessments=None):
    if assessments and role_profile is None:
        raise ValueError("Competency scoring requires the verified posting records for traceability")
    snapshot = load_snapshot()
    education = course_evidence_report("FPGA syllabus evidence")
    postings = None
    if role_profile is not None:
        postings = role_profile["postings"]
        ids = {int(posting["row_number"]) for posting in postings}
        checksum = sha256(",".join(map(str, sorted(ids))).encode("ascii")).hexdigest()
        if (role_profile["source"]["collection_batch_sha256"] != snapshot["source"]["collection_batch_sha256"]
                or role_profile["role"] != snapshot["role"]
                or role_profile["missing_in_denominator"] != snapshot["missing"]
                or len(postings) != len(ids) or len(ids) != snapshot["total_postings"]
                or checksum != POSTING_IDS_SHA256):
            raise ValueError("Posting records do not reproduce the verified Phase 13 snapshot")
    report = evaluate(snapshot, education, postings=postings, assessments=assessments)
    report["market_scope"]["posting_ids_sha256"] = POSTING_IDS_SHA256
    return report


INDICATOR_REQUEST = re.compile(r"\b(?:skill indicators|competency gaps?)\b|شاخص\s*های مهارت|شکاف شایستگی", re.I)


def is_indicator_question(question):
    normalized = " ".join(unicodedata.normalize("NFKC", question).translate(PERSIAN_CHARACTERS).split())
    return bool(INDICATOR_REQUEST.search(normalized) and re.search(r"\bFPGA\b|اف پی جی ای", normalized, re.I))
