"""Adapter that exposes configured API acquisitions to the existing ingestion pipeline."""
from __future__ import annotations
import json
from collections.abc import Iterator
from pathlib import Path
from typing import Any
from tools.adapters.api_adapter import APISourceError
from tools.adapters.base import SourceSpec
from tools.source_engine import acquire_api_source, load_source_config
from tools.source_engine.runner import _extract

class ConfiguredAPISourceAdapter:
    """Acquire a JSON API from a config file, then stream its preserved raw pages."""
    format_name = "api_config"
    _OPTIONS = {"output_root", "resume", "max_pages", "allow_partial"}

    def iter_records(self, source: SourceSpec) -> Iterator[dict[str, Any]]:
        if not isinstance(source, SourceSpec):
            raise TypeError("source must be a SourceSpec instance.")
        unknown = set(source.options) - self._OPTIONS
        if unknown:
            raise ValueError(f"Unsupported configured API adapter option(s): {sorted(unknown)}.")
        for key in ("resume", "allow_partial"):
            if key in source.options and not isinstance(source.options[key], bool):
                raise ValueError(f"Configured API adapter option '{key}' must be boolean.")
        if "max_pages" in source.options:
            value = source.options["max_pages"]
            if isinstance(value, bool) or not isinstance(value, int) or value < 1:
                raise ValueError("Configured API adapter max_pages must be a positive integer.")
        config = load_source_config(source.uri)
        if config.get("storage", {}).get("preserve_raw_pages", True) is not True:
            raise ValueError("Configured API ingestion requires preserve_raw_pages=true.")
        result = acquire_api_source(
            config,
            output_root=source.options.get("output_root", "data/raw/api_sources"),
            resume=source.options.get("resume", True),
            max_pages=source.options.get("max_pages"),
        )
        if result["status"] != "completed" and not source.options.get("allow_partial", False):
            raise APISourceError("Configured API acquisition is partial; canonical ingestion is blocked.")
        page_dir = Path(result["raw_directory"]) / "pages"
        for page_file in sorted(page_dir.glob("page_*.json")):
            with page_file.open("r", encoding="utf-8") as stream:
                document = json.load(stream)
            yield from _extract(document, config["response"])
