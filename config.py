import os

from dotenv import load_dotenv
from elasticsearch import Elasticsearch

load_dotenv()

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


def get_elasticsearch_client() -> Elasticsearch:
    return Elasticsearch(
        ELASTICSEARCH_URL,
        basic_auth=(
            ELASTICSEARCH_USERNAME,
            ELASTICSEARCH_PASSWORD,
        ),
        verify_certs=False,
    )
