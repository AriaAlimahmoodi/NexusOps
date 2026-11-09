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

def test_local_plan_rejects_aggregate_without_grouping():
    payload = valid_aggregate_payload(); payload['group_by'] = []
    with pytest.raises(AnalyticsPlanningError, match='requires group_by and metrics'): _validate_plan(payload)

def test_local_plan_rejects_invalid_operator():
    payload = valid_aggregate_payload(); payload['filters']['conditions'][0]['operator'] = 'contains'
    with pytest.raises(AnalyticsPlanningError, match='Unsupported filter operator'): _validate_plan(payload)

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