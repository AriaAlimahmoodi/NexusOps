"""NexusOps specification 0.2 mandatory curriculum coverage."""

from __future__ import annotations

import math
from dataclasses import dataclass
from types import MappingProxyType


@dataclass(frozen=True)
class MetricDefinition:
    version: str
    unit: str
    formula: str

    def evaluate(self, numerator, denominator, limitation=None):
        if limitation is None and denominator == 0:
            limitation = "zero_denominator"
        return {
            "metric_version": self.version,
            "unit": self.unit,
            "formula": self.formula,
            "numerator": numerator,
            "denominator": denominator,
            "result": None if limitation else 100 * (numerator / denominator),
            "status": "not_computable" if limitation else "computed",
            "limitation": limitation,
        }


METRIC_REGISTRY = MappingProxyType({
    "mandatory_course_coverage": MetricDefinition(
        "1.0.0", "percent",
        "100 × mandatory courses containing the skill / all mandatory courses",
    ),
    "mandatory_credit_coverage": MetricDefinition(
        "1.0.0", "percent",
        "100 × credits of mandatory courses containing the skill / all mandatory course credits",
    ),
})
SCOPE_FIELDS = ("program_id", "major", "study_level")


def _unique_strings(values, label):
    if not isinstance(values, list) or any(
        not isinstance(value, str) or not value or value != value.strip()
        for value in values
    ):
        raise ValueError(f"{label} must be an array of non-empty canonical strings.")
    if len(values) != len(set(values)):
        raise ValueError(f"{label} contains duplicate identifiers.")
    return set(values)


def compute_curriculum_coverage(
    records, *, scope, skill_id, skill_vocabulary, expected_required_course_ids,
):
    """Compute two independent measures from a single, complete program scope."""
    if not isinstance(scope, dict) or set(scope) != set(SCOPE_FIELDS) or any(
        not isinstance(value, str) or not value or value != value.strip()
        for value in scope.values()
    ):
        raise ValueError("Supply a single program_id, major and study_level.")
    expected = _unique_strings(expected_required_course_ids, "Required course inventory")
    allowed_skills = _unique_strings(skill_vocabulary, "Reviewed skill vocabulary")
    if not isinstance(skill_id, str) or skill_id not in allowed_skills:
        raise ValueError("Requested skill is outside the reviewed skill vocabulary.")

    seen = set()
    required = {}
    for row in records:
        if any(row.get(field) != scope[field] for field in SCOPE_FIELDS):
            raise ValueError("Input contains a course outside the requested program scope.")
        course_id = row.get("course_id")
        if not isinstance(course_id, str) or not course_id.strip() or course_id in seen:
            raise ValueError(f"Missing or duplicate course identity: {course_id!r}.")
        seen.add(course_id)
        course_type = row.get("course_type")
        if course_type not in ("required", "elective"):
            raise ValueError(f"Unknown course type for {course_id!r}.")
        skills = row.get("skills")
        if skills is None and course_type == "required":
            raise ValueError(f"Missing skill evidence for required course {course_id!r}.")
        course_skills = set() if skills is None else _unique_strings(skills, f"Skills for {course_id}")
        if not course_skills <= allowed_skills:
            raise ValueError(f"Unreviewed skill identifier in course {course_id!r}.")
        credits = row.get("credits")
        if credits is not None and (
            type(credits) not in (int, float) or not math.isfinite(credits) or credits < 0
        ):
            raise ValueError(f"Invalid credits for {course_id!r}.")
        if course_type == "required":
            required[course_id] = (skill_id in course_skills, credits)

    if required.keys() != expected:
        missing = sorted(expected - required.keys())
        unexpected = sorted(required.keys() - expected)
        raise ValueError(f"Required course inventory mismatch. Missing {missing}; unexpected {unexpected}.")

    with_skill = sum(present for present, _ in required.values())
    count = METRIC_REGISTRY["mandatory_course_coverage"].evaluate(with_skill, len(required))
    credit_metric = METRIC_REGISTRY["mandatory_credit_coverage"]
    if any(credits is None for _, credits in required.values()):
        credit = credit_metric.evaluate(None, None, "missing_required_course_credits")
    else:
        total = math.fsum(credits for _, credits in required.values())
        covered = math.fsum(credits for present, credits in required.values() if present)
        credit = credit_metric.evaluate(covered, total)
    return {"mandatory_course_coverage": count, "mandatory_credit_coverage": credit}
