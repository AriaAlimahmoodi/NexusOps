from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
import re


# ============================================================
# Query Plan
# ============================================================

@dataclass
class QueryPlan:
    """
    Deterministic application-level query plan.

    The LLM may explain the answer, but it does not decide:
    - which MCP tool is authoritative
    - which structured entity is requested
    - which result count is required
    - which arguments are valid
    """

    tool_name: str | None = None
    arguments: dict[str, Any] = field(default_factory=dict)

    requested_entities: list[dict[str, str]] = field(
        default_factory=list
    )

    requested_fields: set[str] = field(
        default_factory=set
    )

    requested_count: int | None = None
    comparison_requested: bool = False

    memory_allowed: bool = True
    fresh_mcp_required: bool = False

    reason: str = ""


# ============================================================
# Normalization
# ============================================================

def normalize_digits(text: str) -> str:
    """
    Normalize Persian and Arabic digits to ASCII digits.
    """

    translation = str.maketrans(
        "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩",
        "01234567890123456789",
    )

    return text.translate(translation)


def normalize_text(text: str) -> str:
    return (
        normalize_digits(text)
        .casefold()
        .strip()
    )


# ============================================================
# Count extraction
# ============================================================

ENGLISH_NUMBER_WORDS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
    "thirteen": 13,
    "fourteen": 14,
    "fifteen": 15,
    "sixteen": 16,
    "seventeen": 17,
    "eighteen": 18,
    "nineteen": 19,
    "twenty": 20,
    "thirty": 30,
    "forty": 40,
    "fifty": 50,
    "sixty": 60,
    "seventy": 70,
    "eighty": 80,
    "ninety": 90,
    "one hundred": 100,
}


PERSIAN_NUMBER_WORDS = {
    "یک": 1,
    "دو": 2,
    "سه": 3,
    "چهار": 4,
    "پنج": 5,
    "شش": 6,
    "هفت": 7,
    "هشت": 8,
    "نه": 9,
    "ده": 10,
    "یازده": 11,
    "دوازده": 12,
    "سیزده": 13,
    "چهارده": 14,
    "پانزده": 15,
    "شانزده": 16,
    "هفده": 17,
    "هجده": 18,
    "نوزده": 19,
    "بیست": 20,
    "سی": 30,
    "چهل": 40,
    "پنجاه": 50,
    "شصت": 60,
    "هفتاد": 70,
    "هشتاد": 80,
    "نود": 90,
    "صد": 100,
}


COUNT_CONTEXT_TERMS = (
    "مهارت",
    "مهارتی",
    "مهارتها",
    "مهارت‌ها",
    "مهارت ها",
    "نتیجه",
    "نتایج",
    "مورد",
    "موارد",
    "شکاف",
    "رتبه",
    "رتبه‌بندی",
    "رتبه بندی",
    "لیست",
    "فهرست",
    "skill",
    "skills",
    "result",
    "results",
    "item",
    "items",
    "record",
    "records",
    "ranking",
    "rankings",
    "top",
)


def _has_count_context(
    query: str,
    position: int,
    window: int = 50,
) -> bool:
    """
    Check whether a numeric/word number appears in a count-related
    context near its position.

    This intentionally supports natural variations such as:
        20 skills
        20 مهارت
        20 مهارتی
        top 20
        بیست مهارت
        twenty skills
    """

    start = max(0, position - window)
    end = min(len(query), position + window)

    context = normalize_text(
        query[start:end]
    )

    return any(
        term in context
        for term in COUNT_CONTEXT_TERMS
    )


def extract_requested_count(
    query: str,
) -> int | None:
    """
    Extract the exact number requested by the user.

    This function is deliberately generic and does not depend on
    a particular question.

    Examples:
        Top 10 skills          -> 10
        Top 20 skills          -> 20
        30 skills               -> 30
        ۲۰ مهارت                -> 20
        ۲۰ مهارتی               -> 20
        بیست مهارت              -> 20
        twenty skills           -> 20
    """

    normalized_query = normalize_digits(query)

    # --------------------------------------------------------
    # 1. Explicit "top N"
    # --------------------------------------------------------

    top_pattern = re.compile(
        r"\btop\s+(\d+)\b",
        flags=re.IGNORECASE,
    )

    match = top_pattern.search(
        normalized_query
    )

    if match:
        return int(match.group(1))

    # --------------------------------------------------------
    # 2. Numeric count + natural-language context
    #
    # Important:
    # Do NOT require an exact word such as "مهارت".
    # This supports:
    #   20 مهارت
    #   20 مهارتی
    #   20 نتیجه
    #   20 مورد
    #   20 records
    #   20 skills
    # --------------------------------------------------------

    numeric_pattern = re.compile(
        r"(?<!\d)(\d{1,4})(?!\d)"
    )

    for match in numeric_pattern.finditer(
        normalized_query
    ):
        value = int(match.group(1))

        if _has_count_context(
            normalized_query,
            match.start(),
        ):
            return value

    # --------------------------------------------------------
    # 3. Persian number words
    # --------------------------------------------------------

    for word, value in sorted(
        PERSIAN_NUMBER_WORDS.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    ):
        pattern = re.compile(
            rf"(?<!\S){re.escape(word)}(?!\S)"
        )

        match = pattern.search(
            normalized_query
        )

        if not match:
            continue

        if _has_count_context(
            normalized_query,
            match.start(),
        ):
            return value

    # --------------------------------------------------------
    # 4. English number words
    # --------------------------------------------------------

    for word, value in sorted(
        ENGLISH_NUMBER_WORDS.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    ):
        pattern = re.compile(
            rf"\b{re.escape(word)}\b",
            flags=re.IGNORECASE,
        )

        match = pattern.search(
            normalized_query
        )

        if not match:
            continue

        if _has_count_context(
            normalized_query,
            match.start(),
        ):
            return value

    return None


# ============================================================
# Entity extraction
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


ENTITY_STOP_WORDS = {
    "WHAT",
    "WHICH",
    "WHO",
    "WHERE",
    "WHEN",
    "WHY",
    "HOW",
    "MUCH",
    "MANY",
    "SHOW",
    "GIVE",
    "TELL",
    "ME",
    "ABOUT",
    "FOR",
    "THE",
    "AND",
    "OR",
    "TO",
    "OF",
    "IS",
    "ARE",
    "DO",
    "DOES",
    "CAN",
    "COULD",
    "WOULD",
    "SHOULD",
    "COMPARE",
    "COMPARISON",
    "TOP",
    "MCP",
    "API",
    "ELK",
    "LLM",
    "NLP",
    "REST",
    "JSON",
    "HTTP",
}


def _clean_entity(value: str) -> str:
    return value.strip().strip(
        ".,!?;:()[]{}<>\"'«»"
    ).strip()


def _entity_dict(
    entity_type: str,
    value: str,
) -> dict[str, str]:
    return {
        "type": entity_type,
        "value": value,
    }


def extract_entities(
    query: str,
) -> list[dict[str, str]]:

    entities: list[dict[str, str]] = []

    # --------------------------------------------------------
    # 1. Structured IDs
    # --------------------------------------------------------

    for entity_type, pattern in ENTITY_PATTERNS.items():

        for match in pattern.finditer(query):

            value = match.group(0).upper()

            entities.append(
                _entity_dict(
                    entity_type,
                    value,
                )
            )

    # --------------------------------------------------------
    # 2. Quoted entities
    # --------------------------------------------------------

    quoted_patterns = [
        r'"([^"]+)"',
        r"'([^']+)'",
        r"«([^»]+)»",
    ]

    for pattern in quoted_patterns:

        for match in re.finditer(
            pattern,
            query,
        ):

            value = _clean_entity(
                match.group(1)
            )

            if value:
                entities.append(
                    _entity_dict(
                        "named_entity",
                        value,
                    )
                )

    # --------------------------------------------------------
    # 3. Capitalized technical/proper names
    # --------------------------------------------------------

    technical_patterns = [
        r"\b[A-Z][A-Za-z0-9]*(?:\s+[A-Z][A-Za-z0-9]*)+\b",
        r"\b[A-Z][A-Za-z0-9]{2,}\b",
    ]

    for pattern in technical_patterns:

        for match in re.finditer(
            pattern,
            query,
        ):

            value = _clean_entity(
                match.group(0)
            )

            if not value:
                continue

            if value.upper() in ENTITY_STOP_WORDS:
                continue

            if re.fullmatch(
                r"G\d{4,}",
                value,
                flags=re.IGNORECASE,
            ):
                continue

            if re.fullmatch(
                r"C\d{3,}",
                value,
                flags=re.IGNORECASE,
            ):
                continue

            entities.append(
                _entity_dict(
                    "named_entity",
                    value,
                )
            )

    # --------------------------------------------------------
    # 4. Comparison candidates
    # --------------------------------------------------------

    comparison_pattern = re.compile(
        r"""
        (?:
            compare\s+
            (?P<english_a>[^?!.]+?)
            \s+(?:and|vs\.?|versus)\s+
            (?P<english_b>[^?!.]+)
        )
        |
        (?:
            (?P<prefix_a>[A-Za-z][A-Za-z0-9_-]+)
            \s+(?:و|and|vs\.?|versus)\s+
            (?P<prefix_b>[A-Za-z][A-Za-z0-9_-]+)
            .*?(?:مقایسه|compare)
        )
        """,
        flags=re.IGNORECASE | re.VERBOSE,
    )

    for match in comparison_pattern.finditer(query):

        candidate_groups = [
            match.group("english_a"),
            match.group("english_b"),
            match.group("prefix_a"),
            match.group("prefix_b"),
        ]

        for candidate in candidate_groups:

            if not candidate:
                continue

            tokens = re.findall(
                r"[A-Za-z][A-Za-z0-9_-]*",
                candidate,
            )

            for token in tokens:

                cleaned = _clean_entity(token)

                if not cleaned:
                    continue

                if cleaned.upper() in ENTITY_STOP_WORDS:
                    continue

                if cleaned.casefold() in {
                    "and",
                    "or",
                    "vs",
                    "versus",
                }:
                    continue

                if any(
                    item["value"].casefold()
                    == cleaned.casefold()
                    for item in entities
                ):
                    continue

                entities.append(
                    _entity_dict(
                        "named_entity",
                        cleaned,
                    )
                )

    # --------------------------------------------------------
    # 5. Deduplicate
    # --------------------------------------------------------

    normalized: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()

    for entity in entities:

        entity_type = entity["type"]

        value = _clean_entity(
            entity["value"]
        )

        if not value:
            continue

        key = (
            entity_type,
            value.casefold(),
        )

        if key in seen:
            continue

        seen.add(key)

        normalized.append(
            {
                "type": entity_type,
                "value": value,
            }
        )

    return normalized


# ============================================================
# Field detection
# ============================================================

def requested_fields(
    query: str,
) -> set[str]:

    query_lower = normalize_text(query)

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
            "اسم درس",
            "چه درسی",
            "مربوط به چه درسی",
        ],
        "graduate_id": [
            "graduate_id",
            "graduate id",
            "شناسه فارغ التحصیل",
            "شناسه فارغ‌التحصیل",
            "کد فارغ التحصیل",
            "کد فارغ‌التحصیل",
        ],
        "job_title": [
            "job_title",
            "job title",
            "عنوان شغلی",
            "شغل",
            "current job",
            "job",
        ],
        "job_field": [
            "job_field",
            "job field",
            "حوزه شغلی",
            "field of work",
        ],
        "employment_months": [
            "employment_months",
            "employment months",
            "ماه اشتغال",
            "زمان اشتغال",
            "مدت فعالیت",
        ],
    }

    detected: set[str] = set()

    for field_name, field_aliases in aliases.items():

        if any(
            alias in query_lower
            for alias in field_aliases
        ):
            detected.add(field_name)

    return detected


# ============================================================
# Intent detection
# ============================================================

def is_comparison(
    query: str,
) -> bool:

    query_lower = normalize_text(query)

    terms = [
        "compare",
        "comparison",
        "vs",
        "versus",
        "مقایسه",
        "مقایسه کن",
        "مقایسه کنید",
        "در مقابل",
        "تفاوت",
    ]

    return any(
        term in query_lower
        for term in terms
    )


def looks_like_ranking(
    query: str,
) -> bool:

    query_lower = normalize_text(query)

    ranking_terms = [
        "top",
        "بیشترین",
        "بالاترین",
        "رتبه",
        "رتبه‌بندی",
        "رتبه بندی",
        "highest",
        "largest",
        "most demanded",
        "most in demand",
        "برترین",
        "highest ranked",
    ]

    return any(
        term in query_lower
        for term in ranking_terms
    )


def looks_like_skill_gap(
    query: str,
) -> bool:

    query_lower = normalize_text(query)

    gap_terms = [
        "market_gap",
        "market gap",
        "شکاف بازار",
        "شکاف",
        "skill gap",
        "skill gaps",
    ]

    skill_terms = [
        "skill",
        "skills",
        "مهارت",
        "مهارتی",
        "مهارت‌ها",
        "مهارت ها",
    ]

    return (
        any(
            term in query_lower
            for term in gap_terms
        )
        and any(
            term in query_lower
            for term in skill_terms
        )
    ) or (
        "بیشترین شکاف" in query_lower
        or "top skill gap" in query_lower
        or "top skill gaps" in query_lower
    )


def looks_like_market_skill_ranking(
    query: str,
) -> bool:

    query_lower = normalize_text(query)

    demand_terms = [
        "تقاضای بازار",
        "market demand",
        "market_demand",
        "most demanded",
        "most in demand",
    ]

    skill_terms = [
        "مهارت",
        "مهارتی",
        "مهارت‌ها",
        "مهارت ها",
        "skill",
        "skills",
    ]

    return (
        looks_like_ranking(query)
        and any(
            term in query_lower
            for term in demand_terms + skill_terms
        )
    )


# ============================================================
# Query planning
# ============================================================

def build_query_plan(
    query: str,
    conversation_context: str = "",
) -> QueryPlan:

    entities = extract_entities(query)

    fields = requested_fields(query)

    count = extract_requested_count(query)

    comparison = is_comparison(query)

    # --------------------------------------------------------
    # 1. Skill-gap ranking
    # --------------------------------------------------------

    if looks_like_skill_gap(query) and looks_like_ranking(query):

        limit = (
            count
            if count is not None
            else 10
        )

        return QueryPlan(
            tool_name="get_top_skill_gaps",

            arguments={
                "limit": limit,
            },

            requested_entities=[],

            requested_fields={
                "market_gap",
                "course_id",
                "course_name",
                "course_coverage",
                "market_demand",
            },

            requested_count=limit,

            comparison_requested=False,

            memory_allowed=True,

            fresh_mcp_required=False,

            reason=(
                "Detected market-gap ranking query."
            ),
        )

    # --------------------------------------------------------
    # 2. Market-demand skill ranking
    # --------------------------------------------------------

    if looks_like_market_skill_ranking(query):

        limit = (
            count
            if count is not None
            else 10
        )

        return QueryPlan(
            tool_name="get_top_market_skills",

            arguments={
                "limit": limit,
            },

            requested_entities=[],

            requested_fields={
                "market_demand",
            },

            requested_count=limit,

            comparison_requested=False,

            memory_allowed=True,

            fresh_mcp_required=False,

            reason=(
                "Detected market-skill ranking query."
            ),
        )

    # --------------------------------------------------------
    # 3. Explicit / named entity search
    # --------------------------------------------------------

    if entities:

        return QueryPlan(
            tool_name="search_elasticsearch",

            arguments={
                "query": query,
            },

            requested_entities=entities,

            requested_fields=fields,

            requested_count=count,

            comparison_requested=comparison,

            memory_allowed=True,

            fresh_mcp_required=False,

            reason=(
                "Detected explicit or named entity lookup."
            ),
        )

    # --------------------------------------------------------
    # 4. Comparison
    # --------------------------------------------------------

    if comparison:

        return QueryPlan(
            tool_name="search_elasticsearch",

            arguments={
                "query": query,
                "entities": entities,
            },

            requested_entities=entities,

            requested_fields=fields,

            requested_count=count,

            comparison_requested=True,

            memory_allowed=True,

            fresh_mcp_required=False,

            reason=(
                "Detected comparison query."
            ),
        )

    # --------------------------------------------------------
    # 5. Generic search
    # --------------------------------------------------------

    return QueryPlan(
        tool_name="search_elasticsearch",

        arguments={
            "query": query,
        },

        requested_entities=[],

        requested_fields=fields,

        requested_count=count,

        comparison_requested=comparison,

        memory_allowed=True,

        fresh_mcp_required=False,

        reason=(
            "Generic Elasticsearch search fallback."
        ),
    )


# ============================================================
# Tool argument validation
# ============================================================

def validate_tool_arguments(
    plan: QueryPlan,
    tool_name: str,
    arguments: dict[str, Any],
) -> tuple[bool, dict[str, Any], str]:

    # --------------------------------------------------------
    # Tool identity is deterministic.
    # --------------------------------------------------------

    if plan.tool_name is None:

        return (
            True,
            dict(arguments),
            "No deterministic tool constraint.",
        )

    if tool_name != plan.tool_name:

        return (
            False,
            dict(plan.arguments),
            (
                f"Planned tool is '{plan.tool_name}', "
                f"but model requested '{tool_name}'."
            ),
        )

    # --------------------------------------------------------
    # Start from planner-authoritative arguments.
    #
    # The model is NOT allowed to reduce or alter a
    # deterministic requested count.
    # --------------------------------------------------------

    normalized_arguments = dict(
        plan.arguments
    )

    # --------------------------------------------------------
    # requested_count is the single source of truth
    # for ranking cardinality.
    # --------------------------------------------------------

    if plan.requested_count is not None:

        normalized_arguments["limit"] = (
            plan.requested_count
        )

    # --------------------------------------------------------
    # Ensure ranking plans always have a valid limit.
    # --------------------------------------------------------

    if plan.tool_name in {
        "get_top_skill_gaps",
        "get_top_market_skills",
    }:

        if plan.requested_count is None:

            normalized_arguments["limit"] = 10

        else:

            normalized_arguments["limit"] = (
                plan.requested_count
            )

    return (
        True,
        normalized_arguments,
        "Tool and arguments are valid.",
    )


# ============================================================
# Result helpers
# ============================================================

def _flatten_result_items(
    data: Any,
) -> list[dict[str, Any]]:

    if not isinstance(data, dict):
        return []

    results = data.get("results")

    if not isinstance(results, list):
        return []

    return [
        item
        for item in results
        if isinstance(item, dict)
    ]


def _stringify(
    value: Any,
) -> str:

    if value is None:
        return ""

    if isinstance(value, list):

        return " ".join(
            _stringify(item)
            for item in value
        )

    if isinstance(value, dict):

        return " ".join(
            _stringify(item)
            for item in value.values()
        )

    return str(value)


def result_contains_entity(
    data: Any,
    entity: dict[str, str],
) -> bool:

    entity_type = entity.get(
        "type",
        "",
    )

    entity_value = entity.get(
        "value",
        "",
    )

    items = _flatten_result_items(
        data
    )

    for item in items:

        # ----------------------------------------------------
        # Exact structured field check
        # ----------------------------------------------------

        if entity_type in {
            "graduate_id",
            "course_id",
        }:

            direct_value = item.get(
                entity_type
            )

            if (
                direct_value is not None
                and str(direct_value).casefold()
                == entity_value.casefold()
            ):
                return True

        # ----------------------------------------------------
        # Nested Elasticsearch hit wrapper
        # ----------------------------------------------------

        nested_data = item.get(
            "data"
        )

        if isinstance(
            nested_data,
            dict,
        ):

            direct_value = nested_data.get(
                entity_type
            )

            if (
                direct_value is not None
                and str(direct_value).casefold()
                == entity_value.casefold()
            ):
                return True

        # ----------------------------------------------------
        # Generic textual fallback
        # ----------------------------------------------------

        searchable = _stringify(
            item
        ).casefold()

        if (
            entity_value.casefold()
            in searchable
        ):
            return True

    return False


# ============================================================
# MCP validation
# ============================================================

def validate_mcp_result(
    plan: QueryPlan,
    data: Any,
) -> tuple[bool, str]:

    if not isinstance(data, dict):

        return (
            False,
            "MCP returned a non-structured result.",
        )

    if data.get("error") is not None or data.get("status") == "error":
        return (False, f"MCP returned an error: {data.get('error', data)}")

    if plan.tool_name == "analytics_query":
        expected_dataset = plan.arguments.get("dataset_id")
        expected_operation = plan.arguments.get("operation")
        if data.get("status") != "success":
            return False, "Analytics response is not successful."
        if data.get("dataset_id") != expected_dataset or data.get("operation") != expected_operation:
            return False, "Analytics response does not match the planned dataset and operation."
        result, metadata = data.get("result"), data.get("metadata")
        if not isinstance(result, (dict, list)) or not isinstance(metadata, dict):
            return False, "Analytics response is missing result or metadata."
        if expected_operation == "count":
            count_value = result.get("count") if isinstance(result, dict) else None
            if isinstance(count_value, bool) or not isinstance(count_value, int) or count_value < 0:
                return False, "Analytics COUNT response contains an invalid count."
        elif expected_operation == "select":
            if not isinstance(result, list) or not all(isinstance(row, dict) for row in result):
                return False, "Analytics SELECT response must contain record objects."
            returned, total = metadata.get("returned_records"), metadata.get("total_records")
            if returned != len(result) or isinstance(total, bool) or not isinstance(total, int) or total < returned:
                return False, "Analytics SELECT metadata is inconsistent."
        elif expected_operation == "aggregate":
            buckets = result.get("buckets") if isinstance(result, dict) else None
            if not isinstance(buckets, list) or metadata.get("returned_records") != len(buckets):
                return False, "Analytics AGGREGATE response or metadata is malformed."
            if not all(isinstance(item, dict) and isinstance(item.get("group"), dict) and isinstance(item.get("metrics"), dict) for item in buckets):
                return False, "Analytics AGGREGATE contains malformed buckets."
        return True, "Analytics response matches the validated query plan."

    items = _flatten_result_items(
        data
    )

    # --------------------------------------------------------
    # No usable result
    # --------------------------------------------------------

    if not items:

        if plan.requested_entities:

            return (
                False,
                (
                    "MCP returned no matching evidence "
                    "for the requested entity or entities."
                ),
            )

        return (
            False,
            "MCP returned no usable result items.",
        )

    # --------------------------------------------------------
    # Entity validation
    # --------------------------------------------------------

    missing_entities = []

    for entity in plan.requested_entities:

        if not result_contains_entity(
            data,
            entity,
        ):

            missing_entities.append(
                entity.get(
                    "value",
                    "",
                )
            )

    if missing_entities:

        return (
            False,
            (
                "MCP result does not contain all "
                "requested entities: "
                + ", ".join(
                    missing_entities
                )
                + "."
            ),
        )

    # --------------------------------------------------------
    # Ranking cardinality
    #
    # CRITICAL CONTRACT:
    #
    # requested_count = N
    #
    # actual_count < N -> reject
    # actual_count >= N -> accept
    #
    # Do not use the LLM's requested limit here.
    # Do not use an arbitrary default.
    # --------------------------------------------------------

    if plan.requested_count is not None:

        actual_count = len(items)

        required_count = (
            plan.requested_count
        )

        if actual_count < required_count:

            return (
                False,
                (
                    f"Requested {required_count} results, "
                    f"but MCP returned only "
                    f"{actual_count}."
                ),
            )

    # --------------------------------------------------------
    # Comparison
    # --------------------------------------------------------

    if plan.comparison_requested:

        if len(
            plan.requested_entities
        ) >= 2:

            missing = [
                entity["value"]
                for entity
                in plan.requested_entities
                if not result_contains_entity(
                    data,
                    entity,
                )
            ]

            if missing:

                return (
                    False,
                    (
                        "Comparison evidence is incomplete. "
                        "Missing: "
                        + ", ".join(missing)
                        + "."
                    ),
                )

    return (
        True,
        "MCP result satisfies the query plan.",
    )
