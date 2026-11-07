from config import get_elasticsearch_client


def get_market_skill_details(skills: list[str]) -> dict:
    """
    Return market-demand metrics for explicitly requested skills.

    This tool is intended for questions about specific market skills,
    such as comparing DevOps and Cloud Computing.

    Args:
        skills: A list of skill names to retrieve.

    Returns:
        A dictionary containing the requested skills and their
        average demand score and total frequency.
    """

    if not skills:
        return {
            "analysis": "market_skill_details",
            "results": [],
            "message": "No skills were provided.",
        }

    skills = [skill.strip() for skill in skills if skill.strip()]

    if not skills:
        return {
            "analysis": "market_skill_details",
            "results": [],
            "message": "No valid skill names were provided.",
        }

    es = get_elasticsearch_client()

    response = es.search(
        index="labor_market",
        size=0,
        query={
            "terms": {
                "skill": skills
            }
        },
        aggs={
            "skills": {
                "terms": {
                    "field": "skill",
                    "size": len(skills),
                },
                "aggs": {
                    "average_demand_score": {
                        "avg": {
                            "field": "demand_score"
                        }
                    },
                    "total_frequency": {
                        "sum": {
                            "field": "frequency"
                        }
                    },
                },
            }
        },
    )

    results = []

    for bucket in response["aggregations"]["skills"]["buckets"]:
        results.append({
            "skill": bucket["key"],
            "average_demand_score": bucket["average_demand_score"]["value"],
            "total_frequency": bucket["total_frequency"]["value"],
            "record_count": bucket["doc_count"],
        })

    requested_skills = set(skills)
    returned_skills = {item["skill"] for item in results}

    missing_skills = sorted(requested_skills - returned_skills)

    return {
        "analysis": "market_skill_details",
        "requested_skills": skills,
        "results": results,
        "missing_skills": missing_skills,
    }