from types import SimpleNamespace
import asyncio
import json
import pytest
from llm_query_planner import AnalyticsPlanningError, _extract_json_object, _validate_plan, build_analytics_query_plan
from query_planner import QueryPlan, build_query_plan, validate_mcp_result

def valid_aggregate_payload():
    return {
        'dataset_id': 'university_courses', 'operation': 'aggregate',
        'group_by': ['course_category'],
        'metrics': [{'function': 'avg', 'field': 'credits', 'alias': 'average_credits'}],
        'filters': {'logic': 'and', 'conditions': [{'field': 'credits', 'operator': 'gte', 'value': 3}],
                    'groups': [{'logic': 'or', 'conditions': [
                        {'field': 'course_category', 'operator': 'eq', 'value': 'Core'},
                        {'field': 'course_category', 'operator': 'eq', 'value': 'Specialized'}], 'groups': []}]},
        'sort': [{'field': 'average_credits', 'order': 'desc'}], 'limit': 25, 'options': {},
    }

def test_local_plan_accepts_registered_dataset_and_nested_filters():
    plan = _validate_plan(valid_aggregate_payload())
    assert plan['dataset_id'] == 'university_courses'
    assert plan['filters']['groups'][0]['logic'] == 'or'
    assert plan['sort'] == [{'field': 'average_credits', 'order': 'desc'}]

def test_local_plan_rejects_unknown_dataset():
    payload = valid_aggregate_payload(); payload['dataset_id'] = 'unregistered_index'
    with pytest.raises(AnalyticsPlanningError, match='not registered'): _validate_plan(payload)

def test_local_plan_rejects_field_outside_dataset_profile():
    payload = valid_aggregate_payload(); payload['filters']['conditions'][0]['field'] = 'salary'
    with pytest.raises(AnalyticsPlanningError, match='not registered'): _validate_plan(payload)

def test_local_plan_rejects_metric_role_mismatch():
    payload = valid_aggregate_payload(); payload['metrics'] = [{'function': 'avg', 'field': 'course_name', 'alias': 'bad'}]
    with pytest.raises(AnalyticsPlanningError, match='cannot be used as'): _validate_plan(payload)

def test_local_plan_accepts_scalar_aggregate_without_grouping():
    payload = valid_aggregate_payload()
    payload['group_by'] = []
    payload['sort'] = []
    plan = _validate_plan(payload)
    assert plan['operation'] == 'aggregate'
    assert plan['group_by'] == []
    assert plan['metrics'][0]['alias'] == 'average_credits'

def test_local_plan_accepts_engine_supported_cardinality_metric():
    payload = valid_aggregate_payload()
    payload['metrics'] = [{'function': 'cardinality', 'field': 'credits', 'alias': 'distinct_credit_values'}]
    payload['sort'] = [{'field': 'distinct_credit_values', 'order': 'desc'}]
    plan = _validate_plan(payload)
    assert plan['metrics'][0]['function'] == 'cardinality'
    assert plan['sort'] == [{'field': 'distinct_credit_values', 'order': 'desc'}]

def test_local_plan_rejects_invalid_operator():
    payload = valid_aggregate_payload(); payload['filters']['conditions'][0]['operator'] = 'contains'
    with pytest.raises(AnalyticsPlanningError, match='Unsupported filter operator'): _validate_plan(payload)



def test_local_plan_normalizes_null_optional_arrays_and_options():
    payload = {
        'dataset_id': 'university_courses',
        'operation': 'select',
        'group_by': None,
        'metrics': None,
        'filters': {
            'logic': None,
            'conditions': [
                {'field': 'credits', 'operator': 'gte', 'value': 3}
            ],
            'groups': None,
        },
        'sort': None,
        'limit': None,
        'options': None,
    }

    plan = _validate_plan(payload)

    assert plan['group_by'] == []
    assert plan['metrics'] == []
    assert plan['sort'] == []
    assert plan['limit'] == 10
    assert plan['options'] == {}
    assert plan['filters']['logic'] == 'and'
    assert plan['filters']['groups'] == []


@pytest.mark.parametrize('field,value,error', [
    ('group_by', 'course_category', 'group_by and metrics must be lists'),
    ('metrics', {}, 'group_by and metrics must be lists'),
    ('sort', 'credits', 'sort must be a list'),
    ('options', [], 'options must be an object'),
])
def test_local_plan_still_rejects_non_null_malformed_optional_fields(field, value, error):
    payload = {
        'dataset_id': 'university_courses',
        'operation': 'select',
        'group_by': [],
        'metrics': [],
        'filters': None,
        'sort': [],
        'limit': 10,
        'options': {},
    }
    payload[field] = value

    with pytest.raises(AnalyticsPlanningError, match=error):
        _validate_plan(payload)

def test_json_extractor_accepts_fenced_response():
    assert _extract_json_object('```json\n{"operation":"count"}\n```') == {'operation': 'count'}

def test_local_planner_returns_registry_validated_plan():
    payload = {'dataset_id': 'labor_market', 'operation': 'aggregate', 'group_by': ['skill'],
               'metrics': [{'function': 'avg', 'field': 'demand_score', 'alias': 'average_demand'},
                           {'function': 'sum', 'field': 'frequency', 'alias': 'total_frequency'}],
               'filters': None, 'sort': [{'field': 'average_demand', 'order': 'desc'}], 'limit': 7, 'options': {}}
    completion = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=json.dumps(payload)))])
    class FakeCompletions:
        async def create(self, **kwargs):
            assert kwargs['model'] == 'qwen3:4b' and kwargs['temperature'] == 0.0
            return completion
    client = SimpleNamespace(chat=SimpleNamespace(completions=FakeCompletions()))
    async def run():
        plan = await build_analytics_query_plan(client, 'Top 7 skills by market demand')
        assert plan is not None and plan.tool_name == 'analytics_query'
        assert plan.arguments['dataset_id'] == 'labor_market' and plan.arguments['limit'] == 7

    asyncio.run(run())

def test_skill_gap_tool_is_reserved_for_ranked_gap_requests():
    assert build_query_plan('بیشترین شکاف مهارتی').tool_name == 'get_top_skill_gaps'
    assert build_query_plan('شکاف مهارتی برای DevOps').tool_name != 'get_top_skill_gaps'

@pytest.mark.parametrize('operation,data', [
    ('count', {'status': 'success', 'dataset_id': 'university_courses', 'operation': 'count', 'result': {'count': 20}, 'metadata': {'returned_records': 1, 'total_records': 20}, 'error': None}),
    ('select', {'status': 'success', 'dataset_id': 'university_courses', 'operation': 'select', 'result': [{'course_id': 'C001'}], 'metadata': {'returned_records': 1, 'total_records': 1}, 'error': None}),
    ('aggregate', {'status': 'success', 'dataset_id': 'university_courses', 'operation': 'aggregate', 'result': {'buckets': [{'group': {'course_category': 'Core'}, 'metrics': {'average_credits': 3.0}, 'document_count': 4}]}, 'metadata': {'returned_records': 1, 'total_records': 20}, 'error': None}),
]) 
def test_analytics_mcp_response_contract(operation, data):
    plan = QueryPlan(tool_name='analytics_query', arguments={'dataset_id': 'university_courses', 'operation': operation})
    valid, message = validate_mcp_result(plan, data)
    assert valid, message

def test_analytics_mcp_response_rejects_dataset_mismatch():
    plan = QueryPlan(tool_name='analytics_query', arguments={'dataset_id': 'labor_market', 'operation': 'count'})
    data = {'status': 'success', 'dataset_id': 'university_courses', 'operation': 'count', 'result': {'count': 20}, 'metadata': {}}
    valid, _ = validate_mcp_result(plan, data)
    assert not valid

def test_analytics_mcp_select_accepts_empty_valid_result():
    plan = QueryPlan(tool_name='analytics_query', arguments={'dataset_id': 'university_courses', 'operation': 'select'})
    data = {'status': 'success', 'dataset_id': 'university_courses', 'operation': 'select', 'result': [], 'metadata': {'returned_records': 0, 'total_records': 0}, 'error': None}
    valid, message = validate_mcp_result(plan, data)
    assert valid, message
def test_document_search_uses_the_actual_mcp_query_argument():
    plan = build_query_plan('اطلاعات فارغ التحصیل G0001 را نشان بده')
    assert plan.tool_name == 'search_elasticsearch'
    assert plan.arguments == {'query': 'اطلاعات فارغ التحصیل G0001 را نشان بده'}

def test_analytics_count_plan_accepts_success_envelope_with_null_error():
    plan = QueryPlan(tool_name='analytics_query', arguments={'dataset_id': 'university_courses', 'operation': 'count'})
    data = {'status': 'success', 'dataset_id': 'university_courses', 'operation': 'count', 'result': {'count': 20}, 'metadata': {'returned_records': 1, 'total_records': 20}, 'error': None}
    valid, message = validate_mcp_result(plan, data)
    assert valid, message

@pytest.mark.parametrize("question,expected_dataset,expected_operation", [
    ("تمام درس‌هایی که حداقل ۳ واحد دارند را نشان بده.", "university_courses", "select"),
    ("درس‌های Core یا Specialized با حداقل ۳ واحد را نمایش بده.", "university_courses", "select"),
    ("تعداد فارغ‌التحصیلانی که در سال ۱۴۰۲ فارغ‌التحصیل شده‌اند چقدر است؟", "university_graduates", "count"),
    ("برای هر رشته، میانگین ارتباط شغلی و مدت اشتغال را محاسبه کن.", "university_graduates", "aggregate"),
])
def test_deterministic_analytics_fallback_builds_supported_plans(question, expected_dataset, expected_operation):
    from llm_query_planner import build_deterministic_analytics_query_plan
    plan = build_deterministic_analytics_query_plan(question)
    assert plan is not None
    assert plan.tool_name == "analytics_query"
    assert plan.arguments["dataset_id"] == expected_dataset
    assert plan.arguments["operation"] == expected_operation
    assert plan.fresh_mcp_required is True


def test_deterministic_course_fallback_preserves_credit_and_category_filters():
    from llm_query_planner import build_deterministic_analytics_query_plan
    plan = build_deterministic_analytics_query_plan("درس‌های Core یا Specialized با حداقل ۳ واحد را نمایش بده.")
    conditions = plan.arguments["filters"]["conditions"]
    assert conditions[0] == {"field": "credits", "operator": "gte", "value": 3}
    assert conditions[1] == {"field": "course_category", "operator": "in", "value": ["Core", "Specialized"]}


def test_deterministic_graduate_count_fallback_extracts_persian_year():
    from llm_query_planner import build_deterministic_analytics_query_plan
    plan = build_deterministic_analytics_query_plan("تعداد فارغ‌التحصیلان در سال ۱۴۰۲ چقدر است؟")
    assert plan.arguments["filters"]["conditions"][0] == {
        "field": "graduation_year", "operator": "eq", "value": 1402,
    }


def test_deterministic_fallback_refuses_ambiguous_or_unsupported_requests():
    from llm_query_planner import build_deterministic_analytics_query_plan
    assert build_deterministic_analytics_query_plan("وضعیت بازار کار فناوری چگونه است؟") is None
    assert build_deterministic_analytics_query_plan("اطلاعات فارغ‌التحصیل G0002 را نشان بده.") is None


def test_local_planner_uses_deterministic_fallback_when_model_fails():
    class FailingCompletions:
        async def create(self, **kwargs):
            raise RuntimeError("Ollama unavailable")
    client = SimpleNamespace(chat=SimpleNamespace(completions=FailingCompletions()))
    async def run():
        plan = await build_analytics_query_plan(
            client,
            "تعداد فارغ‌التحصیلانی که در سال ۱۴۰۲ فارغ‌التحصیل شده‌اند چقدر است؟",
        )
        assert plan is not None
        assert plan.tool_name == "analytics_query"
        assert plan.arguments["operation"] == "count"
        assert plan.arguments["filters"]["conditions"][0]["value"] == 1402
    asyncio.run(run())


def test_course_list_without_filters_uses_select_all_with_explicit_full_limit():
    from llm_query_planner import build_deterministic_analytics_query_plan
    plan = build_deterministic_analytics_query_plan("تمامی درس‌های دانشگاه را نمایش بده.")
    assert plan is not None
    assert plan.arguments["dataset_id"] == "university_courses"
    assert plan.arguments["operation"] == "select"
    assert plan.arguments["filters"] is None
    assert plan.arguments["limit"] == 1000


def test_course_count_uses_count_operation():
    from llm_query_planner import build_deterministic_analytics_query_plan
    plan = build_deterministic_analytics_query_plan("تعداد درس‌های دانشگاه چقدر است؟")
    assert plan is not None
    assert plan.arguments["operation"] == "count"
    assert plan.arguments["dataset_id"] == "university_courses"


def test_query_plan_resolution_prefers_deterministic_analytics_before_ollama():
    from llm_mcp_client import resolve_query_plan
    class NeverCalledClient:
        @property
        def chat(self):
            raise AssertionError("Ollama should not be called for a deterministic intent")
    async def run():
        plan = await resolve_query_plan(
            NeverCalledClient(),
            "تمام درس‌هایی که حداقل ۳ واحد دارند را نشان بده.",
        )
        assert plan.tool_name == "analytics_query"
        assert plan.arguments["dataset_id"] == "university_courses"
        assert plan.arguments["filters"]["conditions"][0]["value"] == 3
    asyncio.run(run())


def test_query_plan_resolution_preserves_exact_graduate_id_lookup():
    from llm_mcp_client import resolve_query_plan
    class NeverCalledClient:
        @property
        def chat(self):
            raise AssertionError("Ollama must not replace exact-ID lookup")
    async def run():
        plan = await resolve_query_plan(
            NeverCalledClient(),
            "اطلاعات فارغ‌التحصیل G0002 را نشان بده.",
        )
        assert plan.tool_name == "search_elasticsearch"
        assert plan.arguments["query"] == "اطلاعات فارغ‌التحصیل G0002 را نشان بده."
    asyncio.run(run())


def test_analytics_intent_guard_detects_dataset_analysis_requests_only():
    from llm_mcp_client import is_analytics_data_request
    assert is_analytics_data_request("میانگین ارتباط شغلی فارغ‌التحصیلان چیست؟")
    assert is_analytics_data_request("تعداد درس‌های دانشگاه چقدر است؟")
    assert not is_analytics_data_request("سلام، حالت چطور است؟")
    assert not is_analytics_data_request("اطلاعات فارغ‌التحصیل G0002 را نشان بده.")


@pytest.mark.parametrize("question,expected_tool", [
    ("بیشترین شکاف مهارتی را نشان بده.", "get_top_skill_gaps"),
    ("Top 10 skills by market demand", "get_top_market_skills"),
])
def test_query_plan_resolution_preserves_specialized_market_tools(question, expected_tool):
    from llm_mcp_client import resolve_query_plan
    class NeverCalledClient:
        @property
        def chat(self):
            raise AssertionError("Specialized market tools must retain routing priority")
    async def run():
        plan = await resolve_query_plan(NeverCalledClient(), question)
        assert plan.tool_name == expected_tool
    asyncio.run(run())


def test_query_plan_resolution_preserves_exact_course_id_lookup():
    from llm_mcp_client import resolve_query_plan
    class NeverCalledClient:
        @property
        def chat(self):
            raise AssertionError("Ollama must not replace exact course-ID lookup")
    async def run():
        plan = await resolve_query_plan(
            NeverCalledClient(),
            "اطلاعات درس C001 را نشان بده.",
        )
        assert plan.tool_name == "search_elasticsearch"
        assert plan.requested_entities[0]["value"] == "C001"
    asyncio.run(run())


def test_analytics_count_response_rejects_inconsistent_total_metadata():
    plan = QueryPlan(tool_name="analytics_query", arguments={"dataset_id": "university_courses", "operation": "count"})
    data = {
        "status": "success", "dataset_id": "university_courses", "operation": "count",
        "result": {"count": 20},
        "metadata": {"returned_records": 1, "total_records": 19},
        "warnings": [], "error": None,
    }
    valid, message = validate_mcp_result(plan, data)
    assert not valid
    assert "COUNT metadata is inconsistent" in message


def test_analytics_select_response_rejects_returned_record_mismatch():
    plan = QueryPlan(tool_name="analytics_query", arguments={"dataset_id": "university_courses", "operation": "select"})
    data = {
        "status": "success", "dataset_id": "university_courses", "operation": "select",
        "result": [{"course_id": "C001"}],
        "metadata": {"returned_records": 2, "total_records": 2},
        "warnings": [], "error": None,
    }
    valid, message = validate_mcp_result(plan, data)
    assert not valid
    assert "SELECT metadata is inconsistent" in message


def test_analytics_select_response_rejects_total_below_returned():
    plan = QueryPlan(tool_name="analytics_query", arguments={"dataset_id": "university_courses", "operation": "select"})
    data = {
        "status": "success", "dataset_id": "university_courses", "operation": "select",
        "result": [{"course_id": "C001"}, {"course_id": "C002"}],
        "metadata": {"returned_records": 2, "total_records": 1},
        "warnings": [], "error": None,
    }
    valid, message = validate_mcp_result(plan, data)
    assert not valid
    assert "SELECT metadata is inconsistent" in message


def test_analytics_aggregate_response_must_match_planned_group_and_metric_fields():
    plan = QueryPlan(
        tool_name="analytics_query",
        arguments={
            "dataset_id": "university_graduates",
            "operation": "aggregate",
            "group_by": ["major"],
            "metrics": [{"function": "avg", "field": "career_relevance", "alias": "average_relevance"}],
        },
    )
    data = {
        "status": "success", "dataset_id": "university_graduates", "operation": "aggregate",
        "result": {"buckets": [{
            "group": {"study_level": "Bachelor"},
            "metrics": {"average_relevance": 4.2},
            "document_count": 8,
        }]},
        "metadata": {"returned_records": 1, "total_records": 30},
        "warnings": [], "error": None,
    }
    valid, message = validate_mcp_result(plan, data)
    assert not valid
    assert "missing planned group fields" in message


def test_analytics_aggregate_response_rejects_missing_metric_alias():
    plan = QueryPlan(
        tool_name="analytics_query",
        arguments={
            "dataset_id": "university_graduates",
            "operation": "aggregate",
            "group_by": ["major"],
            "metrics": [{"function": "avg", "field": "career_relevance", "alias": "average_relevance"}],
        },
    )
    data = {
        "status": "success", "dataset_id": "university_graduates", "operation": "aggregate",
        "result": {"buckets": [{
            "group": {"major": "Computer Engineering"},
            "metrics": {"avg_career_relevance": 4.2},
            "document_count": 8,
        }]},
        "metadata": {"returned_records": 1, "total_records": 30},
        "warnings": [], "error": None,
    }
    valid, message = validate_mcp_result(plan, data)
    assert not valid
    assert "missing planned metric aliases" in message


def test_analytics_aggregate_response_rejects_invalid_numeric_metric():
    plan = QueryPlan(
        tool_name="analytics_query",
        arguments={
            "dataset_id": "university_graduates",
            "operation": "aggregate",
            "group_by": ["major"],
            "metrics": [{"function": "avg", "field": "career_relevance", "alias": "average_relevance"}],
        },
    )
    data = {
        "status": "success", "dataset_id": "university_graduates", "operation": "aggregate",
        "result": {"buckets": [{
            "group": {"major": "Computer Engineering"},
            "metrics": {"average_relevance": float("nan")},
            "document_count": 8,
        }]},
        "metadata": {"returned_records": 1, "total_records": 30},
        "warnings": [], "error": None,
    }
    valid, message = validate_mcp_result(plan, data)
    assert not valid
    assert "invalid value for metric" in message


def test_analytics_aggregate_response_rejects_invalid_document_count():
    plan = QueryPlan(
        tool_name="analytics_query",
        arguments={
            "dataset_id": "university_graduates",
            "operation": "aggregate",
            "group_by": ["major"],
            "metrics": [{"function": "avg", "field": "career_relevance", "alias": "average_relevance"}],
        },
    )
    data = {
        "status": "success", "dataset_id": "university_graduates", "operation": "aggregate",
        "result": {"buckets": [{
            "group": {"major": "Computer Engineering"},
            "metrics": {"average_relevance": 4.2},
            "document_count": True,
        }]},
        "metadata": {"returned_records": 1, "total_records": 30},
        "warnings": [], "error": None,
    }
    valid, message = validate_mcp_result(plan, data)
    assert not valid
    assert "invalid document_count" in message


def test_analytics_response_rejects_malformed_warnings_and_execution_time():
    plan = QueryPlan(tool_name="analytics_query", arguments={"dataset_id": "university_courses", "operation": "count"})
    data = {
        "status": "success", "dataset_id": "university_courses", "operation": "count",
        "result": {"count": 20},
        "metadata": {"returned_records": 1, "total_records": 20, "execution_time_ms": float("inf")},
        "warnings": "not-a-list", "error": None,
    }
    valid, message = validate_mcp_result(plan, data)
    assert not valid
    assert "warnings must be a list" in message


def test_scalar_aggregate_plan_is_valid_without_group_by():
    payload = {
        "dataset_id": "university_graduates",
        "operation": "aggregate",
        "group_by": [],
        "metrics": [{"function": "avg", "field": "employment_months", "alias": "average_employment_months"}],
        "filters": None,
        "sort": [],
        "limit": 1,
        "options": {},
    }
    plan = _validate_plan(payload)
    assert plan["group_by"] == []
    assert plan["metrics"][0]["alias"] == "average_employment_months"


def test_plan_rejects_unknown_top_level_fields():
    payload = valid_aggregate_payload()
    payload["select_fields"] = ["course_name"]
    with pytest.raises(AnalyticsPlanningError, match="Unsupported plan field"):
        _validate_plan(payload)


def test_plan_rejects_excessively_deep_filter_tree():
    payload = valid_aggregate_payload()
    node = {"logic": "and", "conditions": [{"field": "credits", "operator": "gte", "value": 2}], "groups": []}
    for _ in range(7):
        node = {"logic": "and", "conditions": [], "groups": [node]}
    payload["filters"] = node
    with pytest.raises(AnalyticsPlanningError, match="maximum depth"):
        _validate_plan(payload)


def test_persian_text_normalization_handles_arabic_letters_zwnj_and_digits():
    from llm_query_planner import normalize_analytics_text

    assert normalize_analytics_text("فارغ‌التحصیلان ۱۴۰۲ ك") == "فارغالتحصیلان 1402 ک"


@pytest.mark.parametrize("question,expected_type", [
    ("روند مهارت‌های بازار کار را تحلیل کن", "skill_trends"),
    ("گزارش مدیریتی جامع دانشگاه و بازار کار تولید کن", "management_report"),
    ("پیشنهاد اصلاح برنامه درسی بر اساس شکاف مهارتی بده", "curriculum_recommendations"),
    ("اثربخشی دروس را تحلیل کن", "course_effectiveness"),
    ("مقایسه رشته‌های دانشگاه را انجام بده", "major_comparison"),
    ("تحلیل شکاف مهارتی را ارائه کن", "skill_gaps"),
    ("تحلیل تقاضای مهارت‌ها را ارائه کن", "skill_demand"),
])
def test_query_planner_routes_domain_analysis_to_university_market_tool(question, expected_type):
    plan = build_query_plan(question)
    assert plan.tool_name == "analyze_university_market"
    assert plan.arguments["analysis_type"] == expected_type
    assert plan.fresh_mcp_required is True
    assert plan.memory_allowed is False


def test_query_planner_preserves_course_id_for_course_effectiveness_analysis():
    plan = build_query_plan("اثربخشی درس C013 را تحلیل کن")
    assert plan.tool_name == "analyze_university_market"
    assert plan.arguments["analysis_type"] == "course_effectiveness"
    assert plan.arguments["course_id"] == "C013"
