import json
import re
from typing import Any

from config import get_elasticsearch_client


# ============================================================
# Searchable fields
# ============================================================

INDEX_FIELDS = {
    "university_graduates": [
        "graduate_id",
        "major",
        "study_level",
        "job_title",
        "job_field",
        "additional_skills",
    ],
    "university_courses": [
        "course_id",
        "course_name",
        "course_category",
        "skills",
    ],
    "course_graduate_records": [
        "course_id",
        "course_name",
        "graduate_id",
        "job_field",
        "related_skills",
    ],
    "labor_market": [
        "job_title",
        "job_field",
        "skill",
        "experience_level",
        "source_type",
    ],
    "skill_mapping": [
        "course_id",
        "course_name",
        "skill",
    ],
}


# ============================================================
# Structured entity patterns
# ============================================================

ENTITY_PATTERNS = {
    "graduate_id": re.compile(
        r"\bG\d{4,}\b",
        re.IGNORECASE,
    ),
    "course_id": re.compile(
        r"\bC\d{3,}\b",
        re.IGNORECASE,
    ),
}


# ============================================================
# Entity detection
# ============================================================

def detect_entities(
    query: str,
) -> list[dict[str, str]]:
    """
    Detect structured identifiers.

    This function is intentionally language-independent.

    Examples:
        G0001 -> graduate_id
        C013  -> course_id
    """

    detected = []

    for entity_type, pattern in ENTITY_PATTERNS.items():

        for match in pattern.finditer(query):

            value = match.group(0).upper()

            detected.append(
                {
                    "type": entity_type,
                    "value": value,
                }
            )

    # Deduplicate.
    result = []
    seen = set()

    for entity in detected:

        key = (
            entity["type"],
            entity["value"].casefold(),
        )

        if key in seen:
            continue

        seen.add(key)
        result.append(entity)

    return result


# ============================================================
# Exact entity query
# ============================================================

def build_entity_query(
    entity_type: str,
    entity_value: str,
) -> dict[str, Any]:

    if entity_type not in {
        "graduate_id",
        "course_id",
    }:
        raise ValueError(
            f"Unsupported structured entity type: {entity_type}"
        )

    return {
        "term": {
            entity_type: entity_value,
        }
    }


# ============================================================
# Natural-language fallback
# ============================================================

def build_text_query(
    query: str,
    fields: list[str],
) -> dict[str, Any]:

    return {
        "multi_match": {
            "query": query,
            "fields": fields,
            "type": "best_fields",
            "operator": "or",
        }
    }


# ============================================================
# Main search tool
# ============================================================

def search_elasticsearch(
    query: str,
) -> str:
    """
GENERAL DOCUMENT SEARCH TOOL.

PURPOSE:
Search individual documents and records in Elasticsearch.

USE THIS TOOL ONLY FOR:
- Searching graduate records.
- Looking up a specific graduate ID such as G0001.
- Searching university courses.
- Looking up course IDs such as C013.
- Finding general records by textual keywords.
- Retrieving individual documents from indexed datasets.

DO NOT USE THIS TOOL FOR:
- Ranking market skills.
- Calculating average market demand.
- Calculating total market frequency.
- Finding top demanded skills.
- Ranking university-market skill gaps.
- Comparing market demand statistics.
- Performing aggregation-based analytics.

IMPORTANT:
Dedicated analytics tools must be used for market statistics
and university-market gap analysis.

This tool performs document retrieval, not analytical aggregation.

    """

    query = query.strip()

    if not query:
        return json.dumps(
            {
                "error": "Query must not be empty."
            },
            ensure_ascii=False,
        )

    detected_entities = detect_entities(query)

    es = get_elasticsearch_client()

    results = []

    try:

        for index, fields in INDEX_FIELDS.items():

            if not es.indices.exists(index=index):
                continue

            # ------------------------------------------------
            # Search each structured entity independently.
            #
            # This is important for comparisons:
            #
            # Kubernetes vs DevOps
            #
            # and for multiple IDs.
            # ------------------------------------------------

            if detected_entities:

                for entity in detected_entities:

                    entity_type = entity["type"]
                    entity_value = entity["value"]

                    if entity_type not in fields:
                        continue

                    search_query = build_entity_query(
                        entity_type=entity_type,
                        entity_value=entity_value,
                    )

                    response = es.search(
                        index=index,
                        size=20,
                        query=search_query,
                    )

                    for hit in response["hits"]["hits"]:

                        results.append(
                            {
                                "index": index,
                                "score": hit["_score"],
                                "id": hit["_id"],
                                "data": hit["_source"],
                            }
                        )

            # ------------------------------------------------
            # Natural-language fallback
            # ------------------------------------------------

            else:

                search_query = build_text_query(
                    query=query,
                    fields=fields,
                )

                response = es.search(
                    index=index,
                    size=20,
                    query=search_query,
                )

                for hit in response["hits"]["hits"]:

                    results.append(
                        {
                            "index": index,
                            "score": hit["_score"],
                            "id": hit["_id"],
                            "data": hit["_source"],
                        }
                    )

        # ----------------------------------------------------
        # Deduplicate identical records.
        # ----------------------------------------------------

        unique_results = []
        seen = set()

        for item in results:

            key = (
                item["index"],
                item["id"],
            )

            if key in seen:
                continue

            seen.add(key)
            unique_results.append(item)

        unique_results.sort(
            key=lambda item: item["score"] or 0,
            reverse=True,
        )

        return json.dumps(
            {
                "query": query,
                "detected_entities": detected_entities,
                "total_returned": len(unique_results),
                "results": unique_results[:50],
            },
            ensure_ascii=False,
            indent=2,
        )

    except Exception as exc:

        return json.dumps(
            {
                "error": "Elasticsearch search failed.",
                "details": str(exc),
            },
            ensure_ascii=False,
        )

    finally:
        es.close()
