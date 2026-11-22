"""Bounded intake, explicit field mapping, and immutable reviewed publication."""
import csv
import hashlib
import io
import json
import os
import re
from collections import Counter
from urllib.parse import urlsplit

import httpx
from elasticsearch import BadRequestError

from tools.computational_engine.skill_ids import canonical

INDEX = "nexusops_real_dynamic_datasets_v1"
MAX_BYTES = 2 * 1024 * 1024
MAX_ROWS = 10_000
SCHEMA = "phase17-skill-course-v1"
DATASET_ID = re.compile(r"[a-z][a-z0-9_-]{1,63}")


def validate_id(dataset_id):
    if not DATASET_ID.fullmatch(dataset_id):
        raise ValueError("شناسه باید ۲ تا ۶۴ نویسهٔ انگلیسی کوچک، عدد، خط تیره یا زیرخط باشد و با حرف شروع شود.")


def fetch_api(url):
    try:
        target = urlsplit(url)
        allowed = {host.strip().lower() for host in os.getenv("NEXUSOPS_INGEST_API_HOSTS", "").split(",") if host.strip()}
        permitted = (target.scheme == "https" and target.hostname in allowed
                     and target.port in (None, 443) and target.username is None and target.password is None
                     and not target.fragment)
    except ValueError:
        permitted = False
    if not permitted:
        raise ValueError("نشانی باید HTTPS و دامنه در فهرست مجاز دریافت API باشد.")
    try:
        with httpx.Client(timeout=12, follow_redirects=False, trust_env=False) as client:
            with client.stream("GET", url, headers={"Accept": "application/json"}) as response:
                response.raise_for_status()
                data = bytearray()
                for block in response.iter_bytes(chunk_size=64 * 1024):
                    data.extend(block)
                    if len(data) > MAX_BYTES:
                        raise ValueError("پاسخ API از ۲ مگابایت بیشتر است.")
    except httpx.HTTPError as exc:
        detail = f"HTTP {exc.response.status_code}" if isinstance(exc, httpx.HTTPStatusError) else type(exc).__name__
        raise ValueError(f"دریافت API ناموفق بود ({detail}).") from None
    return bytes(data), target.hostname


def _json_object(pairs):
    result = dict(pairs)
    if len(result) != len(pairs):
        raise ValueError("JSON دارای نام فیلد تکراری است.")
    return result


def intake(payload, kind, *, records_path="", source=None):
    if not payload or len(payload) > MAX_BYTES:
        raise ValueError("اندازهٔ داده باید بین ۱ بایت و ۲ مگابایت باشد.")
    try:
        text = payload.decode("utf-8-sig")
        if kind == "csv":
            reader = csv.DictReader(io.StringIO(text, newline=""), strict=True)
            columns = reader.fieldnames or []
            if any(not col.strip() for col in columns) or len(set(columns)) != len(columns):
                raise ValueError("عنوان ستون‌های CSV باید غیرخالی و یکتا باشند.")
            rows = list(reader)
            if any(None in row or None in row.values() for row in rows):
                raise ValueError("تعداد فیلدهای یکی از ردیف‌های CSV با سربرگ برابر نیست.")
        else:
            rows = json.loads(text, object_pairs_hook=_json_object)
            for key in records_path.strip().split(".") if records_path.strip() else ():
                if not isinstance(rows, dict) or key not in rows:
                    raise ValueError("مسیر آرایهٔ رکوردها در JSON پیدا نشد.")
                rows = rows[key]
            if not isinstance(rows, list) or any(not isinstance(row, dict) for row in rows):
                raise ValueError("داده باید آرایه‌ای از اشیای JSON باشد.")
    except (UnicodeDecodeError, csv.Error, json.JSONDecodeError, RecursionError):
        raise ValueError("ساختار فایل معتبر نیست. فایل CSV یا JSON با کدگذاری UTF-8 بدهید.") from None
    if not 0 < len(rows) <= MAX_ROWS:
        raise ValueError("مجموعه باید بین ۱ تا ۱۰٬۰۰۰ ردیف داشته باشد.")
    columns = sorted({key for row in rows for key in row})
    if not columns or len(columns) > 128:
        raise ValueError("داده باید بین ۱ تا ۱۲۸ ستون داشته باشد.")
    return {"rows": rows, "columns": columns, "source": {"kind": kind, "name": source,
            "sha256": hashlib.sha256(payload).hexdigest()}}


def review(draft, dataset_id, title, skill_field, course_field):
    validate_id(dataset_id)
    title = title.strip()
    if not title or len(title) > 120:
        raise ValueError("عنوان دیتاست باید ۱ تا ۱۲۰ نویسه باشد.")
    if (skill_field not in draft["columns"] or course_field == skill_field
            or (course_field and course_field not in draft["columns"])):
        raise ValueError("ستون مهارت و ستون اختیاری درس باید معتبر و متفاوت باشند.")
    records = []
    for index, row in enumerate(draft["rows"], 1):
        skill = row.get(skill_field)
        course = row.get(course_field) if course_field else None
        if not isinstance(skill, str) or len(skill) > 160 or not canonical(skill):
            raise ValueError(f"مهارت در ردیف {index} باید متن غیرخالی و حداکثر ۱۶۰ نویسه باشد.")
        if course is not None and (not isinstance(course, str) or len(course) > 200):
            raise ValueError(f"عنوان درس در ردیف {index} باید متن و حداکثر ۲۰۰ نویسه باشد.")
        records.append({"source_row": index, "skill": canonical(skill), "course": (course.strip() or None) if course else None})
    return {"schema": SCHEMA, "classification": "real", "title": title, "row_count": len(records),
            "data": {"source": draft["source"], "mapping": {"skill": skill_field, "course": course_field or None},
                     "records": records}}


def publish(client, dataset_id, document):
    validate_id(dataset_id)
    try:
        client.indices.create(index=INDEX, mappings={
            "dynamic": "strict", "properties": {
                "schema": {"type": "keyword"}, "classification": {"type": "keyword"},
                "title": {"type": "keyword"}, "row_count": {"type": "integer"},
                "data": {"type": "object", "enabled": False},
            },
        })
    except BadRequestError as exc:
        if exc.error != "resource_already_exists_exception":
            raise
    client.create(index=INDEX, id=dataset_id, document=document, refresh=True)


def answer_dataset(client, dataset_id, question):
    validate_id(dataset_id)
    document = client.get(index=INDEX, id=dataset_id)["_source"]
    if document["schema"] != SCHEMA or document["classification"] != "real":
        raise ValueError("دیتاست با قرارداد انتشار سازگار نیست.")
    data = document["data"]
    rows = data["records"]
    count_query = re.search(r"چند\s*(?:ردیف|رکورد)|تعداد\s*(?:ردیف|رکورد)", question)
    top_query = re.search(r"پرتقاضا|پرتکرار|بیشترین\s*تکرار|بیشترین\s*تقاضا", question)
    if count_query:
        answer = f"دیتاست «{document['title']}» {len(rows)} ردیف منتشرشده دارد."
        evidence = {"row_count": len(rows)}
    elif top_query:
        counts = Counter(row["skill"] for row in rows)
        maximum = max(counts.values())
        leaders = sorted(skill for skill, count in counts.items() if count == maximum)
        displayed = leaders[:10]
        answer = f"در «{document['title']}»، بیشترین فراوانی ثبت‌شده {maximum} از {len(rows)} ردیف است."
        evidence = {"skills": {}}
        for skill in displayed:
            matches = [row for row in rows if row["skill"] == skill]
            courses = sorted({row["course"] for row in matches if row["course"]})
            answer += f"\n{skill} | درس‌های ثبت‌شده: " + ("، ".join(courses[:5]) if courses else "شاهدی در نگاشت ثبت نشده است.")
            evidence["skills"][skill] = {"source_rows": [row["source_row"] for row in matches], "courses": courses}
        if len(leaders) > len(displayed):
            answer += f"\n{len(leaders)} مهارت در بیشترین فراوانی مساوی‌اند. ۱۰ مورد نخست نمایش داده شد."
    else:
        answer = "برای پاسخ قطعی به این سؤال شواهد کافی نداریم. در این دیتاست می‌توان تعداد ردیف‌ها، مهارت‌های پرتکرار و درس‌های نگاشت‌شدهٔ آن‌ها را بررسی کرد."
        evidence = {}
    return {"answer": answer, "dataset_id": dataset_id, "source": data["source"], "evidence": evidence}
