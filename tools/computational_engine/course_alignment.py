"""Course-level, direct skill alignment against independent posting snapshots."""
import json
import re
from pathlib import Path

from tools.computational_engine.skill_ids import canonical
from collections import Counter, defaultdict

from tools.computational_engine.source_context import summarize
from tools.dataset_registry import get_dataset_index, list_registered_datasets


TITLE_PATTERNS = {
    "fpga": re.compile(r"(?<![a-z0-9])FPGAs?(?![a-z0-9])", re.I),
    "systemverilog": re.compile(r"(?<![a-z0-9])System[\s-]*Verilog(?![a-z0-9])", re.I),
}


def skill_ids(record):
    values = record.get("skills") or []
    if not isinstance(values, list) or any(not isinstance(v, str) for v in values):
        raise ValueError("Expected a list of canonical skill IDs")
    return {canonical(v) for v in values if v.strip()}


def evaluate(courses, postings, market_reviews=(), statements=()):
    reviews = {}
    for item in market_reviews:
        if not str(item.get("reference", "")).strip():
            raise ValueError("Market review requires a reference")
        reviews[(item["program_id"], item["course_id"], item["market_batch"])] = item
    evidence = defaultdict(list)
    for statement in statements:
        evidence[statement["program_id"], statement["course_id"]].append(statement)
    markets = defaultdict(Counter)
    structured_matches = defaultdict(Counter)
    title_matches = defaultdict(Counter)
    matches_in_both = defaultdict(Counter)
    titles_checked = Counter()
    totals = Counter()
    assessable = Counter()
    sources = defaultdict(set)
    fields = defaultdict(set)
    months = defaultdict(set)
    for posting in postings:
        batch = posting["collection_batch"]
        totals[batch] += 1
        if posting.get("source"):
            sources[batch].add(posting["source"])
        ids = skill_ids(posting)
        title = posting.get("posting_title") or ""
        titles_checked[batch] += bool(title.strip())
        from_title = {skill for skill, pattern in TITLE_PATTERNS.items() if pattern.search(title)}
        structured_matches[batch].update(ids)
        title_matches[batch].update(from_title)
        matches_in_both[batch].update(ids & from_title)
        markets[batch].update(ids | from_title)
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
        supplement = evidence[(course["program_id"], course["course_id"])]
        skills.update(canonical(item["skill_id"]) for item in supplement if item["term_status"] == "verified")
        for batch in sorted(markets) or [None]:
            counts = {s: markets[batch][s] for s in sorted(skills)} if batch else {}
            matches = sum(n > 0 for n in counts.values())
            row = {k: course[k] for k in ("program_id", "course_id", "course_name", "collection_batch")}
            row.update(course_evidence=supplement, market_batch=batch, total_postings=totals[batch],
                       assessable_postings=assessable[batch],
                       job_fields=sorted(fields[batch]), first_month=min(months[batch], default=None),
                       last_month=max(months[batch], default=None), postings_by_course_skill=counts, documented_skills=sorted(skills),
                       matched_skill_count=matches, documented_skill_count=len(skills))
            row["observed_alignment_percent"] = (
                100 * matches / len(skills) if skills and markets.get(batch) else None
            )
            row["market_sources"] = sorted(sources[batch])
            row["titles_checked"] = titles_checked[batch]
            row["posting_evidence_by_skill"] = {
                skill: {
                    "structured_skills": structured_matches[batch][skill],
                    "posting_title": title_matches[batch][skill] if skill in TITLE_PATTERNS and titles_checked[batch] else None,
                    "both": matches_in_both[batch][skill] if skill in TITLE_PATTERNS and titles_checked[batch] else None,
                    "unique_postings": count,
                }
                for skill, count in counts.items()
            }
            review = reviews.get((course["program_id"], course["course_id"], batch), {})
            reviewed = (review.get("role_scope_checked") is True and review.get("skill_capture_checked") is True
                        and skills.issubset(review.get("assessed_skills", [])))
            row["market_review_reference"] = review.get("reference")
            if not skills or not markets.get(batch):
                row.update(status="insufficient_evidence", result=None,
                           limitation="missing_course_skills" if not skills else "missing_market_skills")
            elif matches < len(skills) and not reviewed:
                row.update(status="insufficient_evidence", result=None,
                           limitation="market_scope_and_skill_capture_require_review",
                           observed_unmatched_skills=sorted(s for s, n in counts.items() if not n))
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
    market_rows = read(postings, ["skills", "collection_batch", "job_field", "activation_month", "posting_title", "source"], {"match_all": {}})
    review_file = Path(__file__).resolve().parents[2] / "configs/evidence/market_reviews.json"
    evidence_index = get_dataset_index("course_skill_evidence", "real")
    statements = []
    if evidence_index in inventory:
        inventory[evidence_index]["used_in_score"] = True
        statements = read(evidence_index, ["program_id", "course_id", "term", "term_status", "source_url",
                                           "skill_id", "source_phrase", "collection_batch"], {"match_all": {}})
    results = evaluate(course_rows, market_rows, json.loads(review_file.read_text()), statements)
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
                matches.update(wanted.intersection(canonical(v) for v in values if isinstance(v, str)))
            auxiliary[index] = {"classification": classification, "field": field,
                                "matching_documents_by_canonical_skill": dict(sorted(matches.items()))}

    return {"computation_id": "gap_priority", "metric_version": "2.3.0",
            "unit": "review_priority_points", "formula": "100 * unmatched documented skills / documented skills",
            "scope": "Computer Engineering, each program and curriculum batch against each posting batch",
            "course_index": courses, "market_index": postings, "inventory": inventory,
            "auxiliary_evidence": auxiliary, "source_context": summarize(read, inventory), "courses": results}
