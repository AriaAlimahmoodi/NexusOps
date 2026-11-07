from config import get_elasticsearch_client


def get_top_market_skills(limit: int = 10) -> dict:
    """
LABOR MARKET ANALYTICS TOOL.

MANDATORY USE CASES:
- Finding the most demanded market skills.
- Ranking skills by average demand score.
- Retrieving total market frequency for skills.
- Comparing market demand between skills.
- Identifying skills with high average demand.
- Answering questions about labor-market skill popularity.

RETURNS:
- skill
- average_demand_score
- total_frequency
- record_count

RANKING:
Skills are ranked by average_demand_score in descending order.

IMPORTANT:
For questions involving average demand or total market frequency,
this tool MUST be used instead of search_elasticsearch.

LIMITATION:
This tool returns only the top N skills.
It does not support arbitrary threshold filtering
or guaranteed retrieval of every skill.
"""

    if limit < 1:
        limit = 1

    if limit > 50:
        limit = 50

    es = get_elasticsearch_client()

    try:
        response = es.search(
            index="labor_market",
            size=0,
            aggs={
                "top_skills": {
                    "terms": {
                        "field": "skill",
                        "size": limit,
                        "order": {
                            "avg_demand": "desc"
                        }
                    },
                    "aggs": {
                        "avg_demand": {
                            "avg": {
                                "field": "demand_score"
                            }
                        },
                        "total_frequency": {
                            "sum": {
                                "field": "frequency"
                            }
                        }
                    }
                }
            }
        )

        results = []

        for bucket in response["aggregations"]["top_skills"]["buckets"]:
            results.append({
                "skill": bucket["key"],
                "average_demand_score": round(
                    bucket["avg_demand"]["value"], 2
                ),
                "total_frequency": bucket["total_frequency"]["value"],
                "record_count": bucket["doc_count"],
            })

        return {
            "analysis": "top_market_skills",
            "limit": limit,
            "results": results,
        }

    finally:
        es.close()


def get_top_skill_gaps(limit: int = 10) -> dict:
    """
UNIVERSITY-MARKET SKILL GAP ANALYTICS TOOL.

MANDATORY USE CASES:
- Finding skills with the largest university-market gaps.
- Ranking skills by market_gap.
- Comparing university coverage and market demand.
- Identifying skills that are insufficiently covered
  by university courses.
- Prioritizing curriculum improvements based on skill gaps.

RETURNS:
- ranked_skill
- associated_course_id
- associated_course_name
- course_coverage
- market_demand
- market_gap

RANKING:
Skills are ranked by market_gap in descending order.

IMPORTANT:
For questions involving university-market skill gaps,
this tool MUST be used instead of search_elasticsearch.

LIMITATION:
This tool returns only the top N skill-gap records.
Absence from the returned results does not prove
that a skill is absent from the dataset.
"""

    if limit < 1:
        limit = 1

    if limit > 50:
        limit = 50

    es = get_elasticsearch_client()

    try:
        response = es.search(
            index="skill_mapping",
            size=limit,
            query={
                "exists": {
                    "field": "market_gap"
                }
            },
            sort=[
                {
                    "market_gap": {
                        "order": "desc"
                    }
                }
            ],
            source=[
                "skill",
                "course_id",
                "course_name",
                "course_coverage",
                "market_demand",
                "market_gap",
            ],
        )

        results = []

        for hit in response["hits"]["hits"]:
            data = hit["_source"]

            results.append({
                "ranked_skill": data.get("skill"),
                "associated_course_id": data.get("course_id"),
                "associated_course_name": data.get("course_name"),
                "course_coverage": data.get("course_coverage"),
                "market_demand": data.get("market_demand"),
                "market_gap": data.get("market_gap"),
            })

        return {
                "analysis": "top_skill_gaps",
                "ranking_unit": "skill",
                "description": (
                    "Each result is a skill ranked by university-market gap. "
                    "The associated course is the university course related to that skill."
                ),
            "limit": limit,
            "results": results,
        }

    finally:
        es.close()