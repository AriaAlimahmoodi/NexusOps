"""Read aggregate evidence from the verified JobVision FPGA snapshot."""

import json
import re
from pathlib import Path

from tools.computational_engine.course_alignment import TITLE_PATTERNS
from tools.computational_engine.skill_ids import canonical

SNAPSHOT = Path(__file__).resolve().parents[2] / "configs/evidence/jobvision-fpga-pilot.json"
ROLE = re.compile(
    r"\bFPGAs?\s+(?:postings|jobs|pilot|role)\b|آگهی(?:[\s‌]*ها(?:ی)?)?\s+FPGAs?\b",
    re.IGNORECASE,
)
SOURCE = re.compile(r"\b(?:jobvision|iran)\b|جاب.?ویژن|ایران", re.IGNORECASE)
OTHER_QUERY = re.compile(r"\b(?:purdue|trend|growth)\b|پردو|روند|رشد", re.IGNORECASE)
QUERY_WORDS = set("how many postings jobs mention count of demand for in the skill jobvision iran market is what observed show me report".split())


def is_scope_question(question):
    return bool(ROLE.search(question) and SOURCE.search(question) and not OTHER_QUERY.search(question))


def skill_for_question(question):
    raw_skill = SOURCE.sub(" ", ROLE.sub(" ", question)).replace("پایتون", "Python")
    raw_skill = TITLE_PATTERNS["systemverilog"].sub("systemverilog", raw_skill)
    words = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]*", raw_skill)
    skill = canonical(" ".join(word.rstrip(".") for word in words if word.lower() not in QUERY_WORDS))
    with SNAPSHOT.open(encoding="utf-8") as stream:
        snapshot = json.load(stream)
    if skill not in snapshot["observations"] and skill not in TITLE_PATTERNS:
        raise ValueError("Specify one skill from the JobVision FPGA pilot, such as SystemVerilog or VHDL.")
    if re.search(r"[0-9]{4}-[0-9]{2}", question):
        raise ValueError("The JobVision FPGA pilot uses the full verified snapshot.")
    return skill, snapshot


def market_evidence(question):
    skill, snapshot = skill_for_question(question)
    counts = dict.fromkeys(("structured_skills", "posting_title", "description", "unique_postings"), 0)
    counts.update(snapshot["observations"].get(skill, {}))
    source = snapshot["source"]
    if not source["description_columns"]:
        counts["description"] = None
    if skill not in TITLE_PATTERNS:
        counts["posting_title"] = None
    return skill, counts, snapshot
