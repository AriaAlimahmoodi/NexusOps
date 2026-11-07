import sys
from pathlib import Path
import json
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
    result = get_market_skill_details(skills)
    return json.dumps(result, ensure_ascii=False, indent=2)

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
    result = get_top_market_skills(limit)

    return json.dumps(
        result,
        ensure_ascii=False,
        indent=2,
    )


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
    result = get_top_skill_gaps(limit)

    return json.dumps(
        result,
        ensure_ascii=False,
        indent=2,
    )


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
    return search_elasticsearch(query)




def build_internal_filters(
    filter_conditions: list[AnalyticsFilterConditionInput] | None,
    filter_logic: Literal["and", "or"] = "and",
) -> dict[str, Any] | None:

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

For university course questions, use:
dataset_id="university_courses"

Registered university course fields:
- course_id
- course_name
- course_category
- credits
- skills

For labor-market questions, use:
dataset_id="labor_market"

Registered labor-market fields:
- market_record_id
- job_title
- job_field
- skill
- demand_score
- frequency
- experience_level
- source_type

Never invent a dataset_id.
Never invent a field name.

FILTER RULES:

Use filter_conditions whenever the user's question restricts
which records should be selected or analyzed.

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

Multiple filter conditions must be represented inside
filter_conditions.

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
async def analytics_query_tool(
    dataset_id: str,
    operation: Literal["select", "count", "aggregate"],
    group_by: list[str] | None = None,
    metrics: list[AnalyticsMetricInput] | None = None,
    filter_conditions: list[AnalyticsFilterConditionInput] | None = None,
    filter_logic: Literal["and", "or"] = "and",
    sort: list[AnalyticsSortInput] | None = None,
    limit: int = 10,
    options: dict[str, Any] | None = None,
) -> str:

    filters = build_internal_filters(
        filter_conditions=filter_conditions,
        filter_logic=filter_logic,
    )

    arguments = {
        "dataset_id": dataset_id,
        "operation": operation,
        "group_by": group_by or [],
        "metrics": [
            metric.model_dump(exclude_none=True)
            for metric in (metrics or [])
        ],
        "filters": filters,
        "sort": [
            item.model_dump(exclude_none=True)
            for item in (sort or [])
        ],
        "limit": limit,
        "options": options or {},
    }

    try:
        result = run_analytics_query(arguments)

        return json.dumps(
            result,
            ensure_ascii=False,
            indent=2,
        )

    except AnalyticsServiceError as exc:
        message = str(exc)

        if "Unknown dataset" in message:
            error_result = {
                "status": "error",
                "error": {
                    "code": "UNKNOWN_DATASET",
                    "message": message,
                },
            }

        elif "Field" in message and "is not registered" in message:
            error_result = {
                "status": "error",
                "error": {
                    "code": "INVALID_FIELD",
                    "message": message,
                    "dataset_id": dataset_id,
                },
            }

        else:
            error_result = {
                "status": "error",
                "error": {
                    "code": "ANALYTICS_SERVICE_ERROR",
                    "message": message,
                },
            }

        return json.dumps(
            error_result,
            ensure_ascii=False,
            indent=2,
        )


if __name__ == "__main__":
    server.run(
        transport="streamable-http",
        host="127.0.0.1",
        port=8000,
        streamable_http_path="/mcp",
    )