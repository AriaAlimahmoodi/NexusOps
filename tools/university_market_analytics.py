"""Evidence-grounded university and labor-market analytics.

This domain layer orchestrates the existing single-dataset analytics engine.
It deliberately avoids cross-index joins and labels proxy measures explicitly.
"""
from __future__ import annotations

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
                **(
                    {"details": getattr(exc, "details")}
                    if isinstance(getattr(exc, "details", None), dict)
                    and getattr(exc, "details")
                    else {}
                ),
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
        "results": rows,
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
    warnings = result.get("warnings") or []
    omitted = None
    import re
    for warning in warnings:
        match = re.search(r"sum_other_doc_count\\s*[=:]\\s*(\\d+)", str(warning))
        if match:
            omitted = int(match.group(1))
            break
    result["metadata"] = {
        **(result.get("metadata") or {}),
        "aggregation_coverage": {
            "returned_skill_buckets": len(result.get("rows", [])),
            "omitted_document_count": omitted,
            "truncated": omitted is not None and omitted > 0,
            "scope": "Elasticsearch terms aggregation; omitted count is not a count of omitted skill buckets",
        },
    }
    if omitted:
        result.setdefault("warnings", []).append(
            f"Skill-demand terms aggregation reports {omitted} documents in sum_other_doc_count; returned skill buckets are not exhaustive."
        )
    result["interpretation"] = (
        "مقایسه مقطعی مهارت‌ها بر اساس میانگین امتیاز تقاضا و مجموع فراوانی ثبت‌شده؛ "
        "این خروجی به‌تنهایی روند زمانی را نشان نمی‌دهد."
    )
    return result


def _skill_gaps(limit: int) -> dict[str, Any]:
    # Elasticsearch cannot order an outer terms aggregation by a metric that
    # lives below another multi-bucket terms aggregation. Fetch the bounded
    # skill/course combinations first, then apply the requested global ranking
    # to the flattened rows in this domain layer.
    result = _run_aggregate(
        "skill_mapping",
        ["skill", "course_id", "course_name"],
        [
            {"function": "avg", "field": "course_coverage", "alias": "average_course_coverage"},
            {"function": "avg", "field": "market_demand", "alias": "average_market_demand"},
            {"function": "avg", "field": "market_gap", "alias": "average_market_gap"},
        ],
        limit=1000,
    )
    result["analysis_type"] = "skill_gaps"
    if result.get("status") == "success":
        rows = result.get("rows", [])
        rows.sort(
            key=lambda row: (
                -(row.get("average_market_gap")
                  if isinstance(row.get("average_market_gap"), (int, float))
                  else float("-inf")),
                str(row.get("skill") or ""),
                str(row.get("course_id") or ""),
                str(row.get("course_name") or ""),
            )
        )
        result["rows"] = rows[:limit]
        result["results"] = result["rows"]
        result["metadata"] = {
            **(result.get("metadata") or {}),
            "ranking": {
                "scope": "global_flattened_skill_course_rows",
                "field": "average_market_gap",
                "order": "desc",
                "applied_by": "domain_layer",
                "candidate_rows": len(rows),
                "returned_rows": len(result["rows"]),
            },
        }
        if len(rows) > limit:
            result.setdefault("warnings", []).append(
                f"Global skill-gap ranking returned the top {limit} of {len(rows)} fetched skill/course combinations."
            )
    result["interpretation"] = (
        "رتبه‌بندی سراسری ترکیب مهارت و درس بر اساس میانگین market_gap ثبت‌شده؛ "
        "ابتدا گروه‌ها بدون مرتب‌سازی تو‌در‌تو از Elasticsearch دریافت و سپس در لایه دامنه مرتب می‌شوند. "
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
    if result.get("status") == "success" and len(result.get("rows", [])) < 2:
        result["metadata"] = {
            **(result.get("metadata") or {}),
            "comparison_status": "insufficient_returned_groups",
            "returned_major_groups": len(result.get("rows", [])),
        }
        result.setdefault("warnings", []).append(
            "Fewer than two major groups were returned; this does not establish that other majors are absent from the full dataset."
        )
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

    totals = _run_aggregate(
        "course_graduate_records",
        ["course_id", "course_name"],
        [{"function": "count_documents", "alias": "relationship_records"}],
        limit=1000,
        sort=[{"field": "relationship_records", "order": "desc"}],
        filters=filters,
    )
    if totals.get("status") != "success":
        totals["analysis_type"] = "course_effectiveness"
        return totals

    breakdown = _run_aggregate(
        "course_graduate_records",
        ["course_id", "course_name", "job_field"],
        [{"function": "count_documents", "alias": "job_field_relationship_records"}],
        limit=1000,
        sort=[{"field": "job_field_relationship_records", "order": "desc"}],
        filters=filters,
    )

    courses: dict[str, dict[str, Any]] = {}
    for row in totals["rows"]:
        key = str(row.get("course_id") or "")
        if not key:
            continue
        courses[key] = {
            "course_id": key,
            "course_name": row.get("course_name"),
            "relationship_records": row.get("relationship_records", 0),
            "represented_job_fields": 0,
            "job_field_breakdown": [],
        }

    if breakdown.get("status") == "success":
        for row in breakdown["rows"]:
            key = str(row.get("course_id") or "")
            if key not in courses or row.get("job_field") is None:
                continue
            courses[key]["job_field_breakdown"].append({
                "job_field": row.get("job_field"),
                "relationship_records": row.get("job_field_relationship_records"),
            })
        for item in courses.values():
            item["represented_job_fields"] = len(item["job_field_breakdown"])

    rows = sorted(
        courses.values(),
        key=lambda item: (
            -(item["relationship_records"] if isinstance(item["relationship_records"], int) else 0),
            item["course_id"],
        ),
    )
    displayed_rows = rows[:limit]
    source_metadata = totals.get("metadata", {})
    metadata = {
        **source_metadata,
        "aggregation_returned_records": source_metadata.get("returned_records"),
        "returned_records": len(displayed_rows),
        "displayed_rows": len(displayed_rows),
        "returned_records_semantics": "number of course rows exposed by this domain response",
    }
    return {
        "status": "success" if breakdown.get("status") == "success" else "partial_success",
        "analysis_type": "course_effectiveness",
        "dataset_id": "course_graduate_records",
        "rows": displayed_rows,
        "results": displayed_rows,
        "metadata": metadata,
        "warnings": totals.get("warnings", []) + breakdown.get("warnings", []),
        "interpretation": (
            "این تحلیل یک نمایه پوشش/ارتباط درس با سوابق فارغ‌التحصیلان و حوزه‌های شغلی است. "
            "تعداد رابطه‌های ثبت‌شده و تنوع حوزه‌های شغلی شاخص جانشین هستند، نه سنجش علّی اثربخشی آموزشی؛ "
            "داده فعلی نمره یادگیری، قبل/بعد آموزش یا گروه کنترل ارائه نمی‌کند."
        ),
        "method": (
            "دو aggregation مستقل روی course_graduate_records: شمارش رابطه‌ها به تفکیک درس، "
            "و شمارش رابطه‌ها به تفکیک درس و job_field؛ بدون JOIN بین ایندکس‌ها."
        ),
        **({"limitations": ["تحلیل breakdown حوزه‌های شغلی کامل نشد؛ تعداد کل رابطه‌های درس از aggregation مستقل حفظ شده است."]}
           if breakdown.get("status") != "success" else {}),
    }


def _build_curriculum_recommendations(gaps: dict[str, Any]) -> list[dict[str, Any]]:
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
    return recommendations


def _curriculum_recommendations(limit: int) -> dict[str, Any]:
    gaps = _skill_gaps(limit)
    if gaps.get("status") != "success":
        return {
            "status": "error",
            "analysis_type": "curriculum_recommendations",
            "error": gaps.get("error"),
            "sections": {"skill_gaps": gaps},
            "recommendations": [],
            "results": [],
        }

    recommendations = _build_curriculum_recommendations(gaps)
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
    section_statuses = [section.get("status") for section in sections.values()]
    successes = sum(section_status == "success" for section_status in section_statuses)
    partial_successes = sum(section_status == "partial_success" for section_status in section_statuses)
    failures = sum(section_status == "error" for section_status in section_statuses)
    completed_sections = successes + partial_successes

    gaps_for_recommendations = sections["skill_gaps"]
    recommendations = (
        _build_curriculum_recommendations(gaps_for_recommendations)
        if gaps_for_recommendations.get("status") == "success"
        else []
    )
    if failures == 0 and partial_successes == 0:
        status = "success"
    elif completed_sections:
        status = "partial_success"
    else:
        status = "error"

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
        "limit_per_section": limit,
        "results": summary_rows,
        "sections": sections,
        "recommendations": recommendations,
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
        "section_partial_successes": partial_successes,
    }
