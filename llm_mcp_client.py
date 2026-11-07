import asyncio
import json
import re
import traceback
from typing import Any

from memory import MemoryManager
from openai import AsyncOpenAI
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

from query_planner import (
    QueryPlan,
    build_query_plan,
    validate_mcp_result,
    validate_tool_arguments,
)


MCP_URL = "http://127.0.0.1:8000/mcp"
OLLAMA_BASE_URL = "http://127.0.0.1:11434/v1"
MODEL_NAME = "qwen3:4b"

MAX_HISTORY_TURNS = 6
KEEP_RECENT_TURNS = 4


# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are NexusOps AI, an assistant for analyzing the NexusOps university
and labor-market dataset.

CORE RULES
1. Base dataset claims on MCP tool results or information already present
   in the conversation. Never invent data.
2. Preserve conversation context and resolve follow-up questions using
   earlier user requests, assistant answers, and verified MCP results.
3. Answer in the same language as the user's latest question.
4. The dataset is synthetic and must be described as synthetic when relevant.

CONTEXT AND COMPLETENESS
5. If the user refers to "these skills", "the previous results",
   "those courses", or similar expressions, identify the relevant earlier
   results before answering.
6. Reuse relevant prior MCP results only when they contain the required data.
7. Never silently reduce a requested list.
8. Keep related fields together when the evidence contains them.
9. For skill-gap analysis, the primary ranked entity is the SKILL.
10. Do not confuse course coverage, market demand, and market gap.
11. Do not fabricate missing course names, IDs, values, rankings, or records.
12. When data is insufficient, clearly explain what is missing.

DATA INTERPRETATION
13. Never convert course_coverage into a percentage, student count,
    or percentage of students unless explicitly defined by the dataset.
14. Never infer beginner, intermediate, or advanced teaching levels
    from course_coverage alone.
15. Never infer teaching depth from course_coverage alone.
16. If the meaning or unit of a numeric field is undocumented,
    preserve the raw value and state that its interpretation is unknown.
17. A high market_gap means only that the recorded gap is high according
    to the dataset's metric. It does not establish causation or course
    effectiveness.

MEMORY INTEGRITY
18. MCP/Elasticsearch data is source-of-truth dataset evidence.
19. Previous assistant statements are not automatically facts.
20. Memory summaries are contextual memory, not a replacement for
    fresh structured evidence.
21. Do not promote an unsupported historical claim into verified data.
22. Distinguish:
    - tool-verified data
    - user-provided information
    - verified calculations
    - previous assistant claims
    - unknown or unverified information

RESPONSE STYLE
23. Prefer clear structured answers.
24. Keep answers concise but complete.
25. Do not expose internal reasoning, tool calls, JSON, or debugging data.
26. Do not invent examples that look like NexusOps records.
27. When comparing records, use the actual values from verified evidence.
"""


# ============================================================
# MEMORY SUMMARY PROMPT
# ============================================================

SUMMARY_PROMPT = """
You maintain persistent conversational memory for an ongoing analytics
project involving Elasticsearch, MCP tools, and a language model.

Summarize completed conversation turns so future answers remain accurate.

Preserve:
- user goals and constraints
- important entity names and IDs
- course IDs and course names
- skill names
- rankings
- exact numerical values
- important calculations
- user corrections
- unresolved questions
- references such as "these skills" or "the previous list"

EVIDENCE STATUS

Distinguish:

A. TOOL-VERIFIED DATA
Values or records directly returned by MCP or Elasticsearch.

B. USER-PROVIDED INFORMATION
Information explicitly supplied by the user.

C. VERIFIED CALCULATIONS
Calculations reproducible from verified input values.

D. PREVIOUS ASSISTANT CLAIMS
Historical assistant statements that have not been independently verified.

E. UNKNOWN OR UNVERIFIED
Definitions, units, assumptions, or interpretations not established.

NUMERIC FIELDS

Never infer the semantic meaning or unit of a numeric field from its name.

Specifically:
- course_coverage remains undefined unless authoritative documentation
  establishes its meaning.
- Never call course_coverage a percentage unless explicitly documented.
- Never claim it represents student averages.
- Never claim it represents teaching depth.
- Never claim market_gap is a number of people, courses, or percentage points.
- Never infer causal explanations from market_gap.

SYNTHETIC DATA

Preserve the fact that the NexusOps dataset is synthetic.

CORRECTIONS

If an earlier assistant answer was wrong:
- preserve the correction
- do not promote the wrong answer into verified memory
- preserve the supported replacement

SUMMARY FORMAT

PROJECT CONTEXT:
Important project context.

VERIFIED DATA AND RESULTS:
Tool-verified records and exact values.

USER-PROVIDED FACTS:
Relevant user decisions and definitions.

UNVERIFIED CLAIMS AND LIMITATIONS:
Unknown definitions and unsupported historical claims.

CONVERSATION REFERENCES:
Important references needed for follow-up questions.

OPEN QUESTIONS AND NEXT STEPS:
Outstanding issues.

Return only the memory summary.
"""


# ============================================================
# GLOBAL STATE
# ============================================================

conversation_history = []
conversation_summary = ""

structured_memory_manager = MemoryManager()


# ============================================================
# MCP TOOL CONVERSION
# ============================================================

def convert_mcp_tools(mcp_tools):
    """
    Convert MCP tool definitions into OpenAI-compatible schemas.

    Kept for compatibility and diagnostics.
    The main execution path no longer asks the LLM to select tools.
    """

    converted = []

    for tool in mcp_tools:
        tool_data = tool.model_dump()

        converted.append(
            {
                "type": "function",
                "function": {
                    "name": tool_data["name"],
                    "description": tool_data.get("description") or "",
                    "parameters": (
                        tool_data.get("inputSchema")
                        or {
                            "type": "object",
                            "properties": {},
                        }
                    ),
                },
            }
        )

    return converted


# ============================================================
# MCP RESULT NORMALIZATION
# ============================================================

def normalize_structured_content(content):
    """
    Normalize MCP structured content into Python-native structures.
    """

    if isinstance(content, str):
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return content

    if isinstance(content, list):
        normalized_items = []

        for item in content:
            if isinstance(item, str):
                try:
                    normalized_items.append(
                        json.loads(item)
                    )
                except json.JSONDecodeError:
                    normalized_items.append(item)
            else:
                normalized_items.append(item)

        if len(normalized_items) == 1:
            return normalized_items[0]

        return normalized_items

    if isinstance(content, dict):
        return content

    return content


def extract_structured_tool_result(result):
    """
    Extract structured data from an MCP result.
    """

    structured_content = getattr(
        result,
        "structuredContent",
        None,
    )

    if structured_content is not None:
        return normalize_structured_content(
            structured_content
        )

    text_parts = []

    for item in getattr(result, "content", []) or []:
        item_text = getattr(item, "text", None)

        if item_text:
            text_parts.append(item_text)

    if text_parts:
        return normalize_structured_content(
            text_parts
        )

    return result.model_dump()


def extract_tool_result(result):
    """
    Convert an MCP result into text when needed by the LLM.
    """

    if getattr(
        result,
        "structuredContent",
        None,
    ) is not None:

        return json.dumps(
            result.structuredContent,
            ensure_ascii=False,
            default=str,
        )

    text_parts = []

    for item in getattr(
        result,
        "content",
        [],
    ) or []:

        item_text = getattr(
            item,
            "text",
            None,
        )

        if item_text:
            text_parts.append(item_text)

    if text_parts:
        return "\n".join(text_parts)

    return json.dumps(
        result.model_dump(),
        ensure_ascii=False,
        default=str,
    )


# ============================================================
# QUERY HELPERS
# ============================================================

def extract_query_entities(text: str) -> list[str]:
    """
    Return entity values only.
    Entity typing remains owned by query_planner.
    """

    from query_planner import extract_entities

    entities = extract_entities(text)

    return [
        entity["value"]
        for entity in entities
        if entity.get("value")
    ]


def _normalize_text(value: Any) -> str:
    if value is None:
        return ""

    if isinstance(
        value,
        (dict, list),
    ):
        value = json.dumps(
            value,
            ensure_ascii=False,
            default=str,
        )

    return str(value).casefold()


def _tokenize_query(text: str) -> set[str]:
    """
    Lexical token extraction only.
    No semantic inference.
    """

    tokens = re.findall(
        r"[A-Za-z0-9_]+|[\u0600-\u06FF]+",
        text.casefold(),
    )

    stop_words = {
        "the",
        "is",
        "are",
        "what",
        "which",
        "how",
        "much",
        "many",
        "show",
        "give",
        "tell",
        "me",
        "for",
        "of",
        "and",
        "to",

        "در",
        "از",
        "برای",
        "چیست",
        "چقدر",
        "چه",
        "کدام",
        "را",
        "به",
        "و",
        "که",
        "است",
        "هست",
        "دارند",
        "دارد",
        "نشان",
        "بده",
        "ده",
    }

    return {
        token
        for token in tokens
        if token not in stop_words
        and len(token) >= 2
    }


def _extract_requested_count(
    query: str,
) -> int | None:

    persian_digits = str.maketrans(
        "۰۱۲۳۴۵۶۷۸۹",
        "0123456789",
    )

    normalized_query = query.translate(
        persian_digits
    )

    patterns = [
        r"\btop\s+(\d+)\b",
        r"\b(\d+)\s+(?:skills?|مهارت)",
        r"\b(\d+)\s+(?:results?|نتیجه)",
        r"\b(\d+)\s+(?:items?|مورد)",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            normalized_query,
            flags=re.IGNORECASE,
        )

        if match:
            return int(
                match.group(1)
            )

    return None


def _query_requests_comparison(
    query: str,
) -> bool:

    query_lower = query.casefold()

    comparison_terms = [
        "compare",
        "comparison",
        "مقایسه",
        "مقایسه کن",
        "مقایسه کنید",
    ]

    return any(
        term in query_lower
        for term in comparison_terms
    )


def _requested_fields(
    query: str,
) -> set[str]:

    query_lower = query.casefold()

    aliases = {
        "market_gap": [
            "market_gap",
            "market gap",
            "شکاف بازار",
        ],
        "market_demand": [
            "market_demand",
            "market demand",
            "تقاضای بازار",
        ],
        "course_coverage": [
            "course_coverage",
            "course coverage",
            "پوشش درس",
        ],
        "course_id": [
            "course_id",
            "course id",
            "کد درس",
        ],
        "course_name": [
            "course_name",
            "course name",
            "نام درس",
            "چه درسی",
            "مربوط به چه درسی",
        ],
        "graduate_id": [
            "graduate_id",
            "graduate id",
            "فارغ التحصیل",
            "فارغ‌التحصیل",
        ],
        "job_title": [
            "job_title",
            "job title",
            "عنوان شغلی",
        ],
        "job_field": [
            "job_field",
            "job field",
            "حوزه شغلی",
        ],
        "employment_months": [
            "employment_months",
            "employment months",
            "ماه اشتغال",
            "زمان اشتغال",
        ],
    }

    detected = set()

    for field_name, field_aliases in aliases.items():

        if any(
            alias in query_lower
            for alias in field_aliases
        ):
            detected.add(field_name)

    return detected


# ============================================================
# STRUCTURED MEMORY RETRIEVAL
# ============================================================

def retrieve_structured_evidence(
    query: str,
) -> list[dict]:

    records = (
        structured_memory_manager
        .get_verified_tool_results()
    )

    if not records:
        return []

    query_tokens = _tokenize_query(
        query
    )

    entities = extract_query_entities(
        query
    )

    requested_fields = _requested_fields(
        query
    )

    evidence = []

    for record in records:

        record_data = record.data

        searchable_data = _normalize_text(
            record_data
        )

        source = record.source or {}
        metadata = record.metadata or {}

        tool_name = source.get(
            "tool",
            "",
        )

        record_type = record.record_type

        searchable_source = _normalize_text(
            f"{tool_name} {record_type}"
        )

        matched_entities = [
            entity
            for entity in entities
            if _normalize_text(entity)
            in searchable_data
        ]

        matched_fields = [
            field
            for field in requested_fields
            if field.casefold()
            in searchable_data
        ]

        data_tokens = _tokenize_query(
            searchable_data
        )

        source_tokens = _tokenize_query(
            searchable_source
        )

        token_overlap = (
            query_tokens.intersection(
                data_tokens
            )
        )

        source_overlap = (
            query_tokens.intersection(
                source_tokens
            )
        )

        score = 0

        score += (
            len(matched_entities)
            * 100
        )

        score += (
            len(matched_fields)
            * 30
        )

        score += (
            len(token_overlap)
            * 5
        )

        score += (
            len(source_overlap)
            * 10
        )

        if score == 0:
            continue

        evidence.append(
            {
                "memory_id": record.memory_id,
                "record_type": record.record_type,
                "evidence": record.evidence,
                "source": record.source,
                "created_at": record.created_at,
                "metadata": record.metadata,
                "matched_entities": matched_entities,
                "matched_fields": matched_fields,
                "relevance_score": score,
                "data": record.data,
            }
        )

    evidence.sort(
        key=lambda item: item[
            "relevance_score"
        ],
        reverse=True,
    )

    return evidence


# ============================================================
# EVIDENCE VALIDATION
# ============================================================

def build_evidence_context(
    evidence: list[dict],
) -> str:

    if not evidence:
        return ""

    lines = [
        "STRUCTURED EVIDENCE",
        "",
        "The following data was retrieved from verified structured memory.",
        "Treat these values as exact source data.",
        "Do not invent, replace, normalize, reinterpret, or alter them.",
        "",
    ]

    for index, item in enumerate(
        evidence,
        start=1,
    ):

        lines.append(
            f"Evidence Record {index}:"
        )

        lines.append(
            json.dumps(
                item,
                ensure_ascii=False,
                indent=2,
                default=str,
            )
        )

        lines.append("")

    lines.append(
        "END STRUCTURED EVIDENCE"
    )

    return "\n".join(lines)


def detect_evidence_conflicts(
    evidence: list[dict],
) -> list[dict]:
    """
    Detect conflicting values for identical MCP requests.
    Never selects a winner.
    """

    conflicts = []

    comparable_fields = (
        "market_demand",
        "course_coverage",
        "market_gap",
        "associated_course_id",
        "associated_course_name",
        "course_id",
        "course_name",
        "graduate_id",
        "job_title",
        "job_field",
        "employment_months",
    )

    for index, first in enumerate(
        evidence
    ):

        first_metadata = (
            first.get("metadata")
            or {}
        )

        first_signature = (
            first_metadata.get(
                "request_signature"
            )
        )

        if not first_signature:
            continue

        first_data = first.get(
            "data"
        )

        if not isinstance(
            first_data,
            dict,
        ):
            continue

        first_results = first_data.get(
            "results"
        )

        if not isinstance(
            first_results,
            list,
        ):
            continue

        for second in evidence[
            index + 1:
        ]:

            second_metadata = (
                second.get("metadata")
                or {}
            )

            second_signature = (
                second_metadata.get(
                    "request_signature"
                )
            )

            if (
                not second_signature
                or first_signature
                != second_signature
            ):
                continue

            second_data = second.get(
                "data"
            )

            if not isinstance(
                second_data,
                dict,
            ):
                continue

            second_results = second_data.get(
                "results"
            )

            if not isinstance(
                second_results,
                list,
            ):
                continue

            for first_item in first_results:

                if not isinstance(
                    first_item,
                    dict,
                ):
                    continue

                first_payload = (
                    first_item.get(
                        "data",
                        first_item,
                    )
                )

                if not isinstance(
                    first_payload,
                    dict,
                ):
                    continue

                for second_item in second_results:

                    if not isinstance(
                        second_item,
                        dict,
                    ):
                        continue

                    second_payload = (
                        second_item.get(
                            "data",
                            second_item,
                        )
                    )

                    if not isinstance(
                        second_payload,
                        dict,
                    ):
                        continue

                    first_entity = (
                        first_payload.get(
                            "ranked_skill"
                        )
                        or first_payload.get(
                            "skill"
                        )
                        or first_payload.get(
                            "graduate_id"
                        )
                        or first_payload.get(
                            "course_id"
                        )
                        or first_payload.get(
                            "course_name"
                        )
                    )

                    second_entity = (
                        second_payload.get(
                            "ranked_skill"
                        )
                        or second_payload.get(
                            "skill"
                        )
                        or second_payload.get(
                            "graduate_id"
                        )
                        or second_payload.get(
                            "course_id"
                        )
                        or second_payload.get(
                            "course_name"
                        )
                    )

                    if not first_entity or not second_entity:
                        continue

                    if (
                        str(first_entity).casefold()
                        != str(second_entity).casefold()
                    ):
                        continue

                    differing_fields = {}

                    for field_name in comparable_fields:

                        first_value = (
                            first_payload.get(
                                field_name
                            )
                        )

                        second_value = (
                            second_payload.get(
                                field_name
                            )
                        )

                        if (
                            first_value is not None
                            and second_value is not None
                            and first_value != second_value
                        ):

                            differing_fields[
                                field_name
                            ] = {
                                "value_1": first_value,
                                "value_2": second_value,
                            }

                    if differing_fields:

                        conflicts.append(
                            {
                                "entity": first_entity,
                                "request_signature": first_signature,
                                "differing_fields": differing_fields,
                                "memory_id_1": first.get(
                                    "memory_id"
                                ),
                                "memory_id_2": second.get(
                                    "memory_id"
                                ),
                            }
                        )

    return conflicts


def evidence_contains_answer(
    query: str,
    evidence: list[dict],
) -> bool:

    if not evidence:
        return False

    entities = extract_query_entities(
        query
    )

    requested_fields = _requested_fields(
        query
    )

    requested_count = (
        _extract_requested_count(
            query
        )
    )

    comparison_requested = (
        _query_requests_comparison(
            query
        )
    )

    if entities:

        for entity in entities:

            entity_found = False

            for item in evidence:

                matched_entities = item.get(
                    "matched_entities",
                    [],
                )

                if any(
                    entity.casefold()
                    == str(found).casefold()
                    for found in matched_entities
                ):

                    entity_found = True
                    break

            if not entity_found:
                return False

    if requested_fields:

        fields_available = set()

        for item in evidence:

            data = item.get(
                "data"
            )

            if not isinstance(
                data,
                dict,
            ):
                continue

            results = data.get(
                "results"
            )

            if not isinstance(
                results,
                list,
            ):
                continue

            for result in results:

                if isinstance(
                    result,
                    dict,
                ):

                    fields_available.update(
                        result.keys()
                    )

        if not requested_fields.issubset(
            fields_available
        ):
            return False

    if requested_count is not None:

        total_results = 0

        for item in evidence:

            data = item.get(
                "data"
            )

            if not isinstance(
                data,
                dict,
            ):
                continue

            results = data.get(
                "results"
            )

            if isinstance(
                results,
                list,
            ):

                total_results += len(
                    results
                )

        if total_results < requested_count:
            return False

    if comparison_requested:

        distinct_entities = set()

        for item in evidence:

            for entity in item.get(
                "matched_entities",
                [],
            ):

                distinct_entities.add(
                    entity.casefold()
                )

        if len(distinct_entities) < 2:
            return False

    return True


# ============================================================
# PLANNER CONTEXT
# ============================================================

def build_planner_context(
    plan: QueryPlan,
) -> str:

    return (
        "APPLICATION QUERY PLAN\n"
        "======================\n"
        f"Planned MCP tool: {plan.tool_name}\n"
        f"Planned arguments: "
        f"{json.dumps(plan.arguments, ensure_ascii=False)}\n"
        f"Requested entities: "
        f"{json.dumps(plan.requested_entities, ensure_ascii=False)}\n"
        f"Requested fields: "
        f"{json.dumps(sorted(plan.requested_fields), ensure_ascii=False)}\n"
        f"Requested count: {plan.requested_count}\n"
        f"Comparison requested: "
        f"{plan.comparison_requested}\n"
        f"Reason: {plan.reason}\n"
    )


# ============================================================
# ANSWER INTENT DETECTION
# ============================================================

def _is_most_relevant_course_question(
    question: str,
) -> bool:

    normalized = question.casefold()

    relevance_terms = [
        "بیشترین ارتباط",
        "بیشترین مرتبط",
        "مرتبط‌ترین درس",
        "مرتبط ترین درس",
        "بیشترین ارتباط را",
        "most relevant course",
        "highest relevance",
        "highest course relevance",
    ]

    return any(
        term in normalized
        for term in relevance_terms
    )


def _is_graduate_profile_question(
    question: str,
) -> bool:

    normalized = question.casefold()

    profile_terms = [
        "اطلاعات فارغ",
        "اطلاعات فارغ‌التحصیل",
        "اطلاعات فارغ التحصیل",
        "مشخصات فارغ",
        "graduate information",
        "graduate profile",
    ]

    return any(
        term in normalized
        for term in profile_terms
    )


# ============================================================
# DATA EXTRACTION FOR ANSWER LAYER
# ============================================================

def _extract_data_objects(
    evidence: list[dict],
) -> list[dict]:

    data_objects = []

    for evidence_item in evidence:

        data = evidence_item.get(
            "data"
        )

        if not isinstance(
            data,
            dict,
        ):
            continue

        data_objects.append(
            data
        )

    return data_objects


def _find_first_result_by_index(
    data_objects: list[dict],
    index_name: str,
) -> dict | None:

    for data in data_objects:

        results = data.get(
            "results"
        )

        if not isinstance(
            results,
            list,
        ):
            continue

        for item in results:

            if not isinstance(
                item,
                dict,
            ):
                continue

            if item.get(
                "index"
            ) == index_name:

                record = item.get(
                    "data"
                )

                if isinstance(
                    record,
                    dict,
                ):
                    return record

    return None


# ============================================================
# DETERMINISTIC ANSWER RENDERERS
# ============================================================

def render_skill_gap_answer(
    data: dict,
    language: str = "fa",
) -> str:

    results = data.get(
        "results",
        [],
    )

    if not results:

        if language == "fa":
            return (
                "هیچ داده‌ای برای شکاف مهارتی پیدا نشد."
            )

        return (
            "No skill-gap data was found."
        )

    if language == "fa":

        lines = [
            "مهارت‌های دارای بیشترین شکاف دانشگاه و بازار:",
            "",
        ]

        for index, item in enumerate(
            results,
            start=1,
        ):

            skill = item.get(
                "ranked_skill"
            )

            course_id = item.get(
                "associated_course_id"
            )

            course_name = item.get(
                "associated_course_name"
            )

            coverage = item.get(
                "course_coverage"
            )

            demand = item.get(
                "market_demand"
            )

            gap = item.get(
                "market_gap"
            )

            lines.append(
                f"{index}. {skill}"
            )

            lines.append(
                f"   درس مرتبط: {course_name} ({course_id})"
            )

            lines.append(
                f"   Course Coverage: {coverage}"
            )

            lines.append(
                f"   Market Demand: {demand}"
            )

            lines.append(
                f"   Market Gap: {gap}"
            )

            lines.append("")

        return "\n".join(
            lines
        ).strip()

    lines = [
        "Skills with the largest university-market gaps:",
        "",
    ]

    for index, item in enumerate(
        results,
        start=1,
    ):

        skill = item.get(
            "ranked_skill"
        )

        course_id = item.get(
            "associated_course_id"
        )

        course_name = item.get(
            "associated_course_name"
        )

        coverage = item.get(
            "course_coverage"
        )

        demand = item.get(
            "market_demand"
        )

        gap = item.get(
            "market_gap"
        )

        lines.append(
            f"{index}. {skill}"
        )

        lines.append(
            f"   Associated course: "
            f"{course_name} ({course_id})"
        )

        lines.append(
            f"   Course Coverage: {coverage}"
        )

        lines.append(
            f"   Market Demand: {demand}"
        )

        lines.append(
            f"   Market Gap: {gap}"
        )

        lines.append("")

    return "\n".join(
        lines
    ).strip()


def render_market_skill_answer(
    data: dict,
    language: str = "fa",
) -> str:

    results = data.get(
        "results",
        [],
    )

    if not results:

        if language == "fa":
            return (
                "هیچ داده‌ای برای مهارت‌های بازار پیدا نشد."
            )

        return (
            "No market skill data was found."
        )

    if language == "fa":

        lines = [
            "مهارت‌های برتر بازار:",
            "",
        ]

        for index, item in enumerate(
            results,
            start=1,
        ):

            skill = item.get(
                "ranked_skill",
                item.get("skill"),
            )

            demand = item.get(
                "market_demand",
                item.get("demand"),
            )

            lines.append(
                f"{index}. {skill} — "
                f"تقاضای بازار: {demand}"
            )

        return "\n".join(
            lines
        )

    lines = [
        "Top market skills:",
        "",
    ]

    for index, item in enumerate(
        results,
        start=1,
    ):

        skill = item.get(
            "ranked_skill",
            item.get("skill"),
        )

        demand = item.get(
            "market_demand",
            item.get("demand"),
        )

        lines.append(
            f"{index}. {skill} — "
            f"Market demand: {demand}"
        )

    return "\n".join(
        lines
    )


def render_graduate_answer(
    data: dict,
    language: str = "fa",
) -> str:

    graduate = None

    results = data.get(
        "results",
        [],
    )

    for item in results:

        if not isinstance(
            item,
            dict,
        ):
            continue

        if item.get(
            "index"
        ) != "university_graduates":
            continue

        candidate = item.get(
            "data"
        )

        if isinstance(
            candidate,
            dict,
        ):

            graduate = candidate
            break

    if graduate is None:

        if language == "fa":
            return (
                "اطلاعات این فارغ‌التحصیل "
                "در داده‌های معتبر پیدا نشد."
            )

        return (
            "Graduate information was not "
            "found in the verified data."
        )

    graduate_id = graduate.get(
        "graduate_id"
    )

    major = graduate.get(
        "major"
    )

    graduation_year = graduate.get(
        "graduation_year"
    )

    study_level = graduate.get(
        "study_level"
    )

    job_title = graduate.get(
        "job_title"
    )

    job_field = graduate.get(
        "job_field"
    )

    employment_months = graduate.get(
        "employment_months"
    )

    career_relevance = graduate.get(
        "career_relevance"
    )

    additional_training = graduate.get(
        "additional_training"
    )

    additional_skills = graduate.get(
        "additional_skills",
        [],
    )

    if language == "fa":

        if additional_training is True:
            training_text = "بله"
        elif additional_training is False:
            training_text = "خیر"
        else:
            training_text = str(
                additional_training
            )

        if isinstance(
            additional_skills,
            list,
        ):
            skills_text = ", ".join(
                str(skill)
                for skill in additional_skills
            )
        else:
            skills_text = str(
                additional_skills
            )

        return "\n".join(
            [
                f"اطلاعات فارغ‌التحصیلی {graduate_id}:",
                "",
                f"- رشته: {major}",
                f"- سال فارغ‌التحصیلی: {graduation_year}",
                f"- سطح تحصیل: {study_level}",
                f"- عنوان شغلی: {job_title}",
                f"- حوزه شغلی: {job_field}",
                f"- مدت اشتغال: {employment_months} ماه",
                f"- ارتباط شغلی: {career_relevance}",
                f"- آموزش اضافی: {training_text}",
                f"- مهارت‌های اضافی: {skills_text}",
            ]
        )

    if isinstance(
        additional_skills,
        list,
    ):
        skills_text = ", ".join(
            map(
                str,
                additional_skills,
            )
        )
    else:
        skills_text = str(
            additional_skills
        )

    return "\n".join(
        [
            f"Graduate information for {graduate_id}:",
            "",
            f"- Major: {major}",
            f"- Graduation Year: {graduation_year}",
            f"- Study Level: {study_level}",
            f"- Job Title: {job_title}",
            f"- Job Field: {job_field}",
            f"- Employment Duration: "
            f"{employment_months} months",
            f"- Career Relevance: "
            f"{career_relevance}",
            f"- Additional Training: "
            f"{additional_training}",
            f"- Additional Skills: "
            f"{skills_text}",
        ]
    )


def render_most_relevant_course(
    data: dict,
    language: str = "fa",
) -> str:

    records = []

    results = data.get(
        "results",
        [],
    )

    for item in results:

        if not isinstance(
            item,
            dict,
        ):
            continue

        if item.get(
            "index"
        ) != "course_graduate_records":
            continue

        record = item.get(
            "data",
            {},
        )

        if not isinstance(
            record,
            dict,
        ):
            continue

        relevance = record.get(
            "course_relevance"
        )

        if relevance is None:
            continue

        records.append(
            record
        )

    if not records:

        if language == "fa":
            return (
                "برای تعیین مرتبط‌ترین درس، "
                "داده کافی وجود ندارد."
            )

        return (
            "There is not enough verified data "
            "to determine the most relevant course."
        )

    max_relevance = max(
        record["course_relevance"]
        for record in records
    )

    best_records = [
        record
        for record in records
        if record.get(
            "course_relevance"
        ) == max_relevance
    ]

    if language == "fa":

        if len(best_records) == 1:

            record = best_records[0]

            return (
                f"مرتبط‌ترین درس «"
                f"{record.get('course_name')}"
                f"» با شناسه "
                f"{record.get('course_id')} است "
                f"(course_relevance = "
                f"{max_relevance})."
            )

        courses = "، ".join(
            (
                f"{record.get('course_name')} "
                f"({record.get('course_id')})"
            )
            for record in best_records
        )

        return (
            f"بیشترین مقدار ثبت‌شده برای "
            f"course_relevance برابر "
            f"{max_relevance} است و مربوط به "
            f"این درس‌هاست: {courses}."
        )

    if len(best_records) == 1:

        record = best_records[0]

        return (
            f"The most relevant course is "
            f"{record.get('course_name')} "
            f"({record.get('course_id')}) "
            f"with course_relevance = "
            f"{max_relevance}."
        )

    courses = ", ".join(
        (
            f"{record.get('course_name')} "
            f"({record.get('course_id')})"
        )
        for record in best_records
    )

    return (
        f"The highest recorded "
        f"course_relevance is "
        f"{max_relevance}, shared by: "
        f"{courses}."
    )


# ============================================================
# DETERMINISTIC ANSWER DISPATCHER
# ============================================================

def render_verified_answer(
    plan: QueryPlan,
    evidence: list[dict],
    question: str,
    language: str = "fa",
) -> str | None:
    """
    Deterministic Answer Layer.

    This function is the most important architectural barrier
    between verified data and the language model.

    If a question can be answered directly from structured data,
    the LLM is completely bypassed.
    """

    if not evidence:
        return None

    tool_name = getattr(
        plan,
        "tool_name",
        None,
    )

    data_objects = _extract_data_objects(
        evidence
    )

    if not data_objects:
        return None

    # ---------------------------------------------------------
    # 1. Top skill gaps
    # ---------------------------------------------------------

    if tool_name == "get_top_skill_gaps":

        for data in data_objects:

            results = data.get(
                "results"
            )

            if isinstance(
                results,
                list,
            ):

                return render_skill_gap_answer(
                    data,
                    language=language,
                )

    # ---------------------------------------------------------
    # 2. Top market skills
    # ---------------------------------------------------------

    if tool_name == "get_top_market_skills":

        for data in data_objects:

            results = data.get(
                "results"
            )

            if isinstance(
                results,
                list,
            ):

                return render_market_skill_answer(
                    data,
                    language=language,
                )

    # ---------------------------------------------------------
    # 3. Graduate-specific questions
    # ---------------------------------------------------------

    if tool_name == "search_elasticsearch":

        has_graduate_id = any(
            entity.get("type")
            == "graduate_id"
            for entity in getattr(
                plan,
                "requested_entities",
                [],
            )
        )

        if has_graduate_id:

            if _is_most_relevant_course_question(
                question
            ):

                for data in data_objects:

                    if any(
                        isinstance(item, dict)
                        and item.get("index")
                        == "course_graduate_records"
                        for item in data.get(
                            "results",
                            [],
                        )
                    ):

                        return (
                            render_most_relevant_course(
                                data,
                                language=language,
                            )
                        )

            if _is_graduate_profile_question(
                question
            ):

                for data in data_objects:

                    graduate = (
                        _find_first_result_by_index(
                            [data],
                            "university_graduates",
                        )
                    )

                    if graduate is not None:

                        return render_graduate_answer(
                            data,
                            language=language,
                        )

            # -------------------------------------------------
            # Generic graduate lookup
            # -------------------------------------------------

            # If the question asks for a graduate ID and
            # the data contains exactly one graduate record,
            # we can safely provide the profile.
            graduate_records = []

            for data in data_objects:

                results = data.get(
                    "results",
                    [],
                )

                if not isinstance(
                    results,
                    list,
                ):
                    continue

                for item in results:

                    if (
                        isinstance(item, dict)
                        and item.get("index")
                        == "university_graduates"
                    ):

                        graduate_records.append(
                            item
                        )

            if len(graduate_records) == 1:

                return render_graduate_answer(
                    data_objects[0],
                    language=language,
                )

    return None


# ============================================================
# FINAL GROUNDED LLM
# ============================================================

async def generate_grounded_answer(
    client,
    question: str,
    evidence: list[dict],
    conversation_context: str = "",
) -> str:
    """
    LLM fallback for questions that cannot be safely rendered
    deterministically.

    The model receives only verified evidence plus limited
    conversational context.
    """

    evidence_json = json.dumps(
        evidence,
        ensure_ascii=False,
        indent=2,
        default=str,
    )

    grounding_prompt = """
You are the final natural-language answer generator for NexusOps.

Use ONLY the VERIFIED STRUCTURED EVIDENCE below for dataset facts.

RULES:

1. Never invent a NexusOps value.
2. Never invent an ID, course, skill, ranking, score, or record.
3. Preserve exact numeric values.
4. Never change the meaning of fields.
5. Never assign undocumented units.
6. Never treat previous assistant statements as dataset evidence.
7. If evidence is insufficient, say so.
8. Do not silently substitute another record.
9. Do not fabricate missing information.
10. Answer in the same language as the user.
11. Keep the answer concise and structured.
12. Do not output internal reasoning.
13. Do not output JSON unless the user explicitly asks for it.

CONVERSATION CONTEXT:

The following context may help resolve references such as
"that graduate" or "the previous result".

It is NOT authoritative dataset evidence.

""" + (
        conversation_context.strip()
        if conversation_context
        else "(No additional conversation context.)"
    ) + """

VERIFIED STRUCTURED EVIDENCE:

""" + evidence_json + """

USER QUESTION:

""" + question

    response = await client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": grounding_prompt,
            }
        ],
        temperature=0.0,
    )

    answer = (
        response.choices[0]
        .message
        .content
    )

    if not answer or not answer.strip():

        return (
            "داده معتبر دریافت شد، اما امکان تولید "
            "پاسخ نهایی وجود نداشت."
        )

    return answer.strip()


# ============================================================
# FINAL EVIDENCE PACKAGE
# ============================================================

def build_final_answer_evidence(
    question: str,
    structured_evidence=None,
    current_turn_evidence=None,
):

    return {
        "question": question,
        "current_turn_verified_results": (
            current_turn_evidence or []
        ),
        "memory_verified_results": [
            record.to_dict()
            if hasattr(record, "to_dict")
            else record
            for record in (
                structured_evidence or []
            )
        ],
    }


# ============================================================
# CONVERSATION HISTORY
# ============================================================

def make_base_messages():

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        }
    ]

    if conversation_summary:

        messages.append(
            {
                "role": "system",
                "content": (
                    "Memory summary from older conversation turns. "
                    "Use it only to resolve conversational references. "
                    "Do not treat it as a replacement for verified "
                    "dataset evidence:\n"
                    + conversation_summary
                ),
            }
        )

    for turn in conversation_history:
        messages.extend(turn)

    return messages


async def summarize_old_turns(
    client,
    old_turns,
):

    global conversation_summary

    old_messages = []

    for turn in old_turns:
        old_messages.extend(
            turn
        )

    summary_input = [
        {
            "role": "system",
            "content": SUMMARY_PROMPT,
        }
    ]

    if conversation_summary:

        summary_input.append(
            {
                "role": "system",
                "content": (
                    "Existing memory summary. Treat it as "
                    "fallible memory, not authoritative evidence:\n"
                    + conversation_summary
                ),
            }
        )

    summary_input.extend(
        old_messages
    )

    try:

        response = (
            await client.chat.completions.create(
                model=MODEL_NAME,
                messages=summary_input,
                temperature=0.0,
            )
        )

        new_summary = (
            response.choices[0]
            .message
            .content
        )

        if not new_summary or not new_summary.strip():

            print(
                "[Memory] Empty summary; "
                "old turns will be preserved."
            )

            return False

        conversation_summary = (
            new_summary.strip()
        )

        print(
            "[Memory] Older conversation summarized."
        )

        return True

    except Exception as exc:

        print(
            "[Memory] Summarization failed; "
            "old turns will be preserved. "
            f"Details: {exc}"
        )

        return False


async def manage_history(
    client,
):

    global conversation_history

    if (
        len(conversation_history)
        <= MAX_HISTORY_TURNS
    ):
        return

    number_to_summarize = (
        len(conversation_history)
        - KEEP_RECENT_TURNS
    )

    old_turns = (
        conversation_history[
            :number_to_summarize
        ]
    )

    success = await summarize_old_turns(
        client,
        old_turns,
    )

    if not success:

        print(
            "[Memory] History was not trimmed "
            "because summarization failed."
        )

        return

    conversation_history = (
        conversation_history[
            number_to_summarize:
        ]
    )


# ============================================================
# LANGUAGE
# ============================================================

def detect_language(
    text: str,
) -> str:

    if re.search(
        r"[\u0600-\u06FF]",
        text,
    ):
        return "fa"

    return "en"


# ============================================================
# FALLBACK MESSAGE
# ============================================================

def unavailable_evidence_message(
    question: str,
) -> str:

    persian_markers = [
        "چیست",
        "چی",
        "کدام",
        "چقدر",
        "اطلاعات",
        "مقایسه",
        "مهارت",
        "فارغ",
        "درس",
        "شکاف",
        "بازار",
    ]

    question_lower = (
        question.casefold()
    )

    if any(
        marker in question_lower
        for marker in persian_markers
    ):

        return (
            "برای این پرسش، دادهٔ معتبر و "
            "قابل‌تأییدی از منبع Elasticsearch/MCP "
            "دریافت نشد؛ بنابراین نمی‌توانم بر اساس "
            "داده‌های فعلی نتیجه‌گیری قطعی ارائه کنم."
        )

    return (
        "No verified evidence was returned from "
        "the Elasticsearch/MCP source for this request. "
        "Therefore, I cannot make a definitive claim "
        "from the current dataset."
    )


# ============================================================
# DIRECT MCP EXECUTION
# ============================================================

async def execute_planned_mcp_query(
    session,
    plan: QueryPlan,
):
    """
    Execute exactly the tool and arguments selected by Query Planner.

    IMPORTANT:
    The LLM is NOT allowed to choose the MCP tool.

    Flow:

        Planner
            ↓
        validate_tool_arguments
            ↓
        MCP
            ↓
        validate_mcp_result
    """

    if not plan.tool_name:

        return (
            False,
            None,
            "No MCP tool was selected by the query planner.",
        )

    is_valid, arguments, validation_message = (
        validate_tool_arguments(
            plan=plan,
            tool_name=plan.tool_name,
            arguments=plan.arguments,
        )
    )

    if not is_valid:

        return (
            False,
            None,
            validation_message,
        )

    print(
        f"[MCP] Direct execution: "
        f"{plan.tool_name}"
    )

    print(
        "[MCP] Arguments: "
        + json.dumps(
            arguments,
            ensure_ascii=False,
        )
    )

    result = await session.call_tool(
        plan.tool_name,
        arguments=arguments,
    )

    if getattr(
        result,
        "isError",
        False,
    ):

        return (
            False,
            None,
            "MCP tool returned an error: "
            + extract_tool_result(result),
        )

    structured_output = (
        extract_structured_tool_result(
            result
        )
    )

    print(
        "\n[DEBUG] Raw structured MCP output:"
    )

    print(
        json.dumps(
            structured_output,
            ensure_ascii=False,
            indent=2,
            default=str,
        )
    )

    result_is_valid, result_validation_message = (
        validate_mcp_result(
            plan=plan,
            data=structured_output,
        )
    )

    if not result_is_valid:

        return (
            False,
            None,
            result_validation_message,
        )

    print(
        "[Validator] MCP result accepted: "
        + result_validation_message
    )

    return (
        True,
        structured_output,
        result_validation_message,
    )


# ============================================================
# MAIN QUERY PIPELINE
# ============================================================

async def ask_nexusops(
    question: str,
):

    global conversation_history

    client = AsyncOpenAI(
        base_url=OLLAMA_BASE_URL,
        api_key="ollama",
    )

    language = detect_language(
        question
    )

    try:

        # =====================================================
        # STEP 1 — QUERY PLANNER
        # =====================================================

        plan = build_query_plan(
            question,
            conversation_context=conversation_summary,
        )

        # Any deterministic MCP plan requires fresh source data.
        if plan.tool_name is not None:
            plan.fresh_mcp_required = True

        print("\n[Planner]")
        print(
            f"Tool: {plan.tool_name}"
        )
        print(
            f"Arguments: {plan.arguments}"
        )
        print(
            f"Entities: "
            f"{plan.requested_entities}"
        )
        print(
            f"Count: "
            f"{plan.requested_count}"
        )
        print(
            f"Reason: "
            f"{plan.reason}"
        )

        # =====================================================
        # STEP 2 — STRUCTURED MEMORY
        # =====================================================

        structured_evidence = (
            retrieve_structured_evidence(
                question
            )
        )

        evidence_conflicts = (
            detect_evidence_conflicts(
                structured_evidence
            )
        )

        memory_is_sufficient = (
            not evidence_conflicts
            and evidence_contains_answer(
                question,
                structured_evidence,
            )
        )

        # =====================================================
        # STEP 3 — FRESH MCP
        #
        # If Planner selected a tool, fresh MCP is mandatory.
        # =====================================================

        current_turn_evidence = []

        if plan.tool_name is not None:

            print(
                "[Pipeline] Structured query detected."
            )

            print(
                "[Pipeline] Fresh MCP verification "
                "is mandatory."
            )

            async with streamable_http_client(
                MCP_URL
            ) as (
                read_stream,
                write_stream,
            ):

                async with ClientSession(
                    read_stream,
                    write_stream,
                ) as session:

                    await session.initialize()

                    (
                        mcp_success,
                        structured_output,
                        mcp_message,
                    ) = await execute_planned_mcp_query(
                        session,
                        plan,
                    )

                    if not mcp_success:

                        print(
                            "[Validator] MCP result rejected: "
                            + str(mcp_message)
                        )

                        return unavailable_evidence_message(
                            question
                        )

                    # -----------------------------------------
                    # Store exact verified result
                    # -----------------------------------------

                    structured_memory_manager.store_tool_result(
                        tool_name=plan.tool_name,
                        arguments=plan.arguments,
                        data=structured_output,
                    )

                    current_turn_evidence.append(
                        {
                            "tool_name": plan.tool_name,
                            "arguments": plan.arguments,
                            "data": structured_output,
                            "evidence_status": "tool_verified",
                            "source": "MCP / Elasticsearch",
                        }
                    )

                    print(
                        "[Memory] Fresh MCP result stored "
                        "as tool_verified."
                    )

        # =====================================================
        # STEP 4 — DETERMINISTIC ANSWER LAYER
        # =====================================================

        if current_turn_evidence:

            print(
                "[Answer Layer] "
                "Attempting deterministic rendering."
            )

            deterministic_answer = (
                render_verified_answer(
                    plan=plan,
                    evidence=current_turn_evidence,
                    question=question,
                    language=language,
                )
            )

            if deterministic_answer:

                print(
                    "[Answer Layer] "
                    "Deterministic answer generated."
                )

                answer = (
                    deterministic_answer
                )

            else:

                print(
                    "[Answer Layer] "
                    "No deterministic renderer matched."
                )

                # -------------------------------------------------
                # Build evidence package.
                # -------------------------------------------------

                final_evidence = (
                    build_final_answer_evidence(
                        question=question,
                        structured_evidence=[],
                        current_turn_evidence=(
                            current_turn_evidence
                        ),
                    )
                )

                print(
                    "[Grounding] "
                    "Generating final answer from "
                    "fresh verified evidence."
                )

                answer = (
                    await generate_grounded_answer(
                        client=client,
                        question=question,
                        evidence=final_evidence,
                        conversation_context=(
                            conversation_summary
                        ),
                    )
                )

        # =====================================================
        # STEP 5 — MEMORY-ONLY FOLLOW-UP
        #
        # This path is used only when Planner did not select
        # an MCP tool.
        # =====================================================

        elif memory_is_sufficient:

            print(
                "[Pipeline] No fresh MCP plan."
            )

            print(
                "[Pipeline] Verified structured memory "
                "is sufficient."
            )

            # Try deterministic answer using memory.
            deterministic_plan = plan

            deterministic_answer = (
                render_verified_answer(
                    plan=deterministic_plan,
                    evidence=structured_evidence,
                    question=question,
                    language=language,
                )
            )

            if deterministic_answer:

                print(
                    "[Answer Layer] "
                    "Memory-based deterministic answer generated."
                )

                answer = (
                    deterministic_answer
                )

            else:

                final_evidence = (
                    build_final_answer_evidence(
                        question=question,
                        structured_evidence=(
                            structured_evidence
                        ),
                        current_turn_evidence=[],
                    )
                )

                print(
                    "[Grounding] "
                    "Generating answer from verified memory."
                )

                answer = (
                    await generate_grounded_answer(
                        client=client,
                        question=question,
                        evidence=final_evidence,
                        conversation_context=(
                            conversation_summary
                        ),
                    )
                )

        # =====================================================
        # STEP 6 — NO VERIFIED STRUCTURED EVIDENCE
        # =====================================================

        else:

            print(
                "[Pipeline] No deterministic MCP plan "
                "and no sufficient verified memory."
            )

            # -------------------------------------------------
            # For ordinary conversational questions, allow the
            # local LLM to answer without pretending it is a
            # dataset fact.
            # -------------------------------------------------

            base_messages = (
                make_base_messages()
            )

            base_messages.append(
                {
                    "role": "user",
                    "content": question,
                }
            )

            response = (
                await client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=base_messages,
                    temperature=0.0,
                )
            )

            answer = (
                response.choices[0]
                .message
                .content
            )

            if not answer or not answer.strip():

                answer = (
                    unavailable_evidence_message(
                        question
                    )
                )

        # =====================================================
        # STEP 7 — SAVE CONVERSATION TURN
        # =====================================================

        turn_messages = [
            {
                "role": "user",
                "content": question,
            },
            {
                "role": "assistant",
                "content": answer,
            },
        ]

        conversation_history.append(
            turn_messages
        )

        await manage_history(
            client
        )

        return answer

    except Exception as exc:

        print(
            "\n[Error] Could not complete the request."
        )

        print(
            f"Details: {exc}"
        )

        traceback.print_exc()

        return (
            "نتوانستم درخواست را کامل کنم. "
            "بررسی کنید که Ollama، MCP Server و "
            "Elasticsearch در حال اجرا باشند و سپس دوباره تلاش کنید."
        )

    finally:

        await client.close()


# ============================================================
# MEMORY RESET
# ============================================================

def reset_memory():

    global conversation_history
    global conversation_summary

    conversation_history = []
    conversation_summary = ""

    print(
        "[Memory] Conversation history cleared."
    )


# ============================================================
# CLI
# ============================================================

async def main():

    print(
        "NexusOps LLM + MCP client"
    )

    print(
        f"Model: {MODEL_NAME}"
    )

    print(
        f"MCP server: {MCP_URL}"
    )

    print(
        "Type /reset to clear conversation memory."
    )

    print(
        "Type /exit to quit.\n"
    )

    while True:

        try:

            question = input(
                "You: "
            ).strip()

        except (
            EOFError,
            KeyboardInterrupt,
        ):

            print(
                "\nExiting NexusOps."
            )

            break

        if not question:
            continue

        if question.lower() in {
            "/exit",
            "exit",
            "quit",
        }:

            print(
                "Exiting NexusOps."
            )

            break

        if question.lower() == "/reset":

            reset_memory()
            continue

        answer = await ask_nexusops(
            question
        )

        print(
            f"\nNexusOps: {answer}\n"
        )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    asyncio.run(main())