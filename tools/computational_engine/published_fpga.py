"""Publish and read a reviewed FPGA evidence snapshot through a real-only alias."""
import hashlib
import json
import re
from pathlib import Path
from uuid import uuid4

from elasticsearch import NotFoundError

from tools.computational_engine.jobvision_fpga import load_snapshot

ALIAS = "nexusops_real_fpga_evidence"
DOCUMENT_ID = "fpga"
SCHEMA = "fpga-real-evidence-v1"


def is_published_question(question):
    return bool(re.search(r"\bFPGA\b", question, re.I)
                and re.search(r"published evidence|شواهد\s+منتشر[\s‌]*شده", question, re.I))


def validate_report(report):
    snapshot = load_snapshot()
    market = report["market_scope"]
    if (market["source"] != snapshot["source"] or market["role"] != snapshot["role"]
            or market["total_postings"] != snapshot["total_postings"]
            or report["competency_scope"]["course_id"] != "525.677.81"
            or report["education_scope"]["course_review_version"] != "fpga-course-syllabi-v2"):
        raise ValueError("The pilot scope does not match the reviewed market and course evidence.")
    skills = {row["skill_id"]: row for row in report["skills"]}
    if len(report["skills"]) != 5 or set(skills) != {"fpga", "vhdl", "verilog", "matlab", "systemverilog"}:
        raise ValueError("The reviewed five-skill set is required.")
    from tools.computational_engine.indicators import POSTING_IDS_SHA256

    for skill, row in skills.items():
        demand = row["market_demand"]
        trace = demand["posting_evidence"]
        ids = trace["denominator_ids"]
        checksum = hashlib.sha256(",".join(map(str, sorted(map(int, ids)))).encode("ascii")).hexdigest()
        expected = snapshot["observations"].get(skill, {}).get("unique_postings", 0)
        if (trace["status"] != "verified_rows" or checksum != POSTING_IDS_SHA256
                or len(ids) != snapshot["total_postings"]
                or not set(trace["matches"]).issubset(ids)
                or len(trace["matches"]) != expected or demand["numerator"] != expected
                or demand["denominator"] != len(ids)):
            raise ValueError(f"Posting evidence for {skill} does not reproduce the reviewed snapshot.")


def stage_payload(csv_path):
    from tools.computational_engine.service import _verified_course_report

    report = _verified_course_report(Path(csv_path).resolve())
    validate_report(report)
    return (json.dumps(report, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8")


def approved_document(payload, approval):
    digest = hashlib.sha256(payload).hexdigest()
    if approval != digest:
        raise ValueError("Approval must match the SHA-256 of the exact reviewed evidence file.")
    report = json.loads(payload)
    validate_report(report)
    return {"schema": SCHEMA, "classification": "real", "approval_sha256": digest, "report": report}


def publish(client, payload, approval):
    document = approved_document(payload, approval)
    if client.indices.exists_alias(name=ALIAS):
        current = list(client.indices.get_alias(name=ALIAS))
        if len(current) != 1 or not current[0].startswith(ALIAS + "__v_"):
            raise RuntimeError("The real pilot alias has an unexpected target.")
        previous = current[0]
    else:
        if client.indices.exists(index=ALIAS):
            raise RuntimeError("The real pilot name already exists as a concrete index.")
        previous = None

    index = f"{ALIAS}__v_{uuid4().hex}"
    client.indices.create(index=index, mappings={
        "dynamic": "strict",
        "properties": {
            "schema": {"type": "keyword"},
            "classification": {"type": "keyword"},
            "approval_sha256": {"type": "keyword"},
            "report": {"type": "object", "enabled": False},
        },
    })
    client.create(index=index, id=DOCUMENT_ID, document=document, refresh=True)
    if client.get(index=index, id=DOCUMENT_ID)["_source"] != document:
        raise RuntimeError("Staged evidence differs from the approved document.")
    client.indices.put_settings(index=index, settings={"index.blocks.write": True})
    actions = []
    if previous:
        actions.append({"remove": {"index": previous, "alias": ALIAS, "must_exist": True}})
    actions.append({"add": {"index": index, "alias": ALIAS, "is_write_index": True}})
    response = client.indices.update_aliases(actions=actions)
    if not response["acknowledged"] or response.get("errors"):
        raise RuntimeError("Elasticsearch did not confirm the real-pilot alias update.")
    if list(client.indices.get_alias(name=ALIAS)) != [index]:
        raise RuntimeError("The real-pilot alias changed during publication. Inspect it before retrying.")
    return {"alias": ALIAS, "index": index, "previous_index": previous, "approval_sha256": approval}


def answer_published(client, question):
    fa = bool(re.search(r"[\u0600-\u06ff]", question))
    try:
        source = client.get(index=ALIAS, id=DOCUMENT_ID)["_source"]
    except NotFoundError:
        return {"question": question, "published_fpga": {
            "status": "publication_unavailable",
            "answer_markdown": (
                "مجموعهٔ دادهٔ واقعی FPGA در Elasticsearch در دسترس نیست. برای پاسخ مستند، ابتدا باید نسخهٔ بازبینی‌شده منتشر شود."
                if fa else "The approved real FPGA evidence is unavailable in Elasticsearch."
            ),
        }}
    if source["classification"] != "real" or source["schema"] != SCHEMA:
        raise ValueError("The real pilot alias returned an incompatible document.")
    report = source["report"]
    rows = {row["skill_id"]: row for row in report["skills"]}
    vhdl = rows["vhdl"]
    verilog = rows["verilog"]
    institution = report["competency_scope"]
    publication = next(p for p in verilog["education_coverage"]["publications"] if p["course_id"] == "ENG EC 551")
    related = next(p for p in vhdl["education_coverage"]["publications"] if p["course_id"] == "525.677.81")
    insufficient = bool(re.search(r"system[\s-]*verilog|سیستم\s*وریلاگ", question, re.I))
    review_question = bool(re.search(r"پرتقاضا|بازنگری|high.demand|review", question, re.I))
    if insufficient:
        row = rows["systemverilog"]
        demand = row["market_demand"]
        total = demand["denominator"]
        missing = report["market_scope"]["missing"]["description"]
        status = "insufficient_evidence"
        report_text = (
            f"شواهد برای نتیجه‌گیری قطعی دربارهٔ تقاضا یا شکاف SystemVerilog کافی نیست. در {total} آگهی بررسی‌شده، هیچ اشاره‌ای در فیلدهای موجود ثبت نشده و شرح شغل برای {missing} آگهی در دسترس نیست. برای این مهارت در درس {institution['course_id']} ارزیابی مستند نداریم."
            if fa else
            f"Evidence is insufficient for a definitive SystemVerilog demand or gap conclusion. No mentions were recorded in the available fields of {total} postings, and job descriptions were missing for {missing}. Course {institution['course_id']} has no documented assessment for this skill."
        )
        evidence = {"systemverilog": row}
    elif review_question:
        def counts(row, field):
            metric = row[field]
            return f"{metric['numerator']}/{metric['denominator']}"

        vhdl_market = counts(vhdl, "market_demand")
        verilog_market = counts(verilog, "market_demand")
        verilog_coverage = counts(verilog, "education_coverage")
        status = "supported_review"
        report_text = (
            f"**VHDL** در {vhdl_market} آگهی FPGA از JobVision ایران دیده شد و درس [{related['course_id']} جانز هاپکینز]({related['source']['url']}) برای آن هدف و ارزیابی مستند دارد.\n\n"
            f"**Verilog** در {verilog_market} آگهی و {verilog_coverage} سند درسی بررسی‌شده دیده شد. [{publication['course_id']} دانشگاه بوستون]({publication['source']['url']}) شاهد مستقیم پوشش است. پیشنهاد بازنگری این است که ابتدا سرفصل کامل و تکالیف نمره‌دار سایر درس‌ها بررسی شوند تا معلوم شود این پوشش محدود در اسناد به شکاف آموزشی واقعی مربوط است."
            if fa else
            f"**VHDL** appeared in {vhdl_market} JobVision Iran FPGA postings. [Johns Hopkins {related['course_id']}]({related['source']['url']}) documents a related target and assessment.\n\n"
            f"**Verilog** appeared in {verilog_market} postings and {verilog_coverage} reviewed course documents. [Boston University {publication['course_id']}]({publication['source']['url']}) provides direct evidence. Review full syllabi and graded assignments before deciding whether limited published coverage warrants a curriculum change."
        )
        evidence = {"vhdl": vhdl, "verilog": verilog}
    else:
        status = "insufficient_evidence"
        evidence = {}
        report_text = (
            "این مجموعهٔ منتشرشده فقط شواهد پایلوت آگهی‌های FPGA جاب‌ویژن و درس‌های بررسی‌شده را پوشش می‌دهد. برای پاسخ قطعی به این سؤال شواهد کافی نداریم."
            if fa else "The publication covers the JobVision FPGA sample and reviewed courses. It provides insufficient evidence for a definitive answer to this question."
        )
    return {
        "question": question,
        "published_fpga": {
            "status": status,
            "answer_markdown": report_text,
            "index_alias": ALIAS,
            "approval_sha256": source["approval_sha256"],
            "market_scope": report["market_scope"],
            "education_scope": report["education_scope"],
            "competency_scope": institution,
            "evidence": evidence,
        },
    }
