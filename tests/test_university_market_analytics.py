from __future__ import annotations

from copy import deepcopy

import tools.university_market_analytics as domain


def _success(dataset_id, rows):
    return {
        "status": "success",
        "dataset_id": dataset_id,
        "operation": "aggregate",
        "result": {
            "buckets": [
                {
                    "group": row["group"],
                    "metrics": row.get("metrics", {}),
                    "document_count": row.get("document_count", 1),
                }
                for row in rows
            ]
        },
        "metadata": {"returned_records": len(rows), "total_records": len(rows)},
        "warnings": [],
    }


def test_skill_demand_uses_labor_market_and_returns_multiple_market_metrics(monkeypatch):
    calls = []

    def fake(arguments):
        calls.append(deepcopy(arguments))
        return _success("labor_market", [{
            "group": {"skill": "Python"},
            "metrics": {
                "average_demand_score": 4.6,
                "total_frequency": 120,
                "market_record_count": 8,
            },
        }])

    monkeypatch.setattr(domain, "run_analytics_query", fake)
    result = domain.analyze_university_market("skill_demand", 7)

    assert result["status"] == "success"
    assert result["analysis_type"] == "skill_demand"
    assert result["rows"][0]["skill"] == "Python"
    assert calls[0]["dataset_id"] == "labor_market"
    assert calls[0]["group_by"] == ["skill"]
    assert calls[0]["limit"] == 7
    assert {metric["alias"] for metric in calls[0]["metrics"]} == {
        "average_demand_score", "total_frequency", "market_record_count",
    }


def test_skill_gaps_preserve_associated_course_evidence(monkeypatch):
    captured = {}

    def fake(arguments):
        captured.update(deepcopy(arguments))
        return _success("skill_mapping", [{
            "group": {
                "skill": "Cloud Computing",
                "course_id": "C013",
                "course_name": "رایانش ابری",
            },
            "metrics": {
                "average_course_coverage": 1.5,
                "average_market_demand": 4.8,
                "average_market_gap": 3.3,
            },
        }])

    monkeypatch.setattr(domain, "run_analytics_query", fake)
    result = domain.analyze_university_market("skill_gaps")

    assert result["status"] == "success"
    assert captured["group_by"] == ["skill", "course_id", "course_name"]
    assert captured["limit"] == 1000
    assert captured["sort"] == []
    assert result["rows"][0]["course_id"] == "C013"
    assert result["rows"][0]["average_market_gap"] == 3.3
    assert result["metadata"]["ranking"]["scope"] == "global_flattened_skill_course_rows"


def test_major_comparison_uses_graduate_outcomes_and_optional_major_filter(monkeypatch):
    captured = {}

    def fake(arguments):
        captured.update(deepcopy(arguments))
        return _success("university_graduates", [{
            "group": {"major": "Computer Engineering"},
            "metrics": {
                "graduate_count": 12,
                "average_career_relevance": 4.4,
                "average_employment_months": 6.5,
            },
        }])

    monkeypatch.setattr(domain, "run_analytics_query", fake)
    result = domain.analyze_university_market(
        "major_comparison", major="Computer Engineering"
    )

    assert result["status"] == "success"
    assert captured["dataset_id"] == "university_graduates"
    assert captured["filters"]["conditions"] == [
        {"field": "major", "operator": "eq", "value": "Computer Engineering"}
    ]
    assert result["rows"][0]["graduate_count"] == 12


def test_course_effectiveness_is_reported_as_relationship_coverage_proxy(monkeypatch):
    calls = []

    def fake(arguments):
        calls.append(deepcopy(arguments))
        if arguments["group_by"] == ["course_id", "course_name"]:
            return _success("course_graduate_records", [{
                "group": {"course_id": "C013", "course_name": "رایانش ابری"},
                "metrics": {"relationship_records": 7},
            }])
        assert arguments["group_by"] == ["course_id", "course_name", "job_field"]
        return _success("course_graduate_records", [
            {
                "group": {"course_id": "C013", "course_name": "رایانش ابری", "job_field": "DevOps"},
                "metrics": {"job_field_relationship_records": 4},
            },
            {
                "group": {"course_id": "C013", "course_name": "رایانش ابری", "job_field": "Software"},
                "metrics": {"job_field_relationship_records": 3},
            },
        ])

    monkeypatch.setattr(domain, "run_analytics_query", fake)
    result = domain.analyze_university_market("course_effectiveness")

    assert result["status"] == "success"
    assert len(calls) == 2
    assert calls[0]["group_by"] == ["course_id", "course_name"]
    assert result["rows"][0]["course_id"] == "C013"
    assert result["rows"][0]["relationship_records"] == 7
    assert result["rows"][0]["represented_job_fields"] == 2
    assert "علّی" in result["interpretation"]


def test_curriculum_recommendations_are_ranked_and_traceable_to_skill_mapping(monkeypatch):
    def fake(arguments):
        return _success("skill_mapping", [{
            "group": {
                "skill": "Kubernetes",
                "course_id": "C013",
                "course_name": "رایانش ابری",
            },
            "metrics": {
                "average_course_coverage": 1.0,
                "average_market_demand": 4.65,
                "average_market_gap": 3.65,
            },
        }])

    monkeypatch.setattr(domain, "run_analytics_query", fake)
    result = domain.analyze_university_market("curriculum_recommendations")

    recommendation = result["recommendations"][0]
    assert recommendation["priority_rank"] == 1
    assert recommendation["skill"] == "Kubernetes"
    assert recommendation["associated_course_id"] == "C013"
    assert recommendation["market_gap"] == 3.65
    assert recommendation["evidence_basis"].startswith("skill_mapping:")


def test_skill_trends_refuses_to_invent_temporal_trend(monkeypatch):
    monkeypatch.setattr(
        domain,
        "run_analytics_query",
        lambda arguments: _success("labor_market", [{
            "group": {"skill": "Python"},
            "metrics": {"average_demand_score": 4.5, "total_frequency": 50},
        }]),
    )
    result = domain.analyze_university_market("skill_trends")

    assert result["status"] == "limited"
    assert result["trend_status"] == "unavailable"
    assert any("فاقد فیلد تاریخ" in item for item in result["limitations"])
    assert result["snapshot"]["rows"][0]["skill"] == "Python"


def test_management_report_combines_independent_sections_without_joining(monkeypatch):
    datasets = []

    def fake(arguments):
        dataset_id = arguments["dataset_id"]
        datasets.append(dataset_id)
        if dataset_id == "labor_market":
            return _success(dataset_id, [{
                "group": {"skill": "Python"},
                "metrics": {"average_demand_score": 4.5, "total_frequency": 50},
            }])
        if dataset_id == "skill_mapping":
            return _success(dataset_id, [{
                "group": {"skill": "Python", "course_id": "C001", "course_name": "برنامه‌سازی"},
                "metrics": {
                    "average_course_coverage": 2,
                    "average_market_demand": 4.5,
                    "average_market_gap": 2.5,
                },
            }])
        if dataset_id == "university_graduates":
            return _success(dataset_id, [{
                "group": {"major": "Computer Engineering"},
                "metrics": {"graduate_count": 10},
            }])
        return _success(dataset_id, [{
            "group": {"course_id": "C001", "course_name": "برنامه‌سازی", "job_field": "Software"},
            "metrics": {"relationship_records": 3},
        }])

    monkeypatch.setattr(domain, "run_analytics_query", fake)
    result = domain.analyze_university_market("management_report")

    assert result["status"] == "success"
    assert set(result["sections"]) == {
        "skill_demand", "skill_gaps", "major_comparison", "course_effectiveness",
    }
    assert set(datasets) == {
        "labor_market", "skill_mapping", "university_graduates", "course_graduate_records",
    }
    assert any("JOIN" in item for item in result["limitations"])
    assert result["recommendations"][0]["associated_course_id"] == "C001"


def test_domain_tool_rejects_invalid_type_and_limit_without_querying(monkeypatch):
    monkeypatch.setattr(
        domain,
        "run_analytics_query",
        lambda arguments: (_ for _ in ()).throw(AssertionError("must not execute")),
    )

    assert domain.analyze_university_market("unknown")["error"]["code"] == "UNSUPPORTED_ANALYSIS_TYPE"
    assert domain.analyze_university_market("skill_demand", 0)["error"]["code"] == "INVALID_LIMIT"


def test_domain_tool_results_are_compatible_with_python_mcp_evidence_validation(monkeypatch):
    from query_planner import QueryPlan, validate_mcp_result

    def fake(arguments):
        if arguments["group_by"] == ["course_id", "course_name"]:
            return _success("course_graduate_records", [{
                "group": {"course_id": "C013", "course_name": "رایانش ابری"},
                "metrics": {"relationship_records": 5},
            }])
        return _success("course_graduate_records", [{
            "group": {"course_id": "C013", "course_name": "رایانش ابری", "job_field": "DevOps"},
            "metrics": {"job_field_relationship_records": 5},
        }])

    monkeypatch.setattr(domain, "run_analytics_query", fake)
    result = domain.analyze_university_market("course_effectiveness", course_id="C013")
    plan = QueryPlan(
        tool_name="analyze_university_market",
        arguments={"analysis_type": "course_effectiveness", "limit": 10, "course_id": "C013"},
        requested_entities=[{"type": "course_id", "value": "C013"}],
    )

    valid, message = validate_mcp_result(plan, result)
    assert valid, message
    assert result["results"][0]["course_id"] == "C013"


def test_aggregate_domain_sections_expose_results_alias_for_mcp_client(monkeypatch):
    monkeypatch.setattr(domain, "run_analytics_query", lambda arguments: _success(
        "labor_market", [{
            "group": {"skill": "Python"},
            "metrics": {"average_demand_score": 4.5, "total_frequency": 20},
        }]
    ))
    result = domain.analyze_university_market("skill_demand")
    assert result["results"] == result["rows"]



def test_management_report_counts_each_failed_section_once_and_ignores_warnings(monkeypatch):
    def fake(arguments):
        dataset_id = arguments["dataset_id"]
        if dataset_id in {"skill_mapping", "course_graduate_records"}:
            return {"status": "error", "dataset_id": dataset_id,
                    "error": {"code": "BACKEND_FAILURE", "message": "query failed"}}
        if dataset_id == "labor_market":
            response = _success(dataset_id, [{
                "group": {"skill": "Python"}, "metrics": {"average_demand_score": 4.5},
            }])
            response["warnings"] = ["terms buckets truncated"]
            return response
        return _success(dataset_id, [{
            "group": {"major": "Computer Engineering"}, "metrics": {"graduate_count": 3},
        }])

    monkeypatch.setattr(domain, "run_analytics_query", fake)
    result = domain.analyze_university_market("management_report")
    assert result["status"] == "partial_success"
    assert result["section_failures"] == 2
    assert result["section_partial_successes"] == 0
    assert result["sections"]["skill_demand"]["status"] == "success"


def test_management_report_tracks_partial_course_section_without_counting_failure(monkeypatch):
    def fake(arguments):
        dataset_id = arguments["dataset_id"]
        if dataset_id == "course_graduate_records":
            if arguments["group_by"] == ["course_id", "course_name"]:
                return _success(dataset_id, [{
                    "group": {"course_id": "C013", "course_name": "رایانش ابری"},
                    "metrics": {"relationship_records": 5},
                }])
            return {"status": "error", "dataset_id": dataset_id,
                    "error": {"code": "BACKEND_FAILURE", "message": "breakdown failed"}}
        if dataset_id == "skill_mapping":
            return _success(dataset_id, [{
                "group": {"skill": "Kubernetes", "course_id": "C013", "course_name": "رایانش ابری"},
                "metrics": {"average_course_coverage": 1, "average_market_demand": 4.8,
                            "average_market_gap": 3.8},
            }])
        if dataset_id == "labor_market":
            return _success(dataset_id, [{
                "group": {"skill": "Python"}, "metrics": {"average_demand_score": 4.5},
            }])
        return _success(dataset_id, [{
            "group": {"major": "Computer Engineering"}, "metrics": {"graduate_count": 3},
        }])

    monkeypatch.setattr(domain, "run_analytics_query", fake)
    result = domain.analyze_university_market("management_report")
    assert result["status"] == "partial_success"
    assert result["section_failures"] == 0
    assert result["section_partial_successes"] == 1
    assert result["sections"]["course_effectiveness"]["status"] == "partial_success"


def test_domain_section_preserves_structured_adapter_error_details(monkeypatch):
    class BackendFailure(Exception):
        details = {"request": {"index": "skill_mapping"},
                   "backend_exception": {"status_code": 400, "body": {"error": "bad request"}}}

    monkeypatch.setattr(
        domain, "run_analytics_query",
        lambda arguments: (_ for _ in ()).throw(BackendFailure("bad request")),
    )
    result = domain.analyze_university_market("skill_gaps")
    assert result["status"] == "error"
    assert result["error"]["details"]["backend_exception"]["status_code"] == 400



def test_skill_gaps_globally_ranks_flattened_rows_and_applies_requested_limit(monkeypatch):
    captured = {}

    def fake(arguments):
        captured.update(deepcopy(arguments))
        return _success("skill_mapping", [
            {
                "group": {"skill": "Python", "course_id": "C001", "course_name": "برنامه‌سازی"},
                "metrics": {"average_course_coverage": 2.0, "average_market_demand": 4.0,
                            "average_market_gap": 2.0},
            },
            {
                "group": {"skill": "Kubernetes", "course_id": "C013", "course_name": "رایانش ابری"},
                "metrics": {"average_course_coverage": 1.0, "average_market_demand": 4.8,
                            "average_market_gap": 3.8},
            },
            {
                "group": {"skill": "SQL", "course_id": "C005", "course_name": "پایگاه داده"},
                "metrics": {"average_course_coverage": 2.5, "average_market_demand": 4.5,
                            "average_market_gap": 2.0},
            },
        ])

    monkeypatch.setattr(domain, "run_analytics_query", fake)
    result = domain.analyze_university_market("skill_gaps", limit=2)

    assert result["status"] == "success"
    assert captured["sort"] == []
    assert captured["limit"] == 1000
    assert [row["skill"] for row in result["rows"]] == ["Kubernetes", "Python"]
    assert result["results"] == result["rows"]
    assert result["metadata"]["ranking"] == {
        "scope": "global_flattened_skill_course_rows",
        "field": "average_market_gap",
        "order": "desc",
        "applied_by": "domain_layer",
        "candidate_rows": 3,
        "returned_rows": 2,
    }


def test_skill_gaps_uses_stable_tiebreakers_for_equal_market_gap(monkeypatch):
    def fake(arguments):
        return _success("skill_mapping", [
            {
                "group": {"skill": "Zeta", "course_id": "C002", "course_name": "Z"},
                "metrics": {"average_market_gap": 2.5},
            },
            {
                "group": {"skill": "Alpha", "course_id": "C001", "course_name": "A"},
                "metrics": {"average_market_gap": 2.5},
            },
        ])

    monkeypatch.setattr(domain, "run_analytics_query", fake)
    result = domain.analyze_university_market("skill_gaps", limit=10)

    assert [(row["skill"], row["course_id"]) for row in result["rows"]] == [
        ("Alpha", "C001"), ("Zeta", "C002")
    ]


def test_skill_gaps_preserves_backend_failure_details(monkeypatch):
    backend_error = {
        "code": "BACKEND_FAILURE",
        "message": "search failed",
        "details": {"backend_exception": {"status_code": 400, "body": {"error": "bad request"}}},
    }
    monkeypatch.setattr(domain, "run_analytics_query", lambda arguments: {
        "status": "error", "dataset_id": "skill_mapping", "error": backend_error,
    })

    result = domain.analyze_university_market("skill_gaps")

    assert result["status"] == "error"
    assert result["error"]["details"] == backend_error["details"]
