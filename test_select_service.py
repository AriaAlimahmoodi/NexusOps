from tools.analytics_engine.analytics_service import AnalyticsService
from tools.analytics_engine.models import (
    AnalyticsOperation,
    AnalyticsRequest,
    FilterCondition,
    FilterGroup,
    FilterLogic,
    FilterOperator,
    SortOrder,
    SortSpec,
)
from tools.adapters.elasticsearch_adapter import ElasticsearchAdapter
from config import get_elasticsearch_client


client = get_elasticsearch_client()

adapter = ElasticsearchAdapter(client=client)

service = AnalyticsService(adapter=adapter)


filters = FilterGroup(
    logic=FilterLogic.AND,
    conditions=(
        FilterCondition(
            field="credits",
            operator=FilterOperator.GTE,
            value=3,
        ),
    ),
)


request = AnalyticsRequest(
    dataset_id="university_courses",
    operation=AnalyticsOperation.SELECT,
    filters=filters,
    sort=(
        SortSpec(
            field="credits",
            order=SortOrder.DESC,
        ),
    ),
    limit=10,
)


print("\n=== ANALYTICS REQUEST ===")
print(request.to_dict())


result = service.analyze(request)


print("\n=== SERVICE SELECT RESULT ===")
print(result)