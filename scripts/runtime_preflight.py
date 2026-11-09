from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any

# Running this file directly sets sys.path[0] to the scripts directory.
# Add the repository root so project modules (for example config.py) resolve.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import httpx
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

from config import get_elasticsearch_client


REQUIRED_MCP_TOOLS = {
    "analytics_query",
    "search_elasticsearch",
    "get_top_market_skills",
    "get_top_skill_gaps",
    "get_market_skill_details",
}


def check_elasticsearch() -> dict[str, Any]:
    client = None
    try:
        client = get_elasticsearch_client()
        info = client.info()
        return {
            "ok": bool(info),
            "cluster_name": info.get("cluster_name"),
            "version": info.get("version", {}).get("number"),
        }
    except Exception as exc:
        return {"ok": False, "error_type": type(exc).__name__, "message": str(exc)}
    finally:
        if client is not None:
            client.close()


async def check_ollama() -> dict[str, Any]:
    base_url = os.getenv(
        "OLLAMA_BASE_URL",
        "http://127.0.0.1:11434/v1",
    )
    ollama_host = os.getenv(
        "OLLAMA_HOST",
        base_url.removesuffix("/v1"),
    ).rstrip("/")
    expected_model = os.getenv("OLLAMA_MODEL", "qwen3:4b")

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{ollama_host}/api/tags")
            response.raise_for_status()
            payload = response.json()

        model_names = {
            item.get("name")
            for item in payload.get("models", [])
            if isinstance(item, dict)
        }
        model_available = expected_model in model_names
        return {
            "ok": model_available,
            "host_reachable": True,
            "expected_model": expected_model,
            "model_available": model_available,
            "available_models": sorted(name for name in model_names if name),
        }
    except Exception as exc:
        return {
            "ok": False,
            "expected_model": expected_model,
            "error_type": type(exc).__name__,
            "message": str(exc),
        }


async def check_mcp() -> dict[str, Any]:
    url = os.getenv(
        "NEXUSOPS_MCP_URL",
        "http://127.0.0.1:8000/mcp",
    )
    try:
        async with streamable_http_client(url) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                response = await session.list_tools()

        available = {tool.name for tool in response.tools}
        missing = sorted(REQUIRED_MCP_TOOLS - available)
        return {
            "ok": not missing,
            "endpoint": url,
            "available_tools": sorted(available),
            "missing_required_tools": missing,
        }
    except Exception as exc:
        return {
            "ok": False,
            "endpoint": url,
            "error_type": type(exc).__name__,
            "message": str(exc),
        }


async def check_n8n() -> dict[str, Any]:
    url = os.getenv("N8N_BASE_URL", "http://localhost:5678").rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=False) as client:
            response = await client.get(url)
        reachable = response.status_code in {200, 301, 302, 303, 307, 308, 401, 403}
        return {
            "ok": reachable,
            "url": url,
            "http_status": response.status_code,
        }
    except Exception as exc:
        return {
            "ok": False,
            "url": url,
            "error_type": type(exc).__name__,
            "message": str(exc),
        }


async def main() -> int:
    results = {
        "elasticsearch": await asyncio.to_thread(check_elasticsearch),
        "ollama": await check_ollama(),
        "mcp": await check_mcp(),
        "n8n": await check_n8n(),
    }
    results["ok"] = all(
        results[name].get("ok", False)
        for name in ("elasticsearch", "ollama", "mcp", "n8n")
    )
    print(json.dumps(results, ensure_ascii=False, indent=2))
    return 0 if results["ok"] else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
