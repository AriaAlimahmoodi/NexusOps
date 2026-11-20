"""Source-backed context for a course and market answer."""
from collections import defaultdict
from statistics import mean

from tools.dataset_registry import get_dataset_index


CONTEXT = {
    "us_unemployment_monthly": ("United States", "unemployment_rate_pct", "month_start", "series_id"),
    "us_college_institutions": ("United States", "undergraduate_enrollment", None, None),
    "university_graduates": (None, "career_relevance", "graduation_year", "major"),
    "course_graduate_records": (None, None, None, "course_id"),
    "university_courses": (None, "credits", None, "course_category"),
    "labor_market": (None, "demand_score", None, "skill"),
    "skill_mapping": (None, "market_gap", None, "skill"),
}


def summarize(read, inventory):
    result = {}
    for dataset, (geography, metric, period, dimension) in CONTEXT.items():
        for classification in ("synthetic", "real"):
            index = get_dataset_index(dataset, classification)
            if index not in inventory:
                continue
            groups = defaultdict(list)
            fields = [f for f in (metric, period, dimension, "source", "collection_batch") if f]
            for row in read(index, fields, {"match_all": {}}):
                key = (row.get("source"), row.get("collection_batch"),
                       row.get(dimension), row.get(period))
                groups[key].append(row.get(metric))
            summaries = []
            for (source, batch, group, date), values in groups.items():
                observed = [v for v in values if isinstance(v, (int, float)) and not isinstance(v, bool)]
                summaries.append(dict(source=source, collection_batch=batch, dimension_value=group,
                                      period=date, records=len(values), observed_values=len(observed),
                                      mean=mean(observed) if observed else None))
            result[index] = dict(dataset_id=dataset, index=index, classification=classification,
                                 geography=geography, field=metric, period_field=period,
                                 dimension_field=dimension, summaries=summaries)
    return result
