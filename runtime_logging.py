from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone


class JsonLogFormatter(logging.Formatter):
    """Emit compact JSON logs with safe request-correlation fields."""

    _CONTEXT_FIELDS = (
        "request_id",
        "conversation_id",
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
