"""Versioned computations over the published JobVision and Purdue pilot scopes."""
from datetime import datetime, timezone
import math
import re

from tools.dataset_registry import get_dataset_index
from tools.computational_engine.curriculum import METRIC_REGISTRY, MetricDefinition


def now():
    return datetime.now(timezone.utc).isoformat()


DEFINITIONS = {(name, metric.version): metric for name, metric in METRIC_REGISTRY.items()}
for name, unit, formula in [
    ("demand_count", "postings", "count scoped postings containing skill"),
    ("demand_share", "percent", "100 × matching postings / scoped postings"),
    ("recorded_share", "percent", "100 × matching postings / postings with recorded skills"),
    ("demand_growth", "percent", "100 × (current share - previous share) / previous share"),
]:
    DEFINITIONS[name, "1.0.0"] = MetricDefinition("1.0.0", unit, formula)


def compute(name, numerator, denominator=None, *, version="1.0.0", limitation=None):
    definition = DEFINITIONS.get((name, version))
    if definition is None:
        raise ValueError("Unknown computation or version")
    values = [numerator] if denominator is None else [numerator, denominator]
    if any(isinstance(x, bool) or not isinstance(x, (float, int)) or not math.isfinite(x) for x in values):
        raise ValueError("Invalid metric inputs")
    if name != "demand_growth" and numerator < 0:
        raise ValueError("Negative count or credits")
    if name == "demand_count":
        if denominator is not None or not isinstance(numerator, int):
            raise ValueError("Demand count requires an integer count")
        result = dict(result=numerator, unit=definition.unit, formula=definition.formula,
                      numerator=numerator, denominator=None, status="computed", limitation=None)
    else:
        if denominator is None or denominator < 0 or (name != "demand_growth" and numerator > denominator):
            raise ValueError("Invalid denominator")
        result = definition.evaluate(numerator, denominator, limitation)
        result["percent"] = round(result["result"], 2) if result["result"] is not None else None
    return dict(result, computation_id=name, metric_version=version)


MARKET_BATCH = "5ea2992462bba91dd6afe2d48f7e3878cc3a11c800f16472d60a66b4d1c13293"
COURSE_BATCH = "c533c4896e3704883f3de18c88357bdf9d58db58d6c64c85e00a5975e0f6f85b"
PROGRAM = "Purdue-BSCmpE-Fall-2026-Software-Engineering-fixed-pilot"


def plan(question):
    q = question.strip().replace("پایتون", "Python")
    dates = re.findall(r"(?<![0-9])[0-9]{4}-(?:0[1-9]|1[0-2])(?![0-9])", q)
    trend = bool(re.search(r"trend|growth|روند|رشد", q, re.I))
    if trend and (len(dates) != 2 or dates[0] >= dates[1]):
        raise ValueError("Supply two distinct YYYY-MM months, earlier month first.")
    if not trend and dates:
        raise ValueError("Monthly filters require a trend request.")
    if not re.search("jobvision|جاب.?ویژن", q, re.I):
        raise ValueError("Select the JobVision pilot.")
    if not trend and not re.search("purdue|پردو", q, re.I):
        raise ValueError("Select the Purdue pilot for curriculum comparisons.")
    words = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]*", q)
    excluded = set("compare in and jobvision purdue demand trend growth for between from to skill coverage market the of at".split())
    skills = [w.lower().rstrip(".") for w in words if w.lower().rstrip(".") not in excluded]
    if len(skills) != 1:
        raise ValueError("Specify one canonical skill ID, for example Python.")
    return skills[0], dates


def is_course_alignment(question):
    return bool(re.search(r"gap\s*priority|course.market alignment|همسویی دروس با بازار|ارتباط دروس با بازار", question, re.I))


def answer(client, question):
    if is_course_alignment(question):
        from tools.computational_engine.course_alignment import live_report
        return live_report(client)
    skill, dates = plan(question)
    if dates:
        return trend_report(client, skill, dates, question)
    skill_filter = {"term": {"skills": skill}}
    market_index = get_dataset_index("job_postings", "real")
    course_index = get_dataset_index("curriculum_catalog", "real")

    market = client.search(
        index=market_index, size=0, track_total_hits=True, allow_partial_search_results=False,
        query={"term": {"collection_batch": MARKET_BATCH}},
        aggs={
            "skill": {"filter": skill_filter},
            "missing_skills": {"filter": {"term": {"skill_count": 0}}},
            "categories": {"terms": {"field": "job_field", "size": 10}},
            "first_month": {"terms": {"field": "activation_month", "size": 1, "order": {"_key": "asc"}}},
            "last_month": {"terms": {"field": "activation_month", "size": 1, "order": {"_key": "desc"}}},
        },
    )
    courses = client.search(
        index=course_index, size=0, track_total_hits=True, allow_partial_search_results=False,
        query={"bool": {"filter": [
            {"term": {"collection_batch": COURSE_BATCH}},
            {"term": {"program_id": PROGRAM}},
            {"term": {"major": "Computer Engineering"}},
            {"term": {"course_type": "required"}},
        ]}},
        aggs={
            "credits": {"sum": {"field": "credits"}},
            "missing_credits": {"missing": {"field": "credits"}},
            "skill": {"filter": skill_filter, "aggs": {"credits": {"sum": {"field": "credits"}}}},
        },
    )
    if market["timed_out"] or courses["timed_out"]:
        raise RuntimeError("Elasticsearch timed out while reading the evidence.")

    market_total = market["hits"]["total"]["value"]
    course_total = courses["hits"]["total"]["value"]
    if not market_total or not course_total:
        raise ValueError("Required pilot evidence is missing from the registered Elasticsearch aliases.")

    jobs = market["aggregations"]
    curriculum = courses["aggregations"]
    posted = jobs["skill"]["doc_count"]
    missing = jobs["missing_skills"]["doc_count"]
    return {
        "question": question,
        "executed_at": now(),
        "skill_id": skill,
        "market": {
            "scope": {"source": "JobVision", "country": "Iran", "index": market_index,
                      "collection_batch": MARKET_BATCH,
                      "categories": [bucket["key"] for bucket in jobs["categories"]["buckets"]],
                      "first_activation_month": jobs["first_month"]["buckets"][0]["key"],
                      "last_activation_month": jobs["last_month"]["buckets"][0]["key"]},
            "demand_count": compute("demand_count", posted),
            "all_postings": compute("demand_share", posted, market_total),
            "postings_with_recorded_skills": compute("recorded_share", posted, market_total - missing),
            "postings_without_recorded_skills": missing,
        },
        "education": {
            "scope": {"source": "Purdue", "major": "Computer Engineering", "program_id": PROGRAM,
                      "course_type": "required", "index": course_index, "collection_batch": COURSE_BATCH},
            "required_courses": compute("mandatory_course_coverage", curriculum["skill"]["doc_count"], course_total),
            "required_credits": compute("mandatory_credit_coverage", curriculum["skill"]["credits"]["value"], curriculum["credits"]["value"], limitation="missing_credits" if curriculum["missing_credits"]["doc_count"] else None),
        },
    }



def trend_report(client, skill, dates, question):
    index = get_dataset_index("job_postings", "real")
    filters = {m: {"term": {"activation_month": m}} for m in dates}
    response = client.search(index=index, size=0, allow_partial_search_results=False,
        query={"term": {"collection_batch": MARKET_BATCH}},
        aggs={"months": {"filters": {"filters": filters}, "aggs": {
            "matched": {"filter": {"term": {"skills": skill}}},
            "missing": {"filter": {"term": {"skill_count": 0}}}
        }}})
    if response["timed_out"]:
        raise RuntimeError("Incomplete Elasticsearch response")
    months = {}
    for m in dates:
        bucket = response["aggregations"]["months"]["buckets"][m]
        months[m] = dict(share=compute("demand_share", bucket["matched"]["doc_count"], bucket["doc_count"]),
                         without_skills=bucket["missing"]["doc_count"])
    previous, current = [months[m]["share"]["result"] for m in dates]
    if previous is None or current is None:
        growth = dict(computation_id="demand_growth", metric_version="1.0.0", result=None,
                      percent=None, numerator=None, denominator=previous, unit="percent",
                      formula=DEFINITIONS["demand_growth", "1.0.0"].formula,
                      status="not_computable", limitation="empty_period")
    else:
        growth = compute("demand_growth", current - previous, previous)
    return dict(question=question, skill_id=skill, executed_at=now(), months=months, growth=growth,
                scope=dict(source="JobVision", country="Iran", collection_batch=MARKET_BATCH,
                           index=index, categories="Software development and network/DevOps pilot"))
