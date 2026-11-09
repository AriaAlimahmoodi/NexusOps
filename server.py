from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
import time
import uuid
from pathlib import Path
from typing import Any
from tools.market_skills import get_market_skill_details
from runtime_logging import configure_logging
from typing import Any, Literal
from pydantic import BaseModel, Field
from tools.analytics_engine.analytics_service import AnalyticsServiceError

# Make project-local modules resolvable when the server is launched directly.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from mcp.server.mcpserver import MCPServer

from tools.search import search_elasticsearch
from tools.analytics import (
    get_top_market_skills,
    get_top_skill_gaps,
)
from tools.analytics_tool import (
    build_analytics_request,
    run_analytics_query,
)
class AnalyticsMetricInput(BaseModel):
    function: Literal[
        "count_documents",
        "value_count",
        "sum",
        "avg",
        "min",
        "max",
        "cardinality",
    ]
    field: str | None = None
    alias: str | None = None


class AnalyticsFilterConditionInput(BaseModel):
    field: str
    operator: Literal[
        "eq",
        "neq",
        "in",
        "not_in",
        "gt",
        "gte",
        "lt",
        "lte",
        "between",
        "exists",
        "not_exists",
    ]
    value: Any = None


class AnalyticsQueryInput(BaseModel):
    dataset_id: str
    operation: Literal["select", "count", "aggregate"]

    group_by: list[str] | None = None

    metrics: list[AnalyticsMetricInput] | None = None

    filter_conditions: list[AnalyticsFilterConditionInput] | None = None
    filter_logic: Literal["and", "or"] = "and"

    sort: list[AnalyticsSortInput] | None = None

    limit: int = 10

    options: dict[str, Any] | None = None

class AnalyticsFilterGroupInput(BaseModel):
    logic: Literal["and", "or"] = "and"
    conditions: list[AnalyticsFilterConditionInput] = Field(
        default_factory=list
    )
    groups: list["AnalyticsFilterGroupInput"] = Field(
        default_factory=list
    )
    


class AnalyticsSortInput(BaseModel):
    field: str
    order: Literal["asc", "desc"] = "desc"
logger = logging.getLogger("nexusops.mcp")
MCP_MAX_CONCURRENT_SYNC_TOOLS = int(
    os.getenv("NEXUSOPS_MCP_MAX_CONCURRENT_SYNC_TOOLS", "8")
)
if MCP_MAX_CONCURRENT_SYNC_TOOLS < 1:
    raise ValueError("NEXUSOPS_MCP_MAX_CONCURRENT_SYNC_TOOLS must be positive.")
_SYNC_TOOL_SEMAPHORE = asyncio.Semaphore(MCP_MAX_CONCURRENT_SYNC_TOOLS)


async def run_sync_function(tool_name: str, function, *args):
    """Bound blocking data work and move it off the MCP event loop."""
    async with _SYNC_TOOL_SEMAPHORE:
        return await asyncio.to_thread(function, *args)


async def run_sync_tool(tool_name: str, function, *args) -> str:
    """Run a blocking data tool without blocking the MCP event loop."""
    request_id = uuid.uuid4().hex
    started_at = time.perf_counter()
    logger.info(
        "MCP tool started",
        extra={"request_id": request_id, "tool_name": tool_name},
    )
    try:
        result = await run_sync_function(tool_name, function, *args)
        logger.info(
            "MCP tool completed",
            extra={
                "request_id": request_id,
                "tool_name": tool_name,
                "duration_ms": round((time.perf_counter() - started_at) * 1000, 3),
            },
        )
        return result if isinstance(result, str) else json.dumps(
            result, ensure_ascii=False, indent=2
        )
    except Exception:
        logger.exception(
            "MCP tool failed",
            extra={
                "request_id": request_id,
                "tool_name": tool_name,
                "duration_ms": round((time.perf_counter() - started_at) * 1000, 3),
            },
        )
        return json.dumps({
            "status": "error",
            "error": {
                "code": "TOOL_EXECUTION_ERROR",
                "message": f"The {tool_name} operation could not be completed.",
                "request_id": request_id,
            },
        }, ensure_ascii=False)

server = MCPServer(
    name="NexusOps MCP Server",
    instructions="MCP Server for NexusOps University Analytics",
)

AnalyticsFilterGroupInput.model_rebuild()

@server.tool(
    name="get_market_skill_details",
    description=(
        "Analyze explicitly requested labor-market skills. "
        "Use this tool when the user asks about specific skills, "
        "such as comparing DevOps and Cloud Computing, "
        "or asks for the demand score and frequency of named skills. "
        "Return average demand_score, total frequency, and record count "
        "for each requested skill. "
        "Do not use get_top_market_skills for specific named-skill "
        "comparisons when this tool can answer the question directly."
    ),
)
async def market_skill_details_tool(skills: list[str]) -> str:
    return await run_sync_tool("get_market_skill_details", get_market_skill_details, skills)

@server.tool(
    name="get_top_market_skills",
    description=(
         "LABOR MARKET ANALYTICS TOOL. "
    "MANDATORY for questions involving market demand, "
    "average demand score, total frequency, demand ranking, "
    "or comparison of market demand between two or more skills. "
    "Use this tool to compare skills such as DevOps, "
    "Cloud Computing, Kubernetes, Docker, and SQL. "
    "Returns skill, average_demand_score, total_frequency, "
    "and record_count. "
    "Skills are ranked by average_demand_score descending. "
    "For market demand statistics, ALWAYS use this tool "
    "instead of search_elasticsearch. "
    "LIMITATION: Returns only the top N skills."
    ),
)
async def top_market_skills_tool(limit: int = 10) -> str:
    return await run_sync_tool("get_top_market_skills", get_top_market_skills, limit)


@server.tool(
    name="get_top_skill_gaps",
    description=(
        "UNIVERSITY-MARKET SKILL GAP ANALYTICS TOOL. "
    "MANDATORY for questions involving university coverage, "
    "market demand versus university coverage, market_gap, "
    "educational skill shortages, or curriculum improvement priorities. "
    "Use this tool to compare the educational gaps of skills "
    "such as DevOps, Cloud Computing, Kubernetes, and Docker. "
    "Returns ranked_skill, associated_course_id, "
    "associated_course_name, course_coverage, market_demand, "
    "and market_gap. "
    "Results represent SKILLS, not courses. "
    "For university-market gap statistics, ALWAYS use this tool "
    "instead of search_elasticsearch. "
    "LIMITATION: Returns only the top N skill-gap records."
    ),
)
async def top_skill_gaps_tool(limit: int = 10) -> str:
    return await run_sync_tool("get_top_skill_gaps", get_top_skill_gaps, limit)


@server.tool(
    name="search_elasticsearch",
    description=(
    "GENERAL DOCUMENT RETRIEVAL TOOL. "
    "Use ONLY for searching individual Elasticsearch documents, "
    "graduate records, graduate IDs, course IDs, course details, "
    "and general indexed records. "
    "DO NOT use this tool for market-demand rankings, "
    "average demand scores, total market frequency, "
    "university-market skill gaps, or analytical comparisons. "
    "For market statistics use get_top_market_skills. "
    "For university-market gap analysis use get_top_skill_gaps."
    ),
)
async def search_tool(query: str) -> str:
    return await run_sync_tool("search_elasticsearch", search_elasticsearch, query)




def build_internal_filters(
    filter_conditions: list[AnalyticsFilterConditionInput] | None = None,
    filter_logic: Literal["and", "or"] = "and",
    filters: AnalyticsFilterGroupInput | None = None,
) -> dict[str, Any] | None:
    """
    Normalize the MCP filter boundary into the recursive filter tree
    consumed by AnalyticsRequest. The legacy flat arguments remain
    supported for existing n8n clients.
    """
    if filters is not None and filter_conditions:
        raise ValueError(
            "Provide either 'filters' or 'filter_conditions', not both."
        )

    if filters is not None:
        normalized = filters.model_dump(exclude_none=True)
        if not normalized.get("conditions") and not normalized.get("groups"):
            raise ValueError("A nested filter group must not be empty.")
        return normalized

    if not filter_conditions:
        return None

    return {
        "logic": filter_logic,
        "conditions": [
            condition.model_dump(exclude_none=True)
            for condition in filter_conditions
        ],
    }

def build_analytics_error_response(
    *,
    dataset_id: str,
    operation: str,
    code: str,
    message: str,
    details: dict[str, Any] | None = None,
    request_id: str,
    execution_time_ms: float,
) -> dict[str, Any]:
    """Build the canonical analytics response envelope for every failure."""
    return {
        "status": "error",
        "dataset_id": dataset_id,
        "operation": operation,
        "result": None,
        "metadata": {
            "execution_time_ms": round(execution_time_ms, 3),
            "request_id": request_id,
        },
        "warnings": [],
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
        },
    }


@server.tool(
    name="analytics_query",
    description=(
    """
GENERIC ANALYTICS TOOL FOR UNIVERSITY AND LABOR MARKET DATA.

PRIMARY PURPOSE:
This is the PRIMARY analytical tool for answering user questions that
require structured analysis of registered datasets.

The tool supports three operations:

1. select
   Use when the user wants to find, show, list, or retrieve records
   that satisfy one or more conditions.

2. count
   Use when the user wants only the total number of records that
   satisfy one or more conditions.

3. aggregate
   Use when the user requests grouped analysis, calculated metrics,
   comparisons, rankings, or other aggregation-based results.

MANDATORY TOOL SELECTION:
When a user asks a question that can be answered by analyzing data
in a registered dataset, use analytics_query.

This includes questions involving:
- finding records
- filtering records
- counting records
- calculating totals
- calculating averages
- calculating minimum or maximum values
- comparing values
- grouping records
- ranking results
- sorting results
- selecting records according to conditions
- combining filters with calculations or grouping

Do not answer data questions from memory.
Do not fabricate records or analytical results.

OPERATION SELECTION:
SELECT retrieves matching records; COUNT returns only their number;
AGGREGATE computes grouped metrics and comparisons. Filtering alone
does not imply aggregation.

DATASET RESOLUTION:
Use only registered datasets and their registered fields:
- university_courses: course_id, course_name, course_category, credits, skills
- labor_market: market_record_id, job_title, job_field, skill, demand_score, frequency, experience_level, source_type
- university_graduates: graduate_id, major, graduation_year, study_level, job_title, job_field, employment_months, career_relevance, additional_training, additional_skills
- course_graduate_records: course_id, course_name, graduate_id, job_field, related_skills
- skill_mapping: skill, course_id, course_name, course_coverage, market_demand, market_gap

Each call operates on exactly one dataset. Registration does not create joins.

FILTERS:
Use flat filter_conditions for simple conditions and recursive filters for
nested Boolean expressions. Never send both interfaces at once.
Supported operators: eq, neq, in, not_in, gt, gte, lt, lte, between,
exists, not_exists. Use AND unless the user explicitly requests OR.

GROUPING AND METRICS:
Use group_by only when grouping is requested. Supported metrics:
count_documents, value_count, sum, avg, min, max, cardinality.
Use meaningful unique aliases. Multiple metrics belong in one request.

SORT AND LIMIT:
For aggregate sorting, use metric aliases. Preserve requested direction.
Use the user's explicit result limit; otherwise use the default.

ERROR SEMANTICS:
An execution error is not an empty result. Never report zero matches
unless execution completed successfully and returned an empty result.

LANGUAGE:
Understand natural-language requests in the user's language. Use
registered English field names in tool arguments and answer naturally.
"""
    )
)
async def analytics_query_tool(
    dataset_id: str,
    operation: Literal["select", "count", "aggregate"],
    group_by: list[str] | None = None,
    metrics: list[AnalyticsMetricInput] | None = None,
    filter_conditions: list[AnalyticsFilterConditionInput] | None = None,
    filter_logic: Literal["and", "or"] = "and",
    filters: AnalyticsFilterGroupInput | None = None,
    sort: list[AnalyticsSortInput] | None = None,
    limit: int = 10,
    options: dict[str, Any] | None = None,
) -> str:
    request_id = uuid.uuid4().hex
    started_at = time.perf_counter()

    try:
        normalized_filters = build_internal_filters(
            filter_conditions=filter_conditions,
            filter_logic=filter_logic,
            filters=filters,
        )

        arguments = {
            "dataset_id": dataset_id,
            "operation": operation,
            "group_by": group_by or [],
            "metrics": [
                metric.model_dump(exclude_none=True)
                for metric in (metrics or [])
            ],
            "filters": normalized_filters,
            "sort": [
                item.model_dump(exclude_none=True)
                for item in (sort or [])
            ],
            "limit": limit,
            "options": options or {},
        }

        logger.info(
            "Analytics request accepted",
            extra={
                "request_id": request_id,
                "dataset_id": dataset_id,
                "operation": operation,
            },
        )
        result = await run_sync_function("analytics_query", run_analytics_query, arguments)
        if isinstance(result, dict):
            metadata = result.setdefault("metadata", {})
            if isinstance(metadata, dict):
                metadata["request_id"] = request_id

        logger.info(
            "Analytics request completed",
            extra={
                "request_id": request_id,
                "dataset_id": dataset_id,
                "operation": operation,
                "duration_ms": round((time.perf_counter() - started_at) * 1000, 3),
            },
        )
        return json.dumps(result, ensure_ascii=False, indent=2)

    except AnalyticsServiceError as exc:
        logger.warning(
            "Analytics request rejected",
            extra={
                "request_id": request_id,
                "dataset_id": dataset_id,
                "operation": operation,
                "error_code": exc.code,
            },
        )
        error = build_analytics_error_response(
            dataset_id=dataset_id,
            operation=operation,
            code=exc.code,
            message=str(exc),
            details=exc.details,
            request_id=request_id,
            execution_time_ms=(time.perf_counter() - started_at) * 1000,
        )
        return json.dumps(error, ensure_ascii=False, indent=2)

    except ValueError as exc:
        logger.info(
            "Analytics request validation failed",
            extra={"request_id": request_id, "dataset_id": dataset_id},
        )
        error = build_analytics_error_response(
            dataset_id=dataset_id,
            operation=operation,
            code="INVALID_REQUEST",
            message=str(exc),
            request_id=request_id,
            execution_time_ms=(time.perf_counter() - started_at) * 1000,
        )
        return json.dumps(error, ensure_ascii=False, indent=2)

    except Exception:
        logger.exception(
            "Analytics request failed unexpectedly",
            extra={
                "request_id": request_id,
                "dataset_id": dataset_id,
                "operation": operation,
            },
        )
        error = build_analytics_error_response(
            dataset_id=dataset_id,
            operation=operation,
            code="INTERNAL_ERROR",
            message="The analytics operation could not be completed.",
            request_id=request_id,
            execution_time_ms=(time.perf_counter() - started_at) * 1000,
        )
        return json.dumps(error, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    configure_logging()
    server.run(
        transport="streamable-http",
        host="127.0.0.1",
        port=8000,
        streamable_http_path="/mcp",
    )