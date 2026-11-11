"""Evidence-grounded university and labor-market analytics.

This domain layer orchestrates the existing single-dataset analytics engine.
It deliberately avoids cross-index joins and labels proxy measures explicitly.
"""
from __future__ import annotations

from collections import defaultdict
from typing import Any

from tools.analytics_tool import run_analytics_query


ANALYSIS_TYPES = {
    "skill_demand",
    "skill_trends",
    "skill_gaps",
    "major_comparison",
    "course_effectiveness",
    "curriculum_recommendations",
    "management_report",
}


def _run_aggregate(
    dataset_id: str,
    group_by: list[str],
    metrics: list[dict[str, str]],
    *,
    limit: int,
    sort: list[dict[str, str]] | None = None,
    filters: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Execute one validated analytics request against exactly one dataset."""
    arguments: dict[str, Any] = {
        "dataset_id": dataset_id,
        "operation": "aggregate",
        "group_by": group_by,
        "metrics": metrics,
        "sort": sort or [],
        "limit": limit,
        "options": {},
    }
    if filters:
        arguments["filters"] = filters

    try:
        response = run_analytics_query(arguments)
    except Exception as exc:  # Keep each report section failure explicit.
        return {
            "status": "error",
            "dataset_id": dataset_id,
            "error": {
                "code": "DOMAIN_ANALYTICS_EXECUTION_FAILED",
                "message": str(exc),
            },
        }

    if not isinstance(response, dict) or response.get("status") != "success":
        error = response.get("error") if isinstance(response, dict) else None
        return {
            "status": "error",
            "dataset_id": dataset_id,
            "error": error or {
                "code": "INVALID_ANALYTICS_RESPONSE",
                "message": "Analytics engine returned an invalid response.",
            },
        }

    result = response.get("result") or {}
    buckets = result.get("buckets", []) if isinstance(result, dict) else []
    if not isinstance(buckets, list):
        return {
            "status": "error",
            "dataset_id": dataset_id,
            "error": {
                "code": "INVALID_AGGREGATION_RESULT",
                "message": "Analytics engine did not return an aggregation bucket list.",
            },
        }

    rows = []
    for bucket in buckets:
        if not isinstance(bucket, dict):
            continue
        group = bucket.get("group") or {}
        values = bucket.get("metrics") or {}
        if isinstance(group, dict) and isinstance(values, dict):
            rows.append({**group, **values, "document_count": bucket.get("document_count")})

    return {
        "status": "success",
        "dataset_id": dataset_id,
        "rows": rows,
        "metadata": response.get("metadata") or {},
        "warnings": response.get("warnings") or [],
    }


def _skill_demand(limit: int) -> dict[str, Any]:
    result = _run_aggregate(
        "labor_market",
        ["skill"],
        [
            {"function": "avg", "field": "demand_score", "alias": "average_demand_score"},
            {"function": "sum", "field": "frequency", "alias": "total_frequency"},
            {"function": "count_documents", "alias": "market_record_count"},
        ],
        limit=limit,
        sort=[{"field": "average_demand_score", "order": "desc"}],
    )
    result["analysis_type"] = "skill_demand"
    result["interpretation"] = (
        "مقایسه مقطعی مهارت‌ها بر اساس میانگین امتیاز تقاضا و مجموع فراوانی ثبت‌شده؛ "
        "این خروجی به‌تنهایی روند زمانی را نشان نمی‌دهد."
    )
    return result


def _skill_gaps(limit: int) -> dict[str, Any]:
    result = _run_aggregate(
        "skill_mapping",
        ["skill", "course_id", "course_name"],
        [
            {"function": "avg", "field": "course_coverage", "alias": "average_course_coverage"},
            {"function": "avg", "field": "market_demand", "alias": "average_market_demand"},
            {"function": "avg", "field": "market_gap", "alias": "average_market_gap"},
        ],
        limit=limit,
        sort=[{"field": "average_market_gap", "order": "desc"}],
    )
    result["analysis_type"] = "skill_gaps"
    result["interpretation"] = (
        "رتبه‌بندی شکاف‌ها با استفاده از فیلد market_gap ثبت‌شده در skill_mapping؛ "
        "مقادیر به‌عنوان شاخص از پیش محاسبه‌شده گزارش می‌شوند و در این لایه بازتعریف نمی‌شوند."
    )
    return result


def _major_comparison(limit: int, major: str | None = None) -> dict[str, Any]:
    filters = None
    if major:
        filters = {
            "logic": "and",
            "conditions": [{"field": "major", "operator": "eq", "value": major}],
            "groups": [],
        }
    result = _run_aggregate(
        "university_graduates",
        ["major"],
        [
            {"function": "count_documents", "alias": "graduate_count"},
            {"function": "avg", "field": "career_relevance", "alias": "average_career_relevance"},
            {"function": "avg", "field": "employment_months", "alias": "average_employment_months"},
        ],
        limit=limit,
        sort=[{"field": "average_career_relevance", "order": "desc"}],
        filters=filters,
    )
    result["analysis_type"] = "major_comparison"
    result["interpretation"] = (
        "مقایسه خروجی‌های ثبت‌شده فارغ‌التحصیلان به تفکیک major؛ "
        "این شاخص‌ها توصیفی‌اند و به‌تنهایی رابطه علّی میان رشته و موفقیت شغلی را اثبات نمی‌کنند."
    )
    return result


def _course_effectiveness(limit: int, course_id: str | None = None) -> dict[str, Any]:
    filters = None
    if course_id:
        filters = {
            "logic": "and",
            "conditions": [{"field": "course_id", "operator": "eq", "value": course_id}],
            "groups": [],
        }
    raw = _run_aggregate(
        "course_graduate_records",
        ["course_id", "course_name", "job_field"],
        [{"function": "count_documents", "alias": "relationship_records"}],
        limit=1000,
        sort=[{"field": "relationship_records", "order": "desc"}],
        filters=filters,
    )
    if raw.get("status") != "success":
        raw["analysis_type"] = "course_effectiveness"
        return raw

    courses: dict[str, dict[str, Any]] = {}
    for row in raw["rows"]:
        key = str(row.get("course_id") or "")
        if not key:
            continue
        item = courses.setdefault(key, {
            "course_id": key,
            "course_name": row.get("course_name"),
            "relationship_records": 0,
            "job_fields": set(),
            "job_field_breakdown": [],
        })
        count = row.get("relationship_records")
        count = count if isinstance(count, int) and not isinstance(count, bool) else 0
        item["relationship_records"] += count
        job_field = row.get("job_field")
        if job_field is not None:
            item["job_fields"].add(str(job_field))
        item["job_field_breakdown"].append({
            "job_field": job_field,
            "relationship_records": count,
        })

    rows = []
    for item in courses.values():
        item["represented_job_fields"] = len(item.pop("job_fields"))
        rows.append(item)
    rows.sort(key=lambda item: (-item["relationship_records"], item["course_id"]))
    raw["rows"] = rows[:limit]
    raw["analysis_type"] = "course_effectiveness"
    raw["interpretation"] = (
        "این تحلیل یک نمایه پوشش/ارتباط درس با سوابق فارغ‌التحصیلان و حوزه‌های شغلی است. "
        "تعداد رابطه‌ها و تنوع حوزه‌های شغلی شاخص جانشین هستند، نه سنجش علّی اثربخشی آموزشی؛ "
        "داده فعلی نمره یادگیری، قبل/بعد آموزش یا گروه کنترل ارائه نمی‌کند."
    )
    raw["method"] = "grouped course_graduate_records by course_id, course_name, and job_field"
    return raw


def _curriculum_recommendations(limit: int) -> dict[str, Any]:
    gaps = _skill_gaps(limit)
    if gaps.get("status") != "success":
        return {
            "status": "error",
            "analysis_type": "curriculum_recommendations",
            "error": gaps.get("error"),
            "sections": {"skill_gaps": gaps},
            "recommendations": [],
        }

    recommendations = []
    for rank, row in enumerate(gaps.get("rows", []), start=1):
        recommendations.append({
            "priority_rank": rank,
            "skill": row.get("skill"),
            "associated_course_id": row.get("course_id"),
            "associated_course_name": row.get("course_name"),
            "market_gap": row.get("average_market_gap"),
            "market_demand": row.get("average_market_demand"),
            "course_coverage": row.get("average_course_coverage"),
            "recommended_action": (
                "بازبینی محتوای درس مرتبط و ارزیابی امکان تقویت پوشش این مهارت "
                "با توجه به شکاف ثبت‌شده بازار."
            ),
            "evidence_basis": "skill_mapping: market_gap, market_demand, course_coverage, course_id, course_name",
        })

    return {
        "status": "success",
        "analysis_type": "curriculum_recommendations",
        "title": "پیشنهادهای اولویت‌بندی‌شده برای بازبینی برنامه درسی",
        "sections": {"skill_gaps": gaps},
        "recommendations": recommendations,
        "results": recommendations,
        "methodology": (
            "اولویت‌ها بر اساس ترتیب نزولی average_market_gap در داده‌های skill_mapping تعیین شده‌اند؛ "
            "پیشنهادها نیازمند ارزیابی تخصصی آموزشی پیش از تصویب تغییر برنامه درسی هستند."
        ),
        "limitations": [
            "این خروجی پیشنهاد تصمیم‌یار است و جایگزین داوری متخصصان برنامه‌ریزی درسی نیست.",
            "هیچ درس جدیدی بدون شواهد مستقیم در داده‌ها پیشنهاد یا ساخته نشده است.",
        ],
    }


def analyze_university_market(
    analysis_type: str = "management_report",
    limit: int = 10,
    major: str | None = None,
    course_id: str | None = None,
) -> dict[str, Any]:
    """Run one domain analysis or a coordinated management report."""
    if analysis_type not in ANALYSIS_TYPES:
        return {
            "status": "error",
            "error": {
                "code": "UNSUPPORTED_ANALYSIS_TYPE",
                "message": f"analysis_type must be one of: {', '.join(sorted(ANALYSIS_TYPES))}.",
            },
        }
    if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 100:
        return {
            "status": "error",
            "error": {
                "code": "INVALID_LIMIT",
                "message": "limit must be an integer between 1 and 100.",
            },
        }
    if major is not None and (not isinstance(major, str) or not major.strip()):
        return {"status": "error", "error": {"code": "INVALID_MAJOR", "message": "major must be a non-empty string."}}
    if course_id is not None and (not isinstance(course_id, str) or not course_id.strip()):
        return {"status": "error", "error": {"code": "INVALID_COURSE_ID", "message": "course_id must be a non-empty string."}}

    if analysis_type == "skill_demand":
        return _skill_demand(limit)
    if analysis_type == "skill_gaps":
        return _skill_gaps(limit)
    if analysis_type == "major_comparison":
        return _major_comparison(limit, major)
    if analysis_type == "course_effectiveness":
        return _course_effectiveness(limit, course_id)
    if analysis_type == "curriculum_recommendations":
        return _curriculum_recommendations(limit)
    if analysis_type == "skill_trends":
        snapshot = _skill_demand(limit)
        if snapshot.get("status") != "success":
            return {"status": "error", "analysis_type": "skill_trends", "snapshot": snapshot}
        return {
            "status": "limited",
            "analysis_type": "skill_trends",
            "title": "وضعیت مقطعی مهارت‌ها؛ روند زمانی قابل محاسبه نیست",
            "snapshot": snapshot,
            "results": snapshot.get("rows", []),
            "interpretation": snapshot.get("interpretation"),
            "trend_status": "unavailable",
            "limitations": [
                "پروفایل فعلی labor_market فاقد فیلد تاریخ، بازه زمانی یا زمان ثبت داده است.",
                "بدون داده‌های چنددوره‌ای، محاسبه رشد، افت یا تغییر روند مهارت‌ها معتبر نیست.",
            ],
            "required_data": ["period", "observed_at یا date", "skill", "demand_score", "frequency"],
        }

    sections = {
        "skill_demand": _skill_demand(limit),
        "skill_gaps": _skill_gaps(limit),
        "major_comparison": _major_comparison(limit, major),
        "course_effectiveness": _course_effectiveness(limit, course_id),
    }
    successes = sum(section.get("status") == "success" for section in sections.values())
    failures = len(sections) - successes
    recommendations_result = _curriculum_recommendations(limit)
    if recommendations_result.get("status") != "success":
        failures += 1
    status = "success" if failures == 0 else "partial_success" if successes else "error"

    summary_rows = [
        {
            "section": key,
            "status": value.get("status"),
            "rows_returned": len(value.get("rows", [])),
            "dataset_id": value.get("dataset_id"),
        }
        for key, value in sections.items()
    ]
    return {
        "status": status,
        "analysis_type": "management_report",
        "title": "گزارش مدیریتی تحلیل دانشگاه و بازار کار",
        "results": summary_rows,
        "sections": sections,
        "recommendations": recommendations_result.get("recommendations", []),
        "limitations": [
            "روند زمانی مهارت‌ها در داده فعلی قابل محاسبه نیست؛ labor_market فاقد فیلد زمان است.",
            "تحلیل اثربخشی درس بر پایه روابط ثبت‌شده درس-فارغ‌التحصیل و تنوع حوزه‌های شغلی است، نه اثبات اثر علّی آموزش.",
            "هر analytics_query فقط یک دیتاست را می‌خواند؛ این گزارش نتایج مستقل را کنار هم قرار می‌دهد و JOIN بین ایندکس‌ها انجام نمی‌دهد.",
        ],
        "methodology": (
            "گزارش از چهار تحلیل مستقل روی labor_market، skill_mapping، "
            "university_graduates و course_graduate_records ساخته می‌شود. "
            "پیشنهادهای برنامه درسی از رتبه‌بندی market_gap در skill_mapping استخراج می‌شوند."
        ),
        "section_failures": failures,
    }
