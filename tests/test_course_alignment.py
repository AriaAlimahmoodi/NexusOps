from tools.computational_engine.course_alignment import evaluate


def course(skills):
    return dict(program_id="CE", course_id="01", course_name="Programming",
                major="Computer Engineering", collection_batch="c", skills=skills)


def test_alignment_keeps_snapshots_separate_and_counts_unique_skills():
    jobs = [dict(collection_batch=b, skills=s) for b, s in
            [("a", ["python", "python"]), ("a", []), ("b", ["sql"])]]
    a, b = evaluate([course(["python", "net", "python"])], jobs)
    assert (a["result"], b["result"]) == (50, 100)
    assert a["postings_by_course_skill"] == {"net": 0, "python": 1}
    assert a["total_postings"] == 2


def test_unknown_and_out_of_scope():
    assert evaluate([course([])], [dict(collection_batch="a", skills=["x"])])[0]["result"] is None
    assert evaluate([course(["x"])], [dict(collection_batch="a", skills=[])])[0]["result"] is None
    assert evaluate([course(["x"])], [])[0]["result"] is None
    assert evaluate([dict(course([]), major="Computer Science")], []) == []


def test_live_report_queries_all_batches_and_keeps_legacy_evidence_separate():
    from unittest.mock import MagicMock, patch
    from tools.computational_engine.course_alignment import live_report
    import sys
    docs = {"curriculum_catalog_real": [course(["python"])],
            "job_postings_real": [dict(collection_batch="j", skills=["python"])],
            "labor_market": [dict(skill="python")]}
    client = MagicMock()
    client.indices.exists.side_effect = lambda index: index in docs
    client.count.side_effect = lambda index: {"count": len(docs[index]), "_shards": {"failed": 0}}
    helpers = MagicMock()
    helpers.scan.side_effect = lambda client, index, **kw: ({"_source": doc} for doc in docs[index])
    with patch.dict(sys.modules, {"elasticsearch.helpers": helpers}):
        report = live_report(client)
    assert report["courses"][0]["result"] == 0
    assert report["courses"][0]["assessable_postings"] == 1
    assert report["auxiliary_evidence"]["labor_market"]["matching_documents_by_exact_skill"] == {"python": 1}
    assert report["inventory"]["labor_market"]["used_in_score"] is False
