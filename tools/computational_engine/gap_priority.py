"""Curriculum action priority from canonical demand and competency evidence."""
from collections.abc import Mapping
from datetime import date

from tools.computational_engine.curriculum import MetricDefinition


GAP_PRIORITY = MetricDefinition(
    "1.0.0", "priority_points",
    "100 × demand share × max(0, (target coverage − observed coverage) / target coverage)",
)


def _require_text(record, fields):
    for field in fields:
        value = record.get(field)
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"{field} must be a non-empty string")


def compute_gap_priority(skill_id, market, target=None, curriculum=None):
    """Evaluate one explicitly scoped skill using reviewed evidence records."""
    _require_text({"skill_id": skill_id}, ("skill_id",))
    _require_text(market, (
        "skill_id", "role_id", "geography", "start_date", "end_date",
        "population", "denominator_definition", "source_reference",
    ))
    if market["skill_id"] != skill_id:
        raise ValueError("Market evidence skill mismatch")
    if date.fromisoformat(market["start_date"]) > date.fromisoformat(market["end_date"]):
        raise ValueError("Market dates are reversed")
    matching, total = market["matching_postings"], market["assessable_postings"]
    if any(type(count) is not int for count in (matching, total)) or not 0 <= matching <= total:
        raise ValueError("Invalid counts for distinct postings")

    result = {
        "computation_id": "gap_priority",
        "metric_version": GAP_PRIORITY.version,
        "formula": GAP_PRIORITY.formula,
        "unit": GAP_PRIORITY.unit,
        "skill_id": skill_id,
        "result": None,
        "status": "insufficient_evidence",
        "demand": {"numerator": matching, "denominator": total,
                   "share": matching / total if total else None},
        "market_scope": dict(market),
    }
    if target is None:
        return dict(result, limitation="missing_competency_target")

    _require_text(target, ("skill_id", "role_id", "program_id", "level",
                          "reference_version", "source_reference"))
    if target["skill_id"] != skill_id or target["role_id"] != market["role_id"]:
        raise ValueError("Target and market skill or role mismatch")
    competencies = target["competency_ids"]
    if (not isinstance(competencies, list) or not competencies or
            any(not isinstance(item, str) or not item.strip() for item in competencies) or
            len(competencies) != len(set(competencies))):
        raise ValueError("The target requires distinct competency IDs")
    minimum = target["minimum_covered"]
    if type(minimum) is not int or not 1 <= minimum <= len(competencies):
        raise ValueError("minimum_covered must be within the competency inventory")
    result["target"] = dict(target)
    if curriculum is None:
        return dict(result, limitation="missing_curriculum_assessment")

    _require_text(curriculum, ("skill_id", "role_id", "program_id", "level",
                              "reference_version", "source_reference"))
    for field in ("skill_id", "role_id", "program_id", "level", "reference_version"):
        if curriculum[field] != target[field]:
            raise ValueError(f"Curriculum and target {field} mismatch")

    evidence = curriculum["competencies"]
    if not isinstance(evidence, Mapping) or not evidence.keys() <= set(competencies):
        raise ValueError("Curriculum evidence must reference competencies in the target")
    covered, gaps, unknown = [], [], []
    competency_evidence = {}
    for competency in competencies:
        entry = evidence.get(competency)
        if entry is None:
            unknown.append(competency)
            continue
        if not isinstance(entry, Mapping):
            raise ValueError("Competency evidence must be an object")
        _require_text(entry, ("source_reference",))
        competency_evidence[competency] = dict(entry)
        status = entry.get("status")
        if status == "taught_and_assessed":
            covered.append(competency)
        elif status == "verified_not_covered":
            gaps.append(competency)
        elif status == "mention_only":
            unknown.append(competency)
        else:
            raise ValueError(f"Unknown evidence status for {competency}")

    result.update(curriculum_source=curriculum["source_reference"],
                  competency_evidence=competency_evidence,
                  covered_competencies=covered, verified_gaps=gaps, unknown_competencies=unknown)
    if unknown:
        return dict(result, limitation="incomplete_competency_evidence")
    if not total:
        return dict(result, limitation="empty_market_population")

    shortfall = max(0, minimum - len(covered))
    return dict(result, status="computed", limitation=None,
                observed_coverage=len(covered) / len(competencies),
                target_coverage=minimum / len(competencies),
                relative_shortfall=shortfall / minimum,
                competencies_needed=shortfall,
                result=100 * (matching / total) * (shortfall / minimum))
