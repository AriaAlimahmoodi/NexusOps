import asyncio
import json
import logging
import os
import re
import threading
import time
import traceback
import uuid
from collections import OrderedDict
from dataclasses import dataclass, field
from typing import Any

import httpx

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
from llm_query_planner import (
    build_analytics_query_plan,
    build_deterministic_analytics_query_plan,
)


MCP_URL = os.getenv("NEXUSOPS_MCP_URL", "http://127.0.0.1:8000/mcp")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434/v1")
MODEL_NAME = os.getenv("OLLAMA_MODEL", "qwen3:4b")

MCP_REQUEST_TIMEOUT_SECONDS = float(
    os.getenv("NEXUSOPS_MCP_TIMEOUT_SECONDS", "45")
)
MCP_MAX_ATTEMPTS = int(os.getenv("NEXUSOPS_MCP_MAX_ATTEMPTS", "2"))
MCP_RETRY_BASE_DELAY_SECONDS = float(
    os.getenv("NEXUSOPS_MCP_RETRY_BASE_DELAY_SECONDS", "0.35")
)
OLLAMA_TIMEOUT_SECONDS = float(
    os.getenv("NEXUSOPS_OLLAMA_TIMEOUT_SECONDS", "60")
)
MAX_HISTORY_TURNS = 6
KEEP_RECENT_TURNS = 4
MAX_CONVERSATION_STATES = 128

if MCP_REQUEST_TIMEOUT_SECONDS <= 0 or OLLAMA_TIMEOUT_SECONDS <= 0:
    raise ValueError("Runtime request timeouts must be positive.")
if MCP_MAX_ATTEMPTS < 1:
    raise ValueError("NEXUSOPS_MCP_MAX_ATTEMPTS must be at least 1.")
if MCP_RETRY_BASE_DELAY_SECONDS < 0:
    raise ValueError("MCP retry delay cannot be negative.")

logger = logging.getLogger("nexusops.client")


@dataclass
class ConversationState:
    """Isolated mutable state for one logical conversation."""

    history: list[list[dict[str, str]]] = field(default_factory=list)
    summary: str = ""
    memory_manager: MemoryManager = field(default_factory=MemoryManager)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)


_CONVERSATION_STATES: OrderedDict[str, ConversationState] = OrderedDict()
_CONVERSATION_STATES_GUARD = threading.RLock()


def get_conversation_state(conversation_id: str = "default") -> ConversationState:
    """Return an isolated state object, creating it on first access."""
    if not isinstance(conversation_id, str) or not conversation_id.strip():
        raise ValueError("conversation_id must be a non-empty string.")
    key = conversation_id.strip()
    if len(key) > 128:
        raise ValueError("conversation_id must not exceed 128 characters.")

    with _CONVERSATION_STATES_GUARD:
        state = _CONVERSATION_STATES.get(key)
        if state is not None:
            _CONVERSATION_STATES.move_to_end(key)
            return state

        while len(_CONVERSATION_STATES) >= MAX_CONVERSATION_STATES:
            evicted = False
            for candidate_key, candidate in list(_CONVERSATION_STATES.items()):
                if candidate_key != "default" and not candidate.lock.locked():
                    del _CONVERSATION_STATES[candidate_key]
                    evicted = True
                    break
            if not evicted:
                break

        state = ConversationState()
        _CONVERSATION_STATES[key] = state
        return state


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

_DEFAULT_CONVERSATION_STATE = get_conversation_state("default")
# Compatibility aliases for existing CLI helpers and tests.
conversation_history = _DEFAULT_CONVERSATION_STATE.history
conversation_summary = ""
structured_memory_manager = _DEFAULT_CONVERSATION_STATE.memory_manager


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
    memory_manager: MemoryManager | None = None,
) -> list[dict]:
    manager = memory_manager or structured_memory_manager
    records = manager.get_verified_tool_results()

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
                "average_demand_score",
                item.get("market_demand", item.get("demand")),
            )
            frequency = item.get("total_frequency")
            record_count = item.get("record_count")

            detail_parts = [f"تقاضای بازار: {demand}"]
            if frequency is not None:
                detail_parts.append(f"فراوانی کل: {frequency}")
            if record_count is not None:
                detail_parts.append(f"تعداد رکوردها: {record_count}")

            lines.append(
                f"{index}. {skill} — " + " | ".join(detail_parts)
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
            "average_demand_score",
            item.get("market_demand", item.get("demand")),
        )
        frequency = item.get("total_frequency")
        record_count = item.get("record_count")

        detail_parts = [f"Market demand: {demand}"]
        if frequency is not None:
            detail_parts.append(f"Total frequency: {frequency}")
        if record_count is not None:
            detail_parts.append(f"Records: {record_count}")

        lines.append(
            f"{index}. {skill} — " + " | ".join(detail_parts)
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


def render_analytics_query_answer(data: dict, language: str = "fa") -> str | None:
    """Render generic analytics responses without changing source values."""
    if data.get("status") != "success":
        return None
    dataset_id = data.get("dataset_id", "unknown")
    operation = data.get("operation")
    result = data.get("result")
    metadata = data.get("metadata") or {}

    if operation == "count" and isinstance(result, dict):
        count_value = result.get("count")
        if language == "fa":
            return f"تعداد رکوردهای منطبق در {dataset_id}: {count_value}"
        return f"Matching records in {dataset_id}: {count_value}"

    if operation == "select" and isinstance(result, list):
        if not result:
            return "هیچ رکورد منطبقی پیدا نشد." if language == "fa" else "No matching records were found."
        lines = [
            f"رکوردهای بازیابی‌شده از {dataset_id}:" if language == "fa" else f"Records retrieved from {dataset_id}:",
            "",
        ]
        for index, record in enumerate(result, start=1):
            lines.append(f"{index}.")
            for field_name, value in record.items():
                lines.append(f"   {field_name}: {value}")
            lines.append("")
        total = metadata.get("total_records")
        if isinstance(total, int) and total > len(result):
            lines.append(f"نمایش {len(result)} رکورد از {total} رکورد منطبق." if language == "fa" else f"Showing {len(result)} of {total} matching records.")
        return "\n".join(lines).strip()

    if operation == "aggregate" and isinstance(result, dict):
        buckets = result.get("buckets")
        if not isinstance(buckets, list):
            return None
        if not buckets:
            return "نتیجه‌ای برای گروه‌بندی پیدا نشد." if language == "fa" else "No aggregation groups were found."
        lines = [
            f"نتایج تحلیل گروه‌بندی‌شده از {dataset_id}:" if language == "fa" else f"Grouped analytics results from {dataset_id}:",
            "",
        ]
        for index, bucket in enumerate(buckets, start=1):
            for field_name, value in bucket.get("group", {}).items():
                lines.append(f"{index}. {field_name}: {value}")
            for metric_name, value in bucket.get("metrics", {}).items():
                lines.append(f"   {metric_name}: {value}")
            if "document_count" in bucket:
                lines.append(f"   document_count: {bucket['document_count']}")
            lines.append("")
        return "\n".join(lines).strip()
    return None


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
    # 1. Generic analytics query
    # ---------------------------------------------------------

    if tool_name == "analytics_query":
        for data in data_objects:
            answer = render_analytics_query_answer(data, language=language)
            if answer is not None:
                return answer
        return None

    # ---------------------------------------------------------
    # 2. Top skill gaps
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

def make_base_messages(
    history: list[list[dict[str, str]]] | None = None,
    summary: str | None = None,
):
    active_history = conversation_history if history is None else history
    active_summary = conversation_summary if summary is None else summary

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if active_summary:
        messages.append({
            "role": "system",
            "content": (
                "Memory summary from older conversation turns. "
                "Use it only to resolve conversational references. "
                "Do not treat it as a replacement for verified "
                "dataset evidence:\n" + active_summary
            ),
        })

    for turn in active_history:
        messages.extend(turn)
    return messages


async def _generate_history_summary(
    client,
    old_turns: list[list[dict[str, str]]],
    existing_summary: str,
) -> str | None:
    old_messages = [
        message
        for turn in old_turns
        for message in turn
    ]
    summary_input = [{"role": "system", "content": SUMMARY_PROMPT}]
    if existing_summary:
        summary_input.append({
            "role": "system",
            "content": (
                "Existing memory summary. Treat it as fallible memory, "
                "not authoritative evidence:\n" + existing_summary
            ),
        })
    summary_input.extend(old_messages)

    try:
        response = await client.chat.completions.create(
            model=MODEL_NAME,
            messages=summary_input,
            temperature=0.0,
        )
        new_summary = response.choices[0].message.content
        if not new_summary or not new_summary.strip():
            logger.warning("Conversation summarization returned empty content")
            return None
        return new_summary.strip()
    except Exception:
        logger.exception("Conversation summarization failed")
        return None


async def summarize_old_turns(client, old_turns):
    """Backward-compatible wrapper for the default conversation."""
    global conversation_summary
    new_summary = await _generate_history_summary(
        client,
        old_turns,
        conversation_summary,
    )
    if new_summary is None:
        return False
    conversation_summary = new_summary
    return True


async def manage_history(
    client,
    history: list[list[dict[str, str]]] | None = None,
    summary: str | None = None,
):
    """
    Compact one conversation's history only after a successful summary.
    With no explicit state, preserve the legacy default-conversation API.
    """
    global conversation_history, conversation_summary

    use_legacy_state = history is None
    active_history = conversation_history if use_legacy_state else history
    active_summary = conversation_summary if summary is None else summary

    if len(active_history) <= MAX_HISTORY_TURNS:
        return active_summary

    number_to_summarize = len(active_history) - KEEP_RECENT_TURNS
    old_turns = active_history[:number_to_summarize]
    new_summary = await _generate_history_summary(
        client,
        old_turns,
        active_summary,
    )
    if new_summary is None:
        logger.warning("Conversation history retained because summarization failed")
        return active_summary

    del active_history[:number_to_summarize]
    if use_legacy_state:
        conversation_summary = new_summary
    return new_summary


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
    *,
    request_id: str | None = None,
):
    """Execute and validate exactly one planner-authorized MCP tool call."""
    request_id = request_id or uuid.uuid4().hex

    if not plan.tool_name:
        return False, None, "No MCP tool was selected by the query planner."

    is_valid, arguments, validation_message = validate_tool_arguments(
        plan=plan,
        tool_name=plan.tool_name,
        arguments=plan.arguments,
    )
    if not is_valid:
        logger.warning(
            "MCP tool arguments rejected",
            extra={"request_id": request_id, "tool_name": plan.tool_name},
        )
        return False, None, validation_message

    started_at = time.perf_counter()
    logger.info(
        "MCP tool call started",
        extra={"request_id": request_id, "tool_name": plan.tool_name},
    )
    result = await session.call_tool(plan.tool_name, arguments=arguments)

    if getattr(result, "isError", False):
        error_text = extract_tool_result(result)
        logger.warning(
            "MCP tool returned protocol error",
            extra={
                "request_id": request_id,
                "tool_name": plan.tool_name,
                "duration_ms": round((time.perf_counter() - started_at) * 1000, 3),
            },
        )
        return False, None, "MCP tool execution failed: " + str(error_text)[:1000]

    structured_output = extract_structured_tool_result(result)
    if isinstance(structured_output, dict) and structured_output.get("status") == "error":
        error = structured_output.get("error") or {}
        code = error.get("code", "MCP_TOOL_ERROR") if isinstance(error, dict) else "MCP_TOOL_ERROR"
        message = error.get("message", "The MCP tool reported an error.") if isinstance(error, dict) else "The MCP tool reported an error."
        logger.warning(
            "MCP tool returned application error",
            extra={
                "request_id": request_id,
                "tool_name": plan.tool_name,
                "error_code": code,
                "duration_ms": round((time.perf_counter() - started_at) * 1000, 3),
            },
        )
        return False, None, f"{code}: {message}"

    result_is_valid, result_validation_message = validate_mcp_result(
        plan=plan,
        data=structured_output,
    )
    if not result_is_valid:
        logger.error(
            "MCP result failed contract validation",
            extra={
                "request_id": request_id,
                "tool_name": plan.tool_name,
                "duration_ms": round((time.perf_counter() - started_at) * 1000, 3),
            },
        )
        return False, None, result_validation_message

    logger.info(
        "MCP tool call completed",
        extra={
            "request_id": request_id,
            "tool_name": plan.tool_name,
            "duration_ms": round((time.perf_counter() - started_at) * 1000, 3),
        },
    )
    return True, structured_output, result_validation_message


async def _run_mcp_attempt(
    plan: QueryPlan,
    *,
    request_id: str,
    attempt: int,
):
    async with asyncio.timeout(MCP_REQUEST_TIMEOUT_SECONDS):
        async with streamable_http_client(MCP_URL) as (
            read_stream,
            write_stream,
        ):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                logger.info(
                    "MCP session initialized",
                    extra={"request_id": request_id, "attempt": attempt},
                )
                return await execute_planned_mcp_query(
                    session,
                    plan,
                    request_id=request_id,
                )


async def execute_mcp_query_with_resilience(
    plan: QueryPlan,
    *,
    request_id: str,
):
    """
    Open a fresh Streamable HTTP session per attempt.

    Only transport failures and timeouts are retried. Planner, validation,
    and application-level tool errors are returned immediately.
    """
    retryable_errors = (
        httpx.TransportError,
        asyncio.TimeoutError,
        TimeoutError,
        ConnectionError,
        OSError,
    )

    for attempt in range(1, MCP_MAX_ATTEMPTS + 1):
        try:
            return await _run_mcp_attempt(
                plan,
                request_id=request_id,
                attempt=attempt,
            )
        except retryable_errors as exc:
            if attempt >= MCP_MAX_ATTEMPTS:
                logger.error(
                    "MCP request exhausted retry budget",
                    extra={
                        "request_id": request_id,
                        "attempt": attempt,
                        "error_type": type(exc).__name__,
                    },
                )
                return (
                    False,
                    None,
                    "MCP service did not respond within the configured "
                    "time limit or could not be reached.",
                )

            logger.warning(
                "Transient MCP transport failure; retrying",
                extra={
                    "request_id": request_id,
                    "attempt": attempt,
                    "error_type": type(exc).__name__,
                },
            )
            await asyncio.sleep(
                MCP_RETRY_BASE_DELAY_SECONDS * (2 ** (attempt - 1))
            )

    return False, None, "MCP request failed without a completed attempt."


# QUERY PLAN RESOLUTION
# ============================================================

def is_analytics_data_request(question: str) -> bool:
    """Identify explicit dataset-analysis requests that must not degrade to generic search."""
    query = question.casefold()
    analytic_markers = (
        "میانگین", "مجموع", "جمع", "تعداد", "چه تعداد", "چند نفر",
        "حداقل", "حداکثر", "بیشتر از", "کمتر از", "به تفکیک",
        "برای هر", "گروه بندی", "گروه‌بندی", "فیلتر",
        "average", "mean", "sum", "count", "how many", "at least",
        "greater than", "less than", "group by", "per ",
    )
    dataset_markers = (
        "درس", "دروس", "فارغ", "دانشگاه", "مهارت", "بازار",
        "course", "graduate", "university", "skill", "market",
    )
    return (
        any(marker in query for marker in analytic_markers)
        and any(marker in query for marker in dataset_markers)
    )


async def resolve_query_plan(
    client,
    question: str,
    conversation_context: str = "",
) -> QueryPlan:
    """Resolve plans using explicit authority and fallback order."""
    plan = build_query_plan(
        question,
        conversation_context=conversation_context,
    )
    if plan.tool_name in {"get_top_skill_gaps", "get_top_market_skills"}:
        # Keep the specialized fast path for ordinary rankings, but allow
        # an explicit multi-metric comparison to use the generic analytics
        # engine so no requested metric is silently discarded.
        comparative_plan = build_deterministic_analytics_query_plan(question)
        if (
            comparative_plan is not None
            and comparative_plan.tool_name == "analytics_query"
            and len(comparative_plan.arguments.get("metrics", [])) >= 2
        ):
            return comparative_plan
        return plan

    has_structured_id = any(
        entity.get("type") in {"graduate_id", "course_id"}
        for entity in plan.requested_entities
    )
    if has_structured_id:
        return plan

    if plan.tool_name == "search_elasticsearch":
        deterministic_plan = build_deterministic_analytics_query_plan(question)
        if deterministic_plan is not None:
            return deterministic_plan

        analytics_plan = await build_analytics_query_plan(
            client=client,
            question=question,
            conversation_context=conversation_context,
        )
        if analytics_plan is not None:
            return analytics_plan
    return plan


# MAIN QUERY PIPELINE
# ============================================================

async def _ask_nexusops_for_state(
    question: str,
    state: ConversationState,
    request_id: str,
):
    client = AsyncOpenAI(
        base_url=OLLAMA_BASE_URL,
        api_key="ollama",
        timeout=OLLAMA_TIMEOUT_SECONDS,
        max_retries=1,
    )

    language = detect_language(
        question
    )

    try:

        # =====================================================
        # STEP 1 — QUERY PLANNER
        # =====================================================

        plan = await resolve_query_plan(
            client=client,
            question=question,
            conversation_context=state.summary,
        )

        if (
            plan.tool_name == "search_elasticsearch"
            and is_analytics_data_request(question)
        ):
            return unavailable_evidence_message(question)

        # Any deterministic MCP plan requires fresh source data.
        if plan.tool_name is not None:
            plan.fresh_mcp_required = True

        print("\n[Planner]")
        print(
            f"Tool: {plan.tool_name}"
        )
        logger.debug(
            "Query plan resolved",
            extra={
                "request_id": request_id,
                "tool_name": plan.tool_name,
                "dataset_id": plan.arguments.get("dataset_id"),
                "operation": plan.arguments.get("operation"),
            },
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
                question,
                memory_manager=state.memory_manager,
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

            (
                mcp_success,
                structured_output,
                mcp_message,
            ) = await execute_mcp_query_with_resilience(
                plan,
                request_id=request_id,
            )

            if not mcp_success:
                logger.warning(
                    "Fresh MCP evidence unavailable",
                    extra={
                        "request_id": request_id,
                        "tool_name": plan.tool_name,
                        "failure": str(mcp_message)[:500],
                    },
                )
                return unavailable_evidence_message(question)

            state.memory_manager.store_tool_result(
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
                            state.summary
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
                make_base_messages(history=state.history, summary=state.summary)
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

        state.history.append(turn_messages)
        state.summary = await manage_history(
            client,
            history=state.history,
            summary=state.summary,
        )

        return answer

    except Exception:
        logger.exception(
            "NexusOps request failed",
            extra={"request_id": request_id},
        )

        return (
            "نتوانستم درخواست را کامل کنم. "
            "بررسی کنید که Ollama، MCP Server و "
            "Elasticsearch در حال اجرا باشند و سپس دوباره تلاش کنید."
        )

    finally:

        await client.close()


# ============================================================


async def ask_nexusops(
    question: str,
    conversation_id: str = "default",
):
    """
    Process one request in an isolated conversation.

    Requests sharing a conversation_id are serialized to preserve turn order;
    different conversation IDs can execute concurrently.
    """
    state = get_conversation_state(conversation_id)
    request_id = uuid.uuid4().hex

    async with state.lock:
        started_at = time.perf_counter()
        logger.info(
            "NexusOps request started",
            extra={
                "request_id": request_id,
                "conversation_id": conversation_id,
            },
        )
        answer = await _ask_nexusops_for_state(
            question,
            state,
            request_id,
        )
        logger.info(
            "NexusOps request finished",
            extra={
                "request_id": request_id,
                "conversation_id": conversation_id,
                "duration_ms": round((time.perf_counter() - started_at) * 1000, 3),
            },
        )
        if conversation_id == "default":
            global conversation_summary
            conversation_summary = state.summary
        return answer


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