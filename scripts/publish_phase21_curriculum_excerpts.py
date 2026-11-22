"""Prepare and optionally publish four source-scoped curriculum excerpts."""
import argparse
import hashlib
import json

RETRIEVED = "2026-11-23T00:00:00+03:30"
DATASET = "curriculum_catalog"
EXCERPTS = (
    {
        "id": "University-of-Tehran-CmPE-BS-entry-1399-secondary-excerpt",
        "level": "Bachelor of Science",
        "publisher": "Konkur Computer",
        "url": "https://www.konkurcomputer.ir/چارت-درسی-مهندسی-کامپیوتر-دانشگاه-تهران.html",
        "country": "Iran",
        "limitations": "Secondary reproduction, selected semester 1 and 2 courses. Official identifiers and requirement status were not verified.",
        "courses": (
            ("S1-01", "مبانی کامپیوتر و برنامه‌سازی", 3, "unknown"),
            ("S1-02", "کارگاه کامپیوتر", 1, "unknown"),
            ("S1-03", "ریاضی عمومی ۱", 3, "unknown"),
            ("S1-04", "فیزیک ۱", 3, "unknown"),
            ("S2-01", "برنامه‌سازی پیشرفته", 3, "unknown"),
            ("S2-02", "معادلات دیفرانسیل", 3, "unknown"),
        ),
    },
    {
        "id": "Shahid-Chamran-Ahvaz-CmPE-BS-student-association-excerpt",
        "level": "Bachelor of Science",
        "publisher": "CE-SCU student association",
        "url": "https://github.com/CE-SCU/scu-computer-engineering-courses#-دروس-ترم",
        "country": "Iran",
        "limitations": "Student association course listing, selected semesters. Catalog year, formal codes, required status and credits were not established.",
        "courses": (
            ("S2-01", "برنامه‌سازی پیشرفته", None, "unknown"),
            ("S3-01", "مدارهای منطقی", None, "unknown"),
            ("S3-02", "ساختمان داده", None, "unknown"),
            ("S4-01", "طراحی الگوریتم‌ها", None, "unknown"),
            ("S4-02", "معماری کامپیوتر", None, "unknown"),
            ("S5-01", "سیستم‌های عامل", None, "unknown"),
            ("S5-02", "پایگاه داده‌ها", None, "unknown"),
            ("S6-01", "شبکه‌های کامپیوتری", None, "unknown"),
        ),
    },
    {
        "id": "Purdue-ECE-MS-online-CE-primary-area-core-excerpt",
        "level": "Master of Science",
        "publisher": "Purdue University ECE",
        "url": "https://engineering.purdue.edu/ECE/Academics/Online/curriculum",
        "country": "United States",
        "limitations": "Computer Engineering primary-area core only. The other curriculum requirements are outside this excerpt.",
        "courses": (("ECE 60800", "Computational Models and Methods", None, "primary_area_core"),),
    },
    {
        "id": "Purdue-ECE-PhD-CE-primary-area-core-excerpt",
        "level": "Doctor of Philosophy",
        "publisher": "Purdue University ECE",
        "url": "https://engineering.purdue.edu/ECE/Academics/Graduates/PHD/handbook",
        "country": "United States",
        "limitations": "Computer Engineering primary-area core from Table 1. The other doctoral requirements are outside this excerpt.",
        "courses": (("ECE 60800", "Computational Models and Methods", None, "primary_area_core"),),
    },
)


def prepare(excerpt):
    digest = hashlib.sha256(json.dumps(excerpt, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
    # Keep the source URL in the registered provenance field of each catalog record.
    source = f"{excerpt['publisher']} | {excerpt['url']}"
    manifest = {
        "collection_batch": digest, "source_name": source,
        "source_url": excerpt["url"], "publisher": excerpt["publisher"],
        "retrieved_at": RETRIEVED, "geographic_scope": excerpt["country"],
        "license": "No open license asserted; factual course metadata only.",
        "collection_method": "Reviewed public course metadata excerpt.",
        "limitations": excerpt["limitations"],
    }
    rows = []
    for code, title, credits, course_type in excerpt["courses"]:
        rows.append({
            "program_id": excerpt["id"], "major": "Computer Engineering",
            "study_level": excerpt["level"], "course_id": code, "course_name": title,
            "course_type": course_type, "skills": [],
            "source": source, "observed_at": RETRIEVED, "collection_batch": digest,
            "time_granularity": "snapshot", "data_classification": "real",
            **({"credits": credits} if credits is not None else {}),
        })
    return manifest, rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--publish", action="store_true", help="Append excerpts through the canonical real catalog publisher")
    args = parser.parse_args()

    from tools.data_ingestion import prepare_real_records

    batches = [prepare(excerpt) for excerpt in EXCERPTS]
    for manifest, rows in batches:
        prepare_real_records(DATASET, rows, manifest)

    if not args.publish:
        print(json.dumps([{"manifest": manifest, "records": rows} for manifest, rows in batches],
                         ensure_ascii=True, indent=2))
        return

    from config import get_elasticsearch_client
    from tools.atomic_data_publisher import ingest_real_records_atomically

    with get_elasticsearch_client() as client:
        for manifest, rows in batches:
            receipt = ingest_real_records_atomically(client, DATASET, rows, manifest)
            print(json.dumps({"program_id": rows[0]["program_id"], "receipt": receipt}, ensure_ascii=True))


if __name__ == "__main__":
    main()
