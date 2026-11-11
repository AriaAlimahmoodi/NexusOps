from __future__ import annotations
import json
import math
import os
import re
import unicodedata
from typing import Any
from query_planner import QueryPlan
from tools.analytics_engine.models import AnalyticsRequest
from tools.dataset_registry import get_dataset_profile, list_registered_datasets

ALLOWED_OPERATIONS = {"select", "count", "aggregate"}
ALLOWED_METRICS = {"count_documents", "value_count", "sum", "avg", "min", "max", "cardinality"}
ALLOWED_OPERATORS = {"eq", "neq", "in", "not_in", "gt", "gte", "lt", "lte", "between", "exists", "not_exists"}
MODEL_NAME = os.getenv("OLLAMA_MODEL", "qwen3:4b")
MAX_FILTER_DEPTH = 5
MAX_FILTER_CONDITIONS = 32
MAX_FILTER_GROUPS = 16
MAX_GROUP_BY_FIELDS = 3
MAX_METRICS = 12
MAX_SORT_FIELDS = 5

class AnalyticsPlanningError(ValueError):
    """Generated analytics plan violates the MCP contract."""

def _profile_catalog() -> list[dict[str, Any]]:
    catalog = []
    for item in list_registered_datasets():
        profile = get_dataset_profile(item["dataset_id"])
        catalog.append({
            "dataset_id": profile["dataset_id"],
            "description": profile["description"],
            "fields": {
                name: {
                    "type": definition.get("type"),
                    "roles": definition.get("roles", []),
                    "aggregations": definition.get("aggregations", []),
                }
                for name, definition in profile.get("fields", {}).items()
            },
            "analytical_semantics": profile.get("analytical_semantics", {}),
            "default_group_by": profile.get("default_group_by"),
            "default_metrics": profile.get("default_metrics", {}),
        })
    return catalog

def _extract_json_object(content: str) -> dict[str, Any]:
    if not isinstance(content, str) or not content.strip():
        raise AnalyticsPlanningError("The local model returned an empty plan.")
    text = content.strip()
    fence = chr(96) * 3
    if text.startswith(fence):
        text = re.sub(r"^" + re.escape(fence) + r"(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*" + re.escape(fence) + r"$", "", text)
    try:
        value = json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start < 0 or end <= start:
            raise AnalyticsPlanningError("The local model did not return a JSON object.") from None
        try:
            value = json.loads(text[start:end + 1])
        except json.JSONDecodeError as exc:
            raise AnalyticsPlanningError(f"The local model returned malformed JSON: {exc.msg}.") from None
    if not isinstance(value, dict):
        raise AnalyticsPlanningError("The generated plan must be a JSON object.")
    return value

def normalize_analytics_text(value: str) -> str:
    """Normalize Persian/Arabic text consistently before intent parsing."""
    if not isinstance(value, str):
        return ""
    digits = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
    text = unicodedata.normalize("NFKC", value).translate(digits)
    text = text.replace("ي", "ی").replace("ك", "ک")
    text = re.sub(r"[\u200c\u200d\u200e\u200f\u0640]", "", text)
    text = re.sub(r"[\u064b-\u065f\u0670]", "", text)
    return re.sub(r"\s+", " ", text).strip().casefold()


def _normalize_filter_tree(node: Any, *, depth: int = 0, budget: dict[str, int] | None = None) -> Any:
    if node is None:
        return None
    if budget is None:
        budget = {"conditions": 0, "groups": 0}
    if depth > MAX_FILTER_DEPTH:
        raise AnalyticsPlanningError(f"Filter nesting exceeds the maximum depth of {MAX_FILTER_DEPTH}.")
    if not isinstance(node, dict):
        raise AnalyticsPlanningError("filters must be an object.")
    budget["groups"] += 1
    if budget["groups"] > MAX_FILTER_GROUPS:
        raise AnalyticsPlanningError(f"Filter tree exceeds {MAX_FILTER_GROUPS} groups.")
    logic = node.get("logic", "and")
    if logic is None:
        logic = "and"
    conditions = node.get("conditions", [])
    groups = node.get("groups", [])
    if conditions is None:
        conditions = []
    if groups is None:
        groups = []
    if logic not in {"and", "or"}:
        raise AnalyticsPlanningError("Filter logic must be 'and' or 'or'.")
    if not isinstance(conditions, list) or not isinstance(groups, list):
        raise AnalyticsPlanningError("Filter conditions and groups must be lists.")
    if not conditions and not groups:
        raise AnalyticsPlanningError("A supplied filter group cannot be empty.")
    normalized_conditions = []
    for condition in conditions:
        budget["conditions"] += 1
        if budget["conditions"] > MAX_FILTER_CONDITIONS:
            raise AnalyticsPlanningError(f"Filter tree exceeds {MAX_FILTER_CONDITIONS} conditions.")
        if not isinstance(condition, dict):
            raise AnalyticsPlanningError("Every filter condition must be an object.")
        field_name, operator = condition.get("field"), condition.get("operator")
        if not isinstance(field_name, str) or not field_name.strip():
            raise AnalyticsPlanningError("Every filter condition requires a field.")
        if not isinstance(operator, str) or operator not in ALLOWED_OPERATORS:
            raise AnalyticsPlanningError(f"Unsupported filter operator: {operator!r}.")
        normalized = {"field": field_name.strip(), "operator": operator}
        if operator not in {"exists", "not_exists"}:
            if "value" not in condition or condition["value"] is None:
                raise AnalyticsPlanningError(f"Filter operator '{operator}' requires a value.")
            value = condition["value"]
            if operator in {"in", "not_in"}:
                if not isinstance(value, list) or not value or len(value) > 100:
                    raise AnalyticsPlanningError(f"Filter operator '{operator}' requires a list of 1..100 values.")
            elif operator == "between":
                if not isinstance(value, list) or len(value) != 2:
                    raise AnalyticsPlanningError("Filter operator 'between' requires exactly two values.")
            elif isinstance(value, (list, dict)):
                raise AnalyticsPlanningError(f"Filter operator '{operator}' requires a scalar value.")
            normalized["value"] = value
        elif condition.get("value") is not None:
            raise AnalyticsPlanningError(f"Filter operator '{operator}' does not accept a value.")
        normalized_conditions.append(normalized)
    normalized_groups = [
        _normalize_filter_tree(group, depth=depth + 1, budget=budget)
        for group in groups
    ]
    return {"logic": logic, "conditions": normalized_conditions, "groups": normalized_groups}


def _walk_filter_fields(node: dict[str, Any] | None):
    if node is None:
        return
    for condition in node.get("conditions", []):
        yield condition["field"]
    for group in node.get("groups", []):
        yield from _walk_filter_fields(group)


def _walk_filter_conditions(node: dict[str, Any] | None):
    if node is None:
        return
    yield from node.get("conditions", [])
    for group in node.get("groups", []):
        yield from _walk_filter_conditions(group)


def _validate_plan(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise AnalyticsPlanningError("The analytics plan must be an object.")
    allowed_keys = {"dataset_id", "operation", "group_by", "metrics", "filters", "sort", "limit", "options"}
    unknown_keys = sorted(set(payload) - allowed_keys)
    if unknown_keys:
        raise AnalyticsPlanningError("Unsupported plan field(s): " + ", ".join(unknown_keys))
    dataset_id, operation = payload.get("dataset_id"), payload.get("operation")
    if not isinstance(dataset_id, str) or not dataset_id.strip():
        raise AnalyticsPlanningError("The plan must identify a dataset_id.")
    if operation not in ALLOWED_OPERATIONS:
        raise AnalyticsPlanningError("Operation must be select, count, or aggregate.")
    try:
        profile = get_dataset_profile(dataset_id)
    except (ValueError, KeyError):
        raise AnalyticsPlanningError(f"Dataset '{dataset_id}' is not registered.") from None
    fields = profile.get("fields", {})
    group_by = payload.get("group_by", [])
    metrics = payload.get("metrics", [])
    sort = payload.get("sort", [])
    limit = payload.get("limit", 10)
    options = payload.get("options", {})

    # Optional JSON fields are occasionally emitted as null by local models.
    # Treat null as the documented empty/default value, without weakening
    # validation for strings, numbers, or other invalid types.
    if group_by is None:
        group_by = []
    if metrics is None:
        metrics = []
    if sort is None:
        sort = []
    if limit is None:
        limit = 10
    if options is None:
        options = {}

    if not isinstance(group_by, list) or not isinstance(metrics, list):
        raise AnalyticsPlanningError("group_by and metrics must be lists.")
    if not isinstance(sort, list):
        raise AnalyticsPlanningError("sort must be a list.")
    if any(not isinstance(item, str) for item in group_by):
        raise AnalyticsPlanningError("Every group_by field must be a string.")
    if len(group_by) > MAX_GROUP_BY_FIELDS:
        raise AnalyticsPlanningError(f"group_by supports at most {MAX_GROUP_BY_FIELDS} fields.")
    if len(metrics) > MAX_METRICS:
        raise AnalyticsPlanningError(f"metrics supports at most {MAX_METRICS} entries.")
    if len(sort) > MAX_SORT_FIELDS:
        raise AnalyticsPlanningError(f"sort supports at most {MAX_SORT_FIELDS} entries.")
    if len(set(group_by)) != len(group_by):
        raise AnalyticsPlanningError("group_by cannot contain duplicate fields.")
    if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 1000:
        raise AnalyticsPlanningError("limit must be an integer between 1 and 1000.")
    if not isinstance(options, dict):
        raise AnalyticsPlanningError("options must be an object.")
    filters = _normalize_filter_tree(payload.get("filters"))

    def require_role(field_name: Any, role: str) -> None:
        if not isinstance(field_name, str) or not field_name.strip():
            raise AnalyticsPlanningError(f"A valid field is required for role '{role}'.")
        definition = fields.get(field_name)
        if definition is None:
            raise AnalyticsPlanningError(f"Field '{field_name}' is not registered in '{dataset_id}'.")
        if role not in definition.get("roles", []):
            raise AnalyticsPlanningError(f"Field '{field_name}' cannot be used as '{role}' in '{dataset_id}'.")

    for field_name in _walk_filter_fields(filters):
        require_role(field_name, "filter")
    if operation == "select":
        if group_by or metrics:
            raise AnalyticsPlanningError("SELECT does not accept group_by or metrics.")
    elif operation == "count":
        if group_by or metrics or sort:
            raise AnalyticsPlanningError("COUNT does not accept group_by, metrics, or sort.")
    else:
        if not metrics:
            raise AnalyticsPlanningError("AGGREGATE requires at least one metric; group_by is optional for scalar aggregation.")
        for field_name in group_by:
            require_role(field_name, "group_by")

    normalized_metrics, aliases = [], set()
    for metric in metrics:
        if not isinstance(metric, dict):
            raise AnalyticsPlanningError("Each metric must be an object.")
        function, field_name, alias = metric.get("function"), metric.get("field"), metric.get("alias")
        if function not in ALLOWED_METRICS:
            raise AnalyticsPlanningError(f"Unsupported metric function: {function!r}.")
        if function == "count_documents":
            if field_name is not None:
                raise AnalyticsPlanningError("count_documents must not specify a field.")
        else:
            require_role(field_name, "metric")
            allowed = fields[field_name].get("aggregations", [])
            if allowed and function not in allowed and function not in {"value_count", "cardinality"}:
                raise AnalyticsPlanningError(f"Metric '{function}' is not declared for field '{field_name}'.")
        if alias is None:
            alias = "document_count" if function == "count_documents" else f"{function}_{field_name}"
        if not isinstance(alias, str) or not re.fullmatch(r"[a-z][a-z0-9_]{0,63}", alias) or alias in aliases:
            raise AnalyticsPlanningError("Metric aliases must be valid, non-empty, and unique.")
        aliases.add(alias)
        normalized = {"function": function}
        if field_name is not None:
            normalized["field"] = field_name
        if alias is not None:
            normalized["alias"] = alias
        normalized_metrics.append(normalized)

    normalized_sort = []
    for item in sort:
        if not isinstance(item, dict):
            raise AnalyticsPlanningError("Each sort item must be an object.")
        field_name, order = item.get("field"), item.get("order", "desc")
        if not isinstance(field_name, str) or not field_name.strip():
            raise AnalyticsPlanningError("Each sort item requires a valid field.")
        if order not in {"asc", "desc"}:
            raise AnalyticsPlanningError("Sort order must be 'asc' or 'desc'.")
        if operation == "select":
            require_role(field_name, "sort")
        elif operation == "aggregate" and field_name not in group_by and field_name not in aliases:
            raise AnalyticsPlanningError("Aggregate sort must target a group_by field or metric alias.")
        normalized_sort.append({"field": field_name, "order": order})

    model_filters = None
    if filters is not None:
        def to_model_group(group):
            return {
                "logic": group["logic"],
                "conditions": [*group["conditions"], *[to_model_group(child) for child in group["groups"]]],
            }
        model_filters = to_model_group(filters)
    for condition in _walk_filter_conditions(filters):
        definition = fields[condition["field"]]
        if condition["operator"] in {"exists", "not_exists"}:
            continue
        value = condition.get("value")
        values = value if condition["operator"] in {"in", "not_in", "between"} else [value]
        field_type = definition.get("type")
        for item in values:
            if field_type in {"integer", "long", "short", "byte", "unsigned_long", "float", "double", "half_float", "scaled_float"}:
                if isinstance(item, bool) or not isinstance(item, (int, float)) or not math.isfinite(item):
                    raise AnalyticsPlanningError(f"Filter value for numeric field '{condition['field']}' must be finite numeric.")
                if field_type in {"integer", "long", "short", "byte", "unsigned_long"} and not float(item).is_integer():
                    raise AnalyticsPlanningError(f"Filter value for integer field '{condition['field']}' must be an integer.")
            elif field_type == "boolean":
                if not isinstance(item, bool):
                    raise AnalyticsPlanningError(f"Filter value for boolean field '{condition['field']}' must be boolean.")
            elif field_type in {"keyword", "text", "constant_keyword", "wildcard"}:
                if not isinstance(item, str) or not item.strip():
                    raise AnalyticsPlanningError(f"Filter value for keyword field '{condition['field']}' must be non-empty text.")
        if condition["operator"] == "between" and values[0] > values[1]:
            raise AnalyticsPlanningError(f"Filter range for '{condition['field']}' has its lower bound above its upper bound.")

    try:
        AnalyticsRequest.from_dict({
            "dataset_id": dataset_id, "operation": operation,
            "group_by": group_by, "metrics": normalized_metrics,
            "filters": model_filters, "sort": normalized_sort,
            "limit": limit, "options": options,
        })
    except Exception as exc:
        raise AnalyticsPlanningError(f"Plan violates AnalyticsRequest: {exc}") from None
    result = {
        "dataset_id": dataset_id, "operation": operation,
        "group_by": group_by, "metrics": normalized_metrics,
        "sort": normalized_sort, "limit": limit, "options": options,
    }
    result["filters"] = filters
    return result

def _planner_prompt(question: str, conversation_context: str) -> str:
    catalog = json.dumps(_profile_catalog(), ensure_ascii=False, indent=2)
    context = conversation_context.strip() or "(No prior context.)"
    return f"""You are the query-planning component for NexusOps. Convert the latest request into ONE valid analytics_query MCP request. Do not answer the user.

REGISTERED DATASETS AND FIELD CONTRACTS:
{catalog}

Return exactly one JSON object, no prose or Markdown. Required keys:
dataset_id, operation, group_by, metrics, filters, sort, limit, options.
IMPORTANT JSON SHAPE RULES:
- group_by, metrics, and sort MUST always be JSON arrays. Use [] when empty; NEVER use null.
- options MUST always be a JSON object. Use {{}} when empty; NEVER use null.
- filters MUST be null when no filtering is needed, otherwise a non-empty filter-group object.
- Never omit a required key and never replace an array/object with a scalar.
Use only registered dataset IDs and fields above.
Allowed operations: select, count, aggregate.
Allowed metrics: count_documents, value_count, sum, avg, min, max, cardinality.
Allowed filters: eq, neq, in, not_in, gt, gte, lt, lte, between, exists, not_exists.
Filter shape: {{"logic":"and|or","conditions":[{{"field":"...","operator":"...","value":...}}],"groups":[{{...nested group...}}]}}.
Use filters=null when no filtering is needed.
COUNT requires empty group_by, metrics, and sort. SELECT requires empty group_by and metrics. AGGREGATE requires at least one metric; group_by is optional for scalar aggregation.
Aggregate metrics require unique meaningful aliases. Aggregate sort targets a group_by field or metric alias. Select sorting uses a registered field with the sort role.
Use count only when the user wants only a total. Use select to retrieve records. Use aggregate for averages, sums, grouped comparisons, rankings, and calculated summaries.
Do not invent filters, values, units, joins, or relationships. One call queries exactly one dataset.
Use limit=1000 only if all records are explicitly requested; otherwise use 10 unless the user specifies a number.
If the request cannot be grounded in the catalog, return {{"error":"insufficient_information","reason":"..."}}

CONVERSATION CONTEXT (reference resolution only, not evidence):
{context}

LATEST USER REQUEST:
{question}
"""

def build_deterministic_analytics_query_plan(question: str) -> QueryPlan | None:
    """Build conservative, profile-validated plans for common unambiguous intents."""
    if not isinstance(question, str) or not question.strip():
        return None
    digits = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
    query = normalize_analytics_text(question)

    def has_any(*terms: str) -> bool:
        return any(normalize_analytics_text(term) in query for term in terms)

    def make_plan(payload: dict[str, Any], reason: str) -> QueryPlan | None:
        try:
            arguments = _validate_plan(payload)
        except (AnalyticsPlanningError, TypeError, ValueError):
            return None
        requested = set(arguments.get("group_by", []))
        requested.update(metric["field"] for metric in arguments.get("metrics", []) if metric.get("field"))
        requested.update(_walk_filter_fields(arguments.get("filters")))
        return QueryPlan(
            tool_name="analytics_query", arguments=arguments,
            requested_entities=[], requested_fields=requested,
            requested_count=arguments.get("limit"), comparison_requested=False,
            memory_allowed=True, fresh_mcp_required=True, reason=reason,
        )

    graduate_terms = ("فارغ التحصیل", "فارغ‌التحصیل", "فارغالتحصیل", "graduate")
    if (has_any("برای هر رشته", "به تفکیک رشته", "بر اساس رشته",
                 "گروه بندی بر اساس رشته", "group by major", "by major", "per major")
            and has_any("میانگین", "average", "avg", "mean")):
        metrics = []
        if has_any("ارتباط شغلی", "ارتباط با شغل", "career relevance"):
            metrics.append({"function": "avg", "field": "career_relevance", "alias": "average_career_relevance"})
        if has_any("مدت اشتغال", "مدت استخدام", "ماه اشتغال", "employment duration", "employment months"):
            metrics.append({"function": "avg", "field": "employment_months", "alias": "average_employment_months"})
        if has_any("تعداد فارغ التحصیلان", "تعداد فارغ‌التحصیلان", "graduate count", "number of graduates", "count of graduates"):
            metrics.insert(0, {"function": "count_documents", "alias": "graduate_count"})
        if metrics:
            return make_plan({
                "dataset_id": "university_graduates", "operation": "aggregate",
                "group_by": ["major"], "metrics": metrics, "filters": None,
                "sort": [], "limit": 100, "options": {},
            }, "Deterministic fallback: grouped graduate counts and averages by major.")

    if has_any(*graduate_terms) and has_any(
        "تعداد", "چند نفر", "چندتا", "چه تعداد", "count", "how many", "number of"
    ) and not has_any("میانگین", "متوسط", "average", "avg", "mean", "مجموع", "جمع", "sum"):
        filters = None
        year_match = re.search(r"(?:در\s*)?سال\s*(?:فارغ.?التحصیلی\s*)?(14\d{2}|20\d{2})", query)
        if year_match:
            filters = {
                "logic": "and",
                "conditions": [{"field": "graduation_year", "operator": "eq", "value": int(year_match.group(1))}],
                "groups": [],
            }
        return make_plan({
            "dataset_id": "university_graduates", "operation": "count",
            "group_by": [], "metrics": [], "filters": filters,
            "sort": [], "limit": 10, "options": {},
        }, "Deterministic fallback: graduate count.")

    if has_any("درس", "دروس", "course", "courses"):
        count_requested = has_any("تعداد", "چه تعداد", "چند", "count", "how many", "number of")
        list_requested = has_any("نشان بده", "نمایش بده", "فهرست", "لیست", "تمامی", "همه", "تمام", "show", "list", "all")
        conditions = []
        credit_match = re.search(
            r"(حداقل|دست.?کم|بیشتر\s+یا\s+مساوی|at\s+least|minimum(?:\s+of)?)\s*(\d+(?:\.\d+)?)",
            query,
        )
        if credit_match:
            raw_value = credit_match.group(2)
            conditions.append({
                "field": "credits", "operator": "gte",
                "value": float(raw_value) if "." in raw_value else int(raw_value),
            })
        else:
            greater_match = re.search(
                r"(?:بیشتر\s+از|بیش\s+از|greater\s+than|more\s+than)\s*(\d+(?:\.\d+)?)\s*(?:واحد|credit|credits)?",
                query,
            )
            if greater_match:
                raw_value = greater_match.group(1)
                conditions.append({
                    "field": "credits", "operator": "gt",
                    "value": float(raw_value) if "." in raw_value else int(raw_value),
                })
        categories = [value for value in ("core", "specialized") if re.search(rf"\b{value}\b", query)]
        if categories:
            conditions.append({
                "field": "course_category",
                "operator": "in" if len(categories) > 1 else "eq",
                "value": [value.title() for value in categories] if len(categories) > 1 else categories[0].title(),
            })
        if count_requested:
            return make_plan({
                "dataset_id": "university_courses", "operation": "count",
                "group_by": [], "metrics": [],
                "filters": {"logic": "and", "conditions": conditions, "groups": []} if conditions else None,
                "sort": [], "limit": 10, "options": {},
            }, "Deterministic fallback: university course count.")
        if list_requested and (conditions or has_any("تمامی", "همه", "تمام", "all")):
            return make_plan({
                "dataset_id": "university_courses", "operation": "select",
                "group_by": [], "metrics": [],
                "filters": {"logic": "and", "conditions": conditions, "groups": []} if conditions else None,
                "sort": [], "limit": 1000 if has_any("تمامی", "همه", "تمام", "all") else 100,
                "options": {},
            }, "Deterministic fallback: university course selection.")

    # ---------------------------------------------------------
    # Profile-driven analytical planning
    #
    # This deterministic layer deliberately covers comparisons,
    # grouped summaries, rankings, and compound numeric filters
    # across the registered datasets. It never creates joins.
    # ---------------------------------------------------------
    analytical_intent = has_any(
        "مقایسه", "مقایسه کن", "به تفکیک", "برای هر", "بر اساس",
        "گروه بندی", "گروه‌بندی", "میانگین", "متوسط", "جمع",
        "مجموع", "بیشترین", "کمترین", "رتبه بندی", "رتبه‌بندی",
        "compare", "comparison", "average", "mean", "sum",
        "group by", "per ", "rank", "highest", "lowest",
        "most", "greater than", "less than", "at least",
        "count", "how many", "تعداد", "چه تعداد", "چند",
        ">=", "<=", ">", "<",
        "حداقل", "حداکثر", "بیشتر از", "کمتر از",
    )
    if analytical_intent:
        if has_any("شکاف بازار", "market gap", "market_gap", "پوشش درس", "course coverage"):
            dataset_id = "skill_mapping"
        elif has_any(
            "فارغ التحصیل", "فارغ‌التحصیل", "فارغ", "graduate",
            "ارتباط شغلی", "career relevance", "مدت اشتغال",
            "employment months",
        ):
            dataset_id = "university_graduates"
        elif has_any("درس", "دروس", "course", "courses"):
            dataset_id = "university_courses"
        elif has_any(
            "بازار کار", "آگهی شغلی", "job market", "demand_score",
            "demand score", "frequency", "حوزه شغلی", "زمینه شغلی",
            "job field", "عنوان شغلی", "job title", "سطح تجربه",
            "experience level",
        ):
            dataset_id = "labor_market"
        elif has_any("تقاضای بازار", "market demand", "market_demand"):
            dataset_id = "skill_mapping"
        else:
            dataset_id = None

        if dataset_id is not None:
            profile = get_dataset_profile(dataset_id)
            field_aliases = {
                "skill": ("مهارت", "مهارت‌ها", "مهارت ها", "skill", "skills"),
                "market_gap": ("شکاف بازار", "market gap", "market_gap", "شکاف"),
                "market_demand": ("تقاضای بازار", "market demand", "market_demand"),
                "course_coverage": ("پوشش درس", "course coverage", "course_coverage"),
                "demand_score": ("امتیاز تقاضا", "تقاضای بازار", "market demand", "market_demand", "demand score", "demand_score"),
                "frequency": ("فراوانی", "تعداد تکرار", "frequency"),
                "major": ("رشته", "گرایش", "major"),
                "graduation_year": ("سال فارغ التحصیلی", "سال فارغ‌التحصیلی", "graduation year"),
                "study_level": ("مقطع تحصیلی", "مقطع", "study level"),
                "job_title": ("عنوان شغلی", "job title"),
                "job_field": ("حوزه شغلی", "زمینه شغلی", "job field"),
                "employment_months": ("مدت اشتغال", "مدت استخدام", "ماه اشتغال", "ماه های اشتغال", "ماههای اشتغال", "employment duration", "employment months"),
                "career_relevance": ("ارتباط شغلی", "ارتباط با شغل", "ارتباط شغل با رشته", "career relevance"),
                "course_category": ("دسته درس", "دسته‌بندی درس", "course category"),
                "course_name": ("نام درس", "course name"),
                "credits": ("واحد", "اعتبار", "credit", "credits"),
                "experience_level": ("سطح تجربه", "experience level"),
                "additional_training": ("آموزش تکمیلی", "دوره آموزشی", "additional training"),
                "related_skills": ("مهارت مرتبط", "مهارت های مرتبط", "related skills"),
                "course_id": ("شناسه درس", "کد درس", "course id", "course_id"),
            }
            grouping_intent = has_any(
                "به تفکیک", "برای هر", "بر اساس", "گروه بندی",
                "گروه‌بندی", "group by", "per ", "مقایسه", "compare",
                "comparison", "رتبه بندی", "رتبه‌بندی", "rank", "ranking",
            )
            dimension_candidates = {
                "skill", "major", "graduation_year", "study_level",
                "job_title", "job_field", "course_category", "course_name",
                "experience_level", "additional_training", "additional_skills", "related_skills",
            }
            explicit_dimensions = [
                field for field, aliases in field_aliases.items()
                if field in dimension_candidates
                and any(normalize_analytics_text(alias) in query for alias in aliases)
            ]
            if grouping_intent and any(
                field not in profile.get("fields", {})
                or "group_by" not in profile["fields"][field].get("roles", [])
                for field in explicit_dimensions
            ):
                # Never silently substitute a default dimension for an
                # explicitly requested dimension unsupported by this dataset.
                return None
            requested_dimensions = [
                field for field in explicit_dimensions
                if grouping_intent
                and field in profile.get("fields", {})
                and "group_by" in profile["fields"][field].get("roles", [])
            ]
            group_by = requested_dimensions[:2]
            if not group_by and has_any(
                "به تفکیک", "برای هر", "بر اساس", "گروه بندی",
                "گروه‌بندی", "group by", "per ", "مقایسه", "compare",
                "comparison", "رتبه بندی", "رتبه‌بندی",
            ):
                default_group = profile.get("default_group_by")
                if default_group and "group_by" in profile["fields"].get(default_group, {}).get("roles", []):
                    group_by = [default_group]

            metric_aliases = {
                "market_gap": "average_market_gap",
                "market_demand": "average_market_demand",
                "course_coverage": "average_course_coverage",
                "demand_score": "average_demand_score",
                "frequency": "total_frequency",
                "career_relevance": "average_career_relevance",
                "employment_months": "average_employment_months",
                "credits": "average_credits",
            }
            metric_fields = [
                field for field, aliases in field_aliases.items()
                if field in profile.get("fields", {})
                and "metric" in profile["fields"][field].get("roles", [])
                and any(normalize_analytics_text(alias) in query for alias in aliases)
            ]
            def _field_position(field_name: str) -> int:
                positions = [
                    query.find(normalize_analytics_text(alias))
                    for alias in field_aliases.get(field_name, ())
                    if normalize_analytics_text(alias) in query
                ]
                return min(positions) if positions else len(query)

            metric_fields.sort(key=_field_position)

            if not metric_fields and has_any("میانگین", "متوسط", "average", "mean", "مجموع", "جمع", "sum"):
                defaults = profile.get("default_metrics", {})
                metric_fields = [
                    definition.get("field")
                    for definition in defaults.values()
                    if definition.get("field") in profile.get("fields", {})
                    and "metric" in profile["fields"][definition["field"]].get("roles", [])
                ]
            aggregate_requested = bool(group_by) or has_any(
                "میانگین", "متوسط", "average", "mean", "مجموع", "جمع", "sum",
                "بیشترین", "کمترین", "رتبه بندی", "رتبه‌بندی",
                "ranking", "rank", "highest", "lowest",
            )

            conditions = []
            operator_pattern = (
                r"(?:>=|=>|<=|=<|>|<|حداقل|دست.?کم|بیشتر\s+یا\s+مساوی|"
                r"greater\s+than\s+or\s+equal\s+to|at\s+least|minimum(?:\s+of)?|"
                r"بیشتر\s+از|بیش\s+از|greater\s+than|more\s+than|"
                r"حداکثر|کمتر\s+یا\s+مساوی|at\s+most|no\s+more\s+than|"
                r"کمتر\s+از|پایین.?تر\s+از|less\s+than|below)"
            )
            number_pattern = r"(-?\d+(?:[.,]\d+)?)"

            def comparison_operator(token: str, *, reverse: bool = False) -> str:
                normalized_token = normalize_analytics_text(token)
                if normalized_token in {">=", "=>"} or any(
                    term in normalized_token
                    for term in ("حداقل", "دست کم", "بیشتر یا مساوی", "greater than or equal to", "at least", "minimum")
                ):
                    operator = "gte"
                elif normalized_token in {"<=", "=<"} or any(
                    term in normalized_token
                    for term in ("حداکثر", "کمتر یا مساوی", "at most", "no more than")
                ):
                    operator = "lte"
                elif normalized_token == ">" or any(
                    term in normalized_token
                    for term in ("بیشتر از", "بیش از", "greater than", "more than")
                ):
                    operator = "gt"
                elif normalized_token == "<" or any(
                    term in normalized_token
                    for term in ("کمتر از", "پایین تر از", "less than", "below")
                ):
                    operator = "lt"
                else:
                    raise AnalyticsPlanningError(f"Unsupported comparison operator: {token!r}.")
                if reverse:
                    operator = {"gte": "lte", "lte": "gte", "gt": "lt", "lt": "gt"}[operator]
                return operator

            def append_comparison(field: str, token: str, raw_value: str, *, reverse: bool = False, start: int, end: int) -> None
                normalized_raw = raw_value.replace(",", ".")
                value = float(normalized_raw) if "." in normalized_raw else int(normalized_raw)
                candidate = {
                    "field": field,
                    "operator": comparison_operator(token, reverse=reverse),
                    "value": value,
                    "_start": start,
                    "_end": end,
                }
                if candidate not in conditions:
                    conditions.append(candidate)

            for field, aliases in field_aliases.items():
                definition = profile.get("fields", {}).get(field)
                if not definition or "filter" not in definition.get("roles", []):
                    continue
                for alias in aliases:
                    normalized_alias = normalize_analytics_text(alias)
                    escaped = re.escape(normalized_alias)
                    field_first = re.compile(
                        rf"{escaped}\s*(?:با\s*)?({operator_pattern})\s*{number_pattern}",
                        flags=re.IGNORECASE,
                    )
                    for match in field_first.finditer(query):
                        append_comparison(field, match.group(1), match.group(2), start=match.start(), end=match.end())

                    value_first = re.compile(
                        rf"{number_pattern}\s*({operator_pattern})\s*(?:برای\s*)?{escaped}",
                        flags=re.IGNORECASE,
                    )
                    for match in value_first.finditer(query):
                        append_comparison(field, match.group(2), match.group(1), reverse=True, start=match.start(), end=match.end())

            conditions.sort(key=lambda condition: condition["_start"])

            def requested_filter_tree() -> dict | None:
                if not conditions:
                    return None
                clean = [
                    {key: value for key, value in condition.items() if not key.startswith("_")}
                    for condition in conditions
                ]
                connectors = []
                for left, right in zip(conditions, conditions[1:]):
                    between = query[left["_end"]:right["_start"]]
                    tokens = re.findall(r"\b(and|or)\b|(?:\s(و|یا)\s)", between)
                    if len(tokens) != 1:
                        return None
                    token = next((part for part in tokens[0] if part), "")
                    connectors.append("or" if token in {"or", "یا"} else "and")
                if not connectors:
                    return {"logic": "and", "conditions": clean, "groups": []}
                if len(set(connectors)) == 1:
                    return {"logic": connectors[0], "conditions": clean, "groups": []}
                and_groups = []
                current = [clean[0]]
                for connector, condition in zip(connectors, clean[1:]):
                    if connector == "and":
                        current.append(condition)
                    else:
                        and_groups.append({"logic": "and", "conditions": current, "groups": []})
                        current = [condition]
                and_groups.append({"logic": "and", "conditions": current, "groups": []})
                return {"logic": "or", "conditions": [], "groups": and_groups}

            if aggregate_requested and (group_by or metric_fields):
                filter_tree = requested_filter_tree()
                if conditions and filter_tree is None:
                    return None
                metrics = []
                for field in metric_fields:
                    allowed_aggregations = profile["fields"][field].get("aggregations", [])
                    if has_any("تعداد مقادیر متمایز", "تعداد یکتای", "distinct", "unique count", "cardinality"):
                        function = "cardinality"
                    elif has_any("حداقل مقدار", "minimum", "min ") and "min" in allowed_aggregations:
                        function = "min"
                    elif has_any("حداکثر مقدار", "maximum", "max ") and "max" in allowed_aggregations:
                        function = "max"
                    elif has_any("مجموع", "جمع", "sum", "total") and "sum" in allowed_aggregations:
                        function = "sum"
                    else:
                        function = "avg"
                    metrics.append({
                        "function": function,
                        "field": field,
                        "alias": metric_aliases.get(field, f"{function}_{field}"),
                    })
                if has_any("تعداد فارغ التحصیلان", "تعداد فارغ‌التحصیلان", "graduate count", "number of graduates", "count of graduates", "تعداد اسناد", "تعداد رکورد", "document count"):
                    metrics.insert(0, {"function": "count_documents", "alias": "graduate_count" if dataset_id == "university_graduates" else "document_count"})
                if not metrics:
                    metrics = [{"function": "count_documents", "alias": "document_count"}]
                sort = []
                if has_any("بیشترین", "بالاترین", "highest", "most", "رتبه بندی", "رتبه‌بندی", "ranking", "rank", "مرتب کن", "مرتب سازی", "sort by") or has_any("کمترین", "پایین‌ترین", "lowest", "ascending", "صعودی"):
                    ascending = has_any("کمترین", "پایین‌ترین", "lowest", "ascending", "صعودی")
                    target_metric = metrics[0]
                    if has_any("شکاف بازار", "market gap", "market_gap"):
                        target_metric = next((metric for metric in metrics if metric.get("field") == "market_gap"), target_metric)
                    elif has_any("تقاضای بازار", "market demand", "market_demand", "demand score"):
                        target_metric = next((metric for metric in metrics if metric.get("field") in {"market_demand", "demand_score"}), target_metric)
                    target = target_metric["alias"]
                    sort = [{"field": target, "order": "asc" if ascending else "desc"}]
                elif has_any("کمترین", "پایین‌ترین", "lowest"):
                    target_metric = metrics[0]
                    if has_any("شکاف بازار", "market gap", "market_gap"):
                        target_metric = next((metric for metric in metrics if metric.get("field") == "market_gap"), target_metric)
                    elif has_any("تقاضای بازار", "market demand", "market_demand", "demand score"):
                        target_metric = next((metric for metric in metrics if metric.get("field") in {"market_demand", "demand_score"}), target_metric)
                    target = target_metric["alias"]
                    sort = [{"field": target, "order": "asc"}]
                top_match = re.search(r"\b(?:top|first|show|list)\s+(\d{1,3})\b|(?:\b(\d{1,3})\s+(?:مورد|مهارت|رکورد|نتیجه)\b)", query)
                requested_limit = int(next((value for value in (top_match.groups() if top_match else ()) if value), 100))
                return make_plan({
                    "dataset_id": dataset_id, "operation": "aggregate",
                    "group_by": group_by, "metrics": metrics,
                    "filters": filter_tree,
                    "sort": sort, "limit": requested_limit, "options": {},
                }, "Profile-driven deterministic grouped analytics plan.")

            if conditions and not aggregate_requested:
                filter_tree = requested_filter_tree()
                if filter_tree is None:
                    return None
                count_requested = has_any("تعداد", "چه تعداد", "چند", "count", "how many")
                return make_plan({
                    "dataset_id": dataset_id,
                    "operation": "count" if count_requested else "select",
                    "group_by": [], "metrics": [],
                    "filters": filter_tree,
                    "sort": [], "limit": 10 if count_requested else 100,
                    "options": {},
                }, "Profile-driven deterministic filtered count/select plan.")

    return None


async def build_analytics_query_plan(client: Any, question: str, conversation_context: str = "") -> QueryPlan | None:
    """Generate a local-LLM plan and validate it before MCP execution."""
    try:
        response = await client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": _planner_prompt(question, conversation_context)},
                {"role": "user", "content": question},
            ],
            temperature=0.0,
            response_format={"type": "json_object"},
        )
        payload = _extract_json_object(response.choices[0].message.content)
        if payload.get("error"):
            return build_deterministic_analytics_query_plan(question)
        arguments = _validate_plan(payload)
        requested_fields = set(arguments.get("group_by", []))
        requested_fields.update(metric["field"] for metric in arguments.get("metrics", []) if metric.get("field"))
        requested_fields.update(_walk_filter_fields(arguments.get("filters")))
        return QueryPlan(
            tool_name="analytics_query",
            arguments=arguments,
            requested_entities=[],
            requested_fields=requested_fields,
            requested_count=None,
            comparison_requested=False,
            memory_allowed=True,
            fresh_mcp_required=True,
            reason="Validated local-LLM plan against registered dataset and MCP contract.",
        )
    except Exception as exc:
        print(
            "[Planner] Local analytics planning failed; trying deterministic analytics fallback: "
            f"{type(exc).__name__}: {exc}"
        )
        return build_deterministic_analytics_query_plan(question)
