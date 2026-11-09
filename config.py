from __future__ import annotations

import os
import logging

from dotenv import load_dotenv
from elasticsearch import Elasticsearch

load_dotenv()

logger = logging.getLogger("nexusops.elasticsearch")

ELASTICSEARCH_URL = os.getenv(
    "ELASTICSEARCH_URL",
    "https://127.0.0.1:9200",
)

ELASTICSEARCH_USERNAME = os.getenv(
    "ELASTICSEARCH_USERNAME",
    "elastic",
)

ELASTICSEARCH_PASSWORD = os.getenv("ELASTICSEARCH_PASSWORD")

if not ELASTICSEARCH_PASSWORD:
    raise RuntimeError(
        "ELASTICSEARCH_PASSWORD is missing from the .env file."
    )

ELASTICSEARCH_REQUEST_TIMEOUT = float(
    os.getenv("ELASTICSEARCH_REQUEST_TIMEOUT", "20")
)
ELASTICSEARCH_MAX_RETRIES = int(
    os.getenv("ELASTICSEARCH_MAX_RETRIES", "2")
)
ELASTICSEARCH_RETRY_ON_TIMEOUT = (
    os.getenv("ELASTICSEARCH_RETRY_ON_TIMEOUT", "true").casefold()
    in {"1", "true", "yes", "on"}
)
ELASTICSEARCH_VERIFY_CERTS = (
    os.getenv("ELASTICSEARCH_VERIFY_CERTS", "false").casefold()
    in {"1", "true", "yes", "on"}
)

if ELASTICSEARCH_REQUEST_TIMEOUT <= 0:
    raise ValueError("ELASTICSEARCH_REQUEST_TIMEOUT must be positive.")

if ELASTICSEARCH_MAX_RETRIES < 0:
    raise ValueError("ELASTICSEARCH_MAX_RETRIES cannot be negative.")


def get_elasticsearch_client() -> Elasticsearch:
    """
    Create an isolated Elasticsearch client for one operation.

    Analytics and search operations are read-only, so bounded retries for
    transient transport failures and overload responses are safe.
    Callers remain responsible for closing the returned client.
    """
    return Elasticsearch(
        ELASTICSEARCH_URL,
        basic_auth=(
            ELASTICSEARCH_USERNAME,
            ELASTICSEARCH_PASSWORD,
        ),
        verify_certs=ELASTICSEARCH_VERIFY_CERTS,
        request_timeout=ELASTICSEARCH_REQUEST_TIMEOUT,
        max_retries=ELASTICSEARCH_MAX_RETRIES,
        retry_on_timeout=ELASTICSEARCH_RETRY_ON_TIMEOUT,
        retry_on_status=(429, 502, 503, 504),
    )
