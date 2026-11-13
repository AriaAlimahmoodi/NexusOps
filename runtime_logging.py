from __future__ import annotations

import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone



_REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$")


def resolve_request_id(headers: object | None = None) -> str:
    """Return a safe correlation ID from an untrusted HTTP header or generate one."""
    if headers is not None and hasattr(headers, "items"):
        for key, value in headers.items():
            if str(key).lower() == "x-request-id":
                candidate = str(value).strip()
                if _REQUEST_ID_RE.fullmatch(candidate):
                    return candidate
                break
    return uuid.uuid4().hex


class JsonLogFormatter(logging.Formatter):
    """Emit compact JSON logs with safe request-correlation fields."""

    _CONTEXT_FIELDS = (
        "request_id",
        "conversation_ref",
        "tool_name",
        "dataset_id",
        "operation",
        "duration_ms",
        "attempt",
        "error_type",
        "error_code",
        "requested_entity_count",
    )

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.fromtimestamp(
                record.created,
                tz=timezone.utc,
            ).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "event": record.getMessage(),
        }
        for field_name in self._CONTEXT_FIELDS:
            value = getattr(record, field_name, None)
            if value is not None:
                payload[field_name] = value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=False, default=str)


def configure_logging() -> None:
    """Configure one JSON stream handler for a NexusOps process."""
    handler = logging.StreamHandler()
    handler.setFormatter(JsonLogFormatter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(os.getenv("NEXUSOPS_LOG_LEVEL", "INFO").upper())
