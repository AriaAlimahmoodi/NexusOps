"""Explicit registry and factory for universal source adapters.

The registry selects a raw-source reader by format. It does not discover
providers, infer source formats, transform records, or start ingestion.
"""
from __future__ import annotations

from collections.abc import Iterator

from tools.adapters.api_adapter import APISourceAdapter
from tools.adapters.base import (
    RawRecord,
    SourceAdapter,
    SourceSpec,
    validate_source_adapter,
)
from tools.adapters.csv_adapter import CSVSourceAdapter
from tools.adapters.json_adapter import JSONSourceAdapter


class SourceAdapterRegistry:
    """Hold validated adapters under their declared format names."""

    def __init__(self) -> None:
        self._adapters: dict[str, SourceAdapter] = {}

    @staticmethod
    def _normalize_format_name(format_name: str) -> str:
        if not isinstance(format_name, str) or not format_name.strip():
            raise ValueError("Adapter format_name must be a non-empty string.")
        return format_name.strip().lower()

    def register(self, adapter: SourceAdapter, *, replace: bool = False) -> None:
        """Register an adapter; replacement must be explicitly requested."""
        validate_source_adapter(adapter)
        name = self._normalize_format_name(adapter.format_name)
        if name in self._adapters and not replace:
            raise ValueError(
                f"An adapter for format '{name}' is already registered."
            )
        self._adapters[name] = adapter

    def get_adapter(self, format_name: str) -> SourceAdapter:
        """Return the adapter registered for a format or raise a clear error."""
        name = self._normalize_format_name(format_name)
        try:
            return self._adapters[name]
        except KeyError:
            available = ", ".join(self.formats) or "(none)"
            raise KeyError(
                f"No source adapter is registered for '{name}'. "
                f"Available formats: {available}."
            ) from None

    @property
    def formats(self) -> tuple[str, ...]:
        """Registered format names in registration order."""
        return tuple(self._adapters)

    def iter_records(
        self, format_name: str, source: SourceSpec
    ) -> Iterator[RawRecord]:
        """Dispatch to the selected adapter without buffering its records."""
        if not isinstance(source, SourceSpec):
            raise TypeError("source must be a SourceSpec instance.")
        return self.get_adapter(format_name).iter_records(source)


def create_default_adapter_registry() -> SourceAdapterRegistry:
    """Create a fresh registry containing the built-in source adapters."""
    registry = SourceAdapterRegistry()
    registry.register(CSVSourceAdapter())
    registry.register(JSONSourceAdapter())
    registry.register(APISourceAdapter())
    return registry
