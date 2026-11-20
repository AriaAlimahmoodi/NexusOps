from tools.computational_engine.course_alignment import evaluate


def course(skills):
    return dict(program_id="CE", course_id="01", course_name="Programming",
                major="Computer Engineering", collection_batch="c", skills=skills)


def test_alignment_keeps_snapshots_separate_and_counts_unique_skills():
    jobs = [dict(collection_batch=b, skills=s) for b, s in
            [("a", ["python", "python"]), ("a", []), ("b", ["sql"])]]
    a, b = evaluate([course(["python", "net", "python"])], jobs)
    assert (a["result"], b["result"]) == (None, None)
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
    assert report["auxiliary_evidence"]["labor_market"]["matching_documents_by_canonical_skill"] == {"python": 1}
    assert report["inventory"]["labor_market"]["used_in_score"] is False


def test_reviewed_zero_and_skill_aliases():
    jobs = [dict(collection_batch="j", skills=["Verilog", "Python"])]
    review = dict(program_id="CE", course_id="01", market_batch="j", reference="review",
                  role_scope_checked=True, skill_capture_checked=True, assessed_skills=["systemverilog"])
    assert evaluate([course(["System Verilog"])], jobs, [review])[0]["result"] == 100
    assert evaluate([course(["پایتون"])], jobs)[0]["result"] == 0


def test_candidate_export_preserves_rows_and_ignores_target_skill_for_selection():
    import csv
    import json
    import tempfile
    from pathlib import Path
    from scripts.audit_hardware_roles import audit
    from tools.adapters.mapped_source import build
    from tools.source_ingestion_preflight import audit_source_ingestion_preflight
    with tempfile.TemporaryDirectory() as d:
        source = Path(d) / "raw.csv"
        dest = Path(d) / "subset.csv"
        with source.open("w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["RowNumber", "Jobpost_RawTitle", "Jobpost_SoftwareSkills",
                        "Jobpost_MainJobCategory", "Jobpost_ActivationTime_YEAR_MONTH"])
            for i, title in enumerate(["Firmware engineer", "Software engineer"], 1):
                w.writerow([i, title, json.dumps([{"TitleEn": "System Verilog"}]), "Engineering", "2023-01"])
        report = audit(source, dest)
        assert report["counts"]["read"] == 2 and report["counts"]["candidates"] == 1
        assert report["posting_counts_by_skill"] == {"systemverilog": 1}
        cfg = json.loads(Path("configs/mappings/jobvision-hardware.json").read_text())
        batch, opts = build(cfg, dest, "2026-11-20T00:00:00Z")
        check = audit_source_ingestion_preflight(*batch, **opts)
        assert check["valid_records"] == 1, check


def test_title_evidence_counts_each_posting_once():
    jobs = [
        dict(collection_batch="j", skills=["FPGA"], posting_title="FPGA developer"),
        dict(collection_batch="j", skills=[], posting_title="FPGA and System-Verilog engineer"),
        dict(collection_batch="j", skills=["fpga"], posting_title="Engineer"),
        dict(collection_batch="legacy", skills=["fpga"]),
    ]
    current, legacy = evaluate([course(["fpga", "systemverilog"])], jobs)
    assert current["posting_evidence_by_skill"]["fpga"] == dict(
        structured_skills=2, posting_title=2, both=1, unique_postings=3)
    assert current["postings_by_course_skill"] == {"fpga": 3, "systemverilog": 1}
    assert current["titles_checked"] == 3
    assert legacy["posting_evidence_by_skill"]["fpga"]["posting_title"] is None
