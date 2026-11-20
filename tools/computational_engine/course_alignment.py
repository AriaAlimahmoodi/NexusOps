"""Course-level, direct skill alignment against independent posting snapshots."""
from collections import Counter, defaultdict

from tools.dataset_registry import get_dataset_index, list_registered_datasets


def skill_ids(record):
    values = record.get("skills") or []
    if not isinstance(values, list) or any(not isinstance(v, str) for v in values):
        raise ValueError("Expected a list of canonical skill IDs")
    return {v.strip() for v in values if v.strip()}


def evaluate(courses, postings):
    markets = defaultdict(Counter)
    totals = Counter()
    assessable = Counter()
    fields = defaultdict(set)
    months = defaultdict(set)
    for posting in postings:
        batch = posting["collection_batch"]
        totals[batch] += 1
        ids = skill_ids(posting)
        markets[batch].update(ids)
        assessable[batch] += bool(ids)
        if posting.get("job_field"):
            fields[batch].add(posting["job_field"])
        if posting.get("activation_month"):
            months[batch].add(posting["activation_month"])
    # One document represents one posting within its published snapshot.
    results = []
    for course in courses:
        if course["major"] != "Computer Engineering":
            continue
        skills = skill_ids(course)
        for batch in sorted(markets) or [None]:
            counts = {s: markets[batch][s] for s in sorted(skills)} if batch else {}
            matches = sum(n > 0 for n in counts.values())
            row = {k: course[k] for k in ("program_id", "course_id", "course_name", "collection_batch")}
            row.update(market_batch=batch, total_postings=totals[batch],
                       assessable_postings=assessable[batch],
                       job_fields=sorted(fields[batch]), first_month=min(months[batch], default=None),
                       last_month=max(months[batch], default=None), postings_by_course_skill=counts, documented_skills=sorted(skills),
                       matched_skill_count=matches, documented_skill_count=len(skills))
            if not skills or not markets.get(batch):
                row.update(status="insufficient_evidence", result=None,
                           limitation="missing_course_skills" if not skills else "missing_market_skills")
            else:
                row.update(status="computed", result=100 * (len(skills) - matches) / len(skills),
                           limitation="direct_matches_among_documented_skills_only")
            results.append(row)
    return sorted(results, key=lambda r: (r["program_id"], r["collection_batch"], r["course_id"], r["market_batch"] or ""))


def live_report(client):
    from elasticsearch.helpers import scan

    courses = get_dataset_index("curriculum_catalog", "real")
    postings = get_dataset_index("job_postings", "real")
    inventory = {}
    for profile in list_registered_datasets():
        for index in (profile["index"], profile.get("real_index")):
            if index and index not in inventory and client.indices.exists(index=index):
                response = client.count(index=index)
                if response["_shards"]["failed"]:
                    raise RuntimeError(f"Incomplete count for {index}")
                inventory[index] = dict(documents=response["count"], used_in_score=index in (courses, postings))

    def read(index, fields, query):
        for hit in scan(client, index=index, query={"query": query, "_source": fields},
                        allow_partial_search_results=False):
            yield hit["_source"]

    course_rows = read(courses, ["program_id", "course_id", "course_name", "major", "skills", "collection_batch"],
                       {"term": {"major": "Computer Engineering"}})
    market_rows = read(postings, ["skills", "collection_batch", "job_field", "activation_month"], {"match_all": {}})
    results = evaluate(course_rows, market_rows)
    # Aggregated legacy observations do not have posting IDs or a comparable denominator.
    # Expose exact skill matches as independent evidence with their original classification.
    auxiliary = {}
    wanted = {skill for row in results for skill in row["documented_skills"]}
    for dataset, field in (("labor_market", "skill"), ("skill_mapping", "skill"),
                           ("course_graduate_records", "related_skills"), ("university_courses", "skills")):
        for classification in ("synthetic", "real"):
            index = get_dataset_index(dataset, classification)
            if index not in inventory:
                continue
            matches = Counter()
            for doc in read(index, [field], {"match_all": {}}):
                values = doc.get(field) or []
                if isinstance(values, str):
                    values = [values]
                matches.update(wanted.intersection(values))
            auxiliary[index] = {"classification": classification, "field": field,
                                "matching_documents_by_exact_skill": dict(sorted(matches.items()))}

    return {"computation_id": "gap_priority", "metric_version": "2.0.0",
            "unit": "review_priority_points", "formula": "100 * unmatched documented skills / documented skills",
            "scope": "Computer Engineering, each program and curriculum batch against each posting batch",
            "course_index": courses, "market_index": postings, "inventory": inventory,
            "auxiliary_evidence": auxiliary, "courses": results}
