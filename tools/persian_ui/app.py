"""Local Persian UI for existing and newly published datasets."""
import os
import re
from urllib.parse import urlsplit
from collections import OrderedDict
from pathlib import Path
from threading import Lock
from time import monotonic
from typing import Literal
from uuid import uuid4

import httpx
from elasticsearch import ApiError, ConflictError, NotFoundError
from elastic_transport import TransportError
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.middleware.trustedhost import TrustedHostMiddleware

from elasticsearch.helpers import scan

from scripts.plan_phase19_migration import load_reviews, plan
from scripts.publish_phase19_evidence import REVIEW, publish, records_from, search
from tools.dataset_registry import get_dataset_index
from tools.computational_engine.service import answer, uses_local_evidence
from tools.persian_ui import datasets

STATIC = Path(__file__).with_name("static")
PUBLICATION_LOCK = Lock()
COURSE_SKILL_QUESTION = re.compile(
    r"کدام\s+درس[\s‌-]*ها(?:یی?)?\s+(?P<skill>.+?)\s+(?:را\s+)?"
    r"(?:آموزش\s+می[\s‌-]*دهند|تدریس\s+می[\s‌-]*کنند)\s*[؟?]?"
)


class ApiSource(BaseModel):
    url: str = Field(max_length=2048)
    records_path: str = Field(default="", max_length=200)


class MappingReview(BaseModel):
    draft_id: str = Field(max_length=32)
    dataset_id: str = Field(max_length=64)
    title: str = Field(max_length=120)
    skill_field: str
    course_field: str = ""


class Approval(BaseModel):
    review_id: str = Field(max_length=32)
    approved: Literal[True]


class ChatQuestion(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    dataset_id: str = Field(default="", max_length=64)


class TemporaryItems:
    def __init__(self):
        self.items = OrderedDict()
        self.lock = Lock()

    def put(self, item):
        key = uuid4().hex
        with self.lock:
            self.items[key] = (monotonic() + 1800, item)
            while len(self.items) > 8:
                self.items.popitem(last=False)
        return key

    def get(self, key):
        with self.lock:
            expiry, value = self.items.get(key, (0, None))
            if expiry <= monotonic():
                self.items.pop(key, None)
                raise HTTPException(404, "بازبینی موقت منقضی شده است. داده را دوباره دریافت کنید.")
            return value


def elasticsearch_client():
    from config import get_elasticsearch_client

    return get_elasticsearch_client()


def ask_n8n(url, question):
    session_id = uuid4().hex
    loopback = urlsplit(url).hostname in {"localhost", "127.0.0.1", "::1"}
    try:
        response = httpx.post(url, json={
            "action": "sendMessage", "chatInput": question, "sessionId": session_id,
        }, timeout=httpx.Timeout(420, connect=5), follow_redirects=False, trust_env=not loopback)
        response.raise_for_status()
    except httpx.TimeoutException:
        raise HTTPException(504, "مهلت انتظار پاسخ n8n تمام شد. وضعیت اجرای همان سؤال را در Executions بررسی کنید.") from None
    except httpx.HTTPStatusError as exc:
        raise HTTPException(502, f"آدرس چت n8n وضعیت HTTP {exc.response.status_code} برگرداند.") from None
    except httpx.RequestError as exc:
        raise HTTPException(502, f"ارتباط با چت n8n برقرار نشد ({type(exc).__name__}).") from None
    try:
        payload = response.json()
    except ValueError:
        content_type = response.headers.get("content-type", "").split(";", 1)[0]
        raise HTTPException(502, f"پاسخ n8n به‌صورت JSON نبود ({content_type or 'unknown'}).") from None
    if isinstance(payload, list) and len(payload) == 1:
        payload = payload[0]
    if not isinstance(payload, dict):
        raise HTTPException(502, "ساختار پاسخ n8n معتبر نیست.")
    output = payload.get("output") or payload.get("text")
    if not isinstance(output, str) or not output.strip():
        raise HTTPException(502, "متن پاسخ در خروجی n8n پیدا نشد.")
    return {"answer": output, "evidence": {
        "n8n_session_id": session_id, "trace_id": payload.get("traceId"),
        "successful_results": payload.get("successfulResults"),
        "failed_results": payload.get("failedResults"),
    }}


def create_app(client_factory=elasticsearch_client):
    n8n_url = os.getenv("NEXUSOPS_N8N_CHAT_URL", "").strip()
    if n8n_url:
        endpoint = urlsplit(n8n_url)
        if (endpoint.scheme not in {"http", "https"} or not endpoint.hostname
                or endpoint.username or endpoint.password or endpoint.fragment
                or not endpoint.path.startswith("/webhook/") or not endpoint.path.endswith("/chat")):
            raise ValueError("NEXUSOPS_N8N_CHAT_URL must be a Production chat URL.")
    app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "[::1]", "testserver"])
    app.mount("/assets", StaticFiles(directory=STATIC), name="assets")
    drafts = TemporaryItems()
    reviews = TemporaryItems()

    @app.get("/")
    def home():
        return FileResponse(STATIC / "index.html")

    def save_draft(data, kind, records_path, source):
        try:
            draft = datasets.intake(data, kind, records_path=records_path, source=source)
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from None
        return {"draft_id": drafts.put(draft), "columns": draft["columns"], "row_count": len(draft["rows"]),
                "sample": draft["rows"][:3], "source": draft["source"]}

    @app.post("/api/intake/file")
    async def intake_file(request: Request, kind: Literal["csv", "json"], records_path: str = "", filename: str = ""):
        if request.headers.get("content-type") != "application/octet-stream":
            raise HTTPException(415, "فایل را از بخش دریافت داده انتخاب کنید.")
        payload = bytearray()
        async for chunk in request.stream():
            payload.extend(chunk)
            if len(payload) > datasets.MAX_BYTES:
                raise HTTPException(413, "فایل از ۲ مگابایت بیشتر است.")
        return save_draft(payload, kind, records_path[:200], filename.replace("\\", "/").rsplit("/", 1)[-1][:200])

    @app.post("/api/intake/source")
    def intake_source(request: ApiSource):
        try:
            payload, host = datasets.fetch_api(request.url)
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from None
        return save_draft(payload, "api", request.records_path, host)

    @app.post("/api/review")
    def review_mapping(request: MappingReview):
        draft = drafts.get(request.draft_id)
        try:
            document = datasets.review(draft, request.dataset_id, request.title, request.skill_field, request.course_field)
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from None
        return {"review_id": reviews.put((request.dataset_id, document)), "row_count": document["row_count"],
                "mapping": document["data"]["mapping"], "sample": document["data"]["records"][:5]}

    @app.post("/api/publish")
    def publish_dataset(request: Approval):
        dataset_id, document = reviews.get(request.review_id)
        try:
            with client_factory() as client, PUBLICATION_LOCK:
                review = load_reviews(REVIEW)
                candidate = {"_id": dataset_id, "_source": document}
                eligible = records_from(plan([candidate], review))
                try:
                    datasets.publish(client, dataset_id, document)
                except ConflictError:
                    if not eligible or client.get(index=datasets.INDEX, id=dataset_id)["_source"] != document:
                        raise
                if eligible:
                    hits = scan(client, index=datasets.INDEX, allow_partial_search_results=False,
                                query={"query": {"match_all": {}}})
                    publish(client, records_from(plan(hits, review)))
        except ConflictError:
            raise HTTPException(409, "این شناسه قبلاً منتشر شده است. برای نسخهٔ تازه شناسهٔ دیگری انتخاب کنید.") from None
        except (ApiError, TransportError, RuntimeError, OSError, ValueError):
            raise HTTPException(502, "انتشار در Elasticsearch تأیید نشد. وضعیت اتصال و دسترسی را بررسی کنید.") from None
        return {"dataset_id": dataset_id, "row_count": document["row_count"],
                **({"shared_search": True} if eligible else {})}

    @app.post("/api/chat")
    def chat(request: ChatQuestion):
        question = request.question.strip()
        if not question:
            raise HTTPException(422, "متن سؤال را وارد کنید.")
        try:
            if request.dataset_id:
                with client_factory() as client:
                    return datasets.answer_dataset(client, request.dataset_id, question)
            if question.rstrip("؟? .") in {"فهرست دروس", "فهرست درس‌ها", "فهرست دروس کاتالوگ"}:
                with client_factory() as client:
                    hits = scan(client, index=get_dataset_index("curriculum_catalog", "real"),
                                query={"query": {"term": {"data_classification": "real"}}},
                                allow_partial_search_results=False)
                    rows = sorted((hit["_source"] for hit in hits),
                                  key=lambda row: (row["program_id"], row["course_id"], row["collection_batch"]))
                titles = sorted({row["course_name"] for row in rows})
                return {"answer": "\n".join(titles) if titles else "درسی در کاتالوگ واقعی پیدا نشد.",
                        "evidence": {"courses": rows}}
            course_query = COURSE_SKILL_QUESTION.fullmatch(question)
            if course_query:
                with client_factory() as client:
                    try:
                        rows = search(client, course_query["skill"])
                    except NotFoundError:
                        rows = []
                lessons = {f"{row['course_name']} ({row['course_id']})" for row in rows}
                summary = "\n".join(sorted(lessons)) if lessons else "برای این مهارت شاهد درسی پیدا نشد."
                return {"answer": summary, "evidence": {"courses": rows}}
            if n8n_url:
                return ask_n8n(n8n_url, question)
            if uses_local_evidence(question):
                result = answer(None, question)
            else:
                with client_factory() as client:
                    result = answer(client, question)
        except NotFoundError:
            raise HTTPException(404, "دیتاست منتشرشده با این شناسه پیدا نشد.") from None
        except ValueError:
            return {"answer": "برای این سؤال شواهد کافی در مسیر انتخاب‌شده پیدا نشد. برای داده‌های قبلی، سؤال پایلوت FPGA را امتحان کنید."}
        except (ApiError, TransportError):
            raise HTTPException(502, "خواندن داده از Elasticsearch ممکن نشد.") from None
        if "published_fpga" in result:
            summary = result["published_fpga"]["answer_markdown"]
        else:
            summary = "شواهد بازیابی شد. جزئیات را در بخش داده‌های پاسخ ببینید."
        return {"answer": summary, "evidence": result}

    return app
