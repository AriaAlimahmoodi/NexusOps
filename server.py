from __future__ import annotations

import asyncio
import json
import logging
import sys
import time
import uuid
from pathlib import Path
from typing import Any
from tools.market_skills import get_market_skill_details
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
    request_id = uuid.uuid4().hex
    try:
        result = await asyncio.to_thread(get_market_skill_details, skills)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception:
        logger.exception(
            "MCP tool failed",
            extra={"request_id": request_id, "tool_name": "get_market_skill_details"},
        )
        return json.dumps({
            "status": "error",
            "error": {
                "code": "TOOL_EXECUTION_ERROR",
                "message": "The requested market-skill analysis could not be completed.",
                "request_id": request_id,
            },
        }, ensure_ascii=False)

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
    request_id = uuid.uuid4().hex
    try:
        result = await asyncio.to_thread(get_top_market_skills, limit)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception:
        logger.exception(
            "MCP tool failed",
            extra={"request_id": request_id, "tool_name": "get_top_market_skills"},
        )
        return json.dumps({
            "status": "error",
            "error": {
                "code": "TOOL_EXECUTION_ERROR",
                "message": "The market-skill ranking could not be completed.",
                "request_id": request_id,
            },
        }, ensure_ascii=False)


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
    request_id = uuid.uuid4().hex
    try:
        result = await asyncio.to_thread(get_top_skill_gaps, limit)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception:
        logger.exception(
            "MCP tool failed",
            extra={"request_id": request_id, "tool_name": "get_top_skill_gaps"},
        )
        return json.dumps({
            "status": "error",
            "error": {
                "code": "TOOL_EXECUTION_ERROR",
                "message": "The skill-gap analysis could not be completed.",
                "request_id": request_id,
            },
        }, ensure_ascii=False)


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
    request_id = uuid.uuid4().hex
    try:
        return await asyncio.to_thread(search_elasticsearch, query)
    except Exception:
        logger.exception(
            "MCP tool failed",
            extra={"request_id": request_id, "tool_name": "search_elasticsearch"},
        )
        return json.dumps({
            "status": "error",
            "error": {
                "code": "TOOL_EXECUTION_ERROR",
                "message": "The Elasticsearch search could not be completed.",
                "request_id": request_id,
            },
        }, ensure_ascii=False)




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

SELECT:
Use operation="select" when the user wants the actual matching
records/documents.

Typical meanings include:
- find
- show
- list
- give me the records
- identify
- retrieve
- which records
- which courses
- which graduates
- records that satisfy a condition

If the user asks for records satisfying a condition, use SELECT,
not AGGREGATE.

COUNT:
Use operation="count" when the user asks only for the total number
of matching records and does not request the records themselves.

AGGREGATE:
Use operation="aggregate" when the user requests:
- grouping
- averages
- sums
- minimum or maximum values
- cardinality
- multiple calculated metrics
- grouped comparisons
- ranking based on calculated metrics
- analytical summaries

Do not use aggregate merely because a filter exists.
Filtering by itself does not imply aggregation.

QUESTION DECOMPOSITION:
Before constructing the tool request, interpret the user's natural-language
question as a structured request consisting of:

dataset_id
operation
group_by
metrics
filter_conditions
filter_logic
sort
limit
options

Infer these components from the meaning of the question.
Do not rely only on exact keyword matching.

DATASET RESOLUTION:

For university course catalog questions, use:
dataset_id="university_courses"
Fields: course_id, course_name, course_category, credits, skills.

For labor-market demand and job-skill questions, use:
dataset_id="labor_market"
Fields: market_record_id, job_title, job_field, skill, demand_score,
frequency, experience_level, source_type.

For graduate employment, career relevance, and graduate-profile questions, use:
dataset_id="university_graduates"
Fields: graduate_id, major, graduation_year, study_level, job_title,
job_field, employment_months, career_relevance, additional_training,
additional_skills.

For course-to-graduate relationship questions based on existing relationship
records, use:
dataset_id="course_graduate_records"
Fields: course_id, course_name, graduate_id, job_field, related_skills.

For university-market skill coverage and precomputed gap questions, use:
dataset_id="skill_mapping"
Fields: skill, course_id, course_name, course_coverage, market_demand,
market_gap.

IMPORTANT DATA BOUNDARY:
Each analytics_query call operates on exactly one registered dataset/index.
Registration does not create JOINs or cross-index relationships. Do not claim
that a query combines documents from multiple indexes. Use the denormalized
course_graduate_records or skill_mapping dataset only for the fields already
stored in those records.

Never invent a dataset_id.
Never invent a field name.

FILTER RULES:

Use filter_conditions for a flat set of conditions.

Use the recursive filters object when the user's question contains nested
boolean logic, such as:
A AND (B OR C)

The recursive structure has:
- logic: "and" or "or"
- conditions: a list of field/operator/value objects
- groups: a list of nested filter groups

Do not send both filters and filter_conditions in the same request.
Use filter_logic only with the legacy flat filter_conditions interface.

Supported operators:
- eq
- neq
- in
- not_in
- gt
- gte
- lt
- lte
- between
- exists
- not_exists

Translate natural-language comparisons into the appropriate operator.

Examples:

"more than 3 credits"
→ field="credits", operator="gt", value=3

"at least 3 credits"
→ field="credits", operator="gte", value=3

"less than 3 credits"
→ field="credits", operator="lt", value=3

"at most 3 credits"
→ field="credits", operator="lte", value=3

"exactly 3 credits"
→ field="credits", operator="eq", value=3

"not 3 credits"
→ field="credits", operator="neq", value=3

The filter must be represented using:

filter_conditions=[
    {
        "field": "...",
        "operator": "...",
        "value": ...
    }
]

Use filter_logic="and" when all conditions must be satisfied.

Use filter_logic="or" when the user explicitly requests
alternative conditions or either/or logic.

Do not create an empty filter_conditions list when no filter is required.

GROUPING RULES:

Use group_by only when the user explicitly requests grouped results.

Expressions such as:
- by category
- for each category
- per category
- according to category

indicate grouping.

Do not add group_by fields that the user did not request.

METRIC RULES:

Use metrics only when the user requests a calculated analytical value.

Supported metric functions:
- count_documents
- value_count
- sum
- avg
- min
- max
- cardinality

count_documents does not require a field.

sum, avg, min, and max require a field.

Every calculated metric should have a meaningful alias.

SORTING AND RANKING:

Use sort when the user requests:
- highest
- lowest
- most
- least
- ascending
- descending
- top
- bottom
- ranking
- ordered results

For SELECT, sort refers to a registered dataset field.

For AGGREGATE, when sorting by a calculated metric, use the
metric alias as the sort field.

Use:
order="desc"
for highest-to-lowest or most-to-least.

Use:
order="asc"
for lowest-to-highest or least-to-most.

LIMIT:

Use limit when the user explicitly requests a number of results,
such as:
- top 5
- first 10
- 20 results

Do not invent a limit when the user did not request one.
Use the tool default.

MULTI-CONDITION REQUESTS:

Flat filter conditions must be represented inside filter_conditions.
Nested AND/OR expressions must use the recursive filters structure.

Do not create multiple unnecessary analytics_query calls when
one structured request can represent the complete question.

MULTI-METRIC REQUESTS:

When one question requests multiple calculations, put all required
metrics into the metrics list and prefer one complete analytics_query
call.

FIELD SAFETY:

Only use fields registered in the selected dataset.

Natural-language expressions must be mapped to registered fields.

For example:
- number of units
- credits
- course units

refer to the registered "credits" field when the context is
university course data.

NO INVENTED DATA:

Never invent:
- datasets
- fields
- records
- statistics
- metric values
- analytical results

All results must come from analytics_query execution.

ERROR SEMANTICS:

A tool execution error is not an empty result.

If execution fails, report that the analytical operation failed.

Only report that no matching records were found when the tool
successfully returns an empty result.

LANGUAGE:

Understand the user's natural-language question in their language.

Tool arguments must use the structured English field names defined
by the dataset registry.

The final response should use the user's language naturally.

IMPORTANT:

Do not force SELECT, COUNT, or AGGREGATE based on a particular
example or exact phrase.

Choose the operation according to the semantic intent of the
user's request.
"""
)
)
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
        result = await asyncio.to_thread(run_analytics_query, arguments)
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
    server.run(
        transport="streamable-http",
        host="127.0.0.1",
        port=8000,
        streamable_http_path="/mcp",
    )