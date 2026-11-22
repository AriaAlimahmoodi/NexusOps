"""Local Persian UI for existing and newly published datasets."""
from collections import OrderedDict
from pathlib import Path
from threading import Lock
from time import monotonic
from typing import Literal
from uuid import uuid4

from elasticsearch import ApiError, ConflictError, NotFoundError
from elastic_transport import TransportError
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.middleware.trustedhost import TrustedHostMiddleware

from tools.computational_engine.service import answer, uses_local_evidence
from tools.persian_ui import datasets

STATIC = Path(__file__).with_name("static")


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


def create_app(client_factory=elasticsearch_client):
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
            with client_factory() as client:
                datasets.publish(client, dataset_id, document)
        except ConflictError:
            raise HTTPException(409, "این شناسه قبلاً منتشر شده است. برای نسخهٔ تازه شناسهٔ دیگری انتخاب کنید.") from None
        except (ApiError, TransportError):
            raise HTTPException(502, "انتشار در Elasticsearch تأیید نشد. وضعیت اتصال و دسترسی را بررسی کنید.") from None
        return {"dataset_id": dataset_id, "row_count": document["row_count"]}

    @app.post("/api/chat")
    def chat(request: ChatQuestion):
        question = request.question.strip()
        if not question:
            raise HTTPException(422, "متن سؤال را وارد کنید.")
        try:
            if request.dataset_id:
                with client_factory() as client:
                    return datasets.answer_dataset(client, request.dataset_id, question)
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
