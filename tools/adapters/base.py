"""Shared contracts for source-neutral ingestion adapters.

Adapters read source records only. They do not assign canonical meaning,
normalize fields, validate dataset profiles, or publish documents.
"""
from __future__ import annotations

from collections.abc import Iterator, Mapping
from dataclasses import dataclass, field
from types import MappingProxyType
from typing import Any, Protocol, runtime_checkable


RawRecord = Mapping[str, Any]


@dataclass(frozen=True, slots=True)
class SourceSpec:
    """Describe one source location and adapter-specific read options.

    The URI is intentionally opaque to the shared contract. A file adapter
    may interpret it as a local path, while a future API adapter may interpret
    it as an HTTP(S) endpoint or a configured source identifier.
    """

    uri: str
    options: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not isinstance(self.uri, str) or not self.uri.strip():
            raise ValueError("SourceSpec.uri must be a non-empty string.")
        if not isinstance(self.options, Mapping):
            raise ValueError("SourceSpec.options must be a mapping.")

        copied_options = dict(self.options)
        for key in copied_options:
            if not isinstance(key, str) or not key.strip():
                raise ValueError("Source option names must be non-empty strings.")
        object.__setattr__(
            self, "options", MappingProxyType(copied_options)
        )


@runtime_checkable
class SourceAdapter(Protocol):
    """Common streaming interface implemented by every source adapter."""

    format_name: str

    def iter_records(self, source: SourceSpec) -> Iterator[RawRecord]:
        """Yield raw source records without canonical transformation."""
        ...


def validate_source_adapter(adapter: Any) -> None:
    """Fail early when an adapter does not satisfy the shared contract."""
    format_name = getattr(adapter, "format_name", None)
    if not isinstance(format_name, str) or not format_name.strip():
        raise TypeError("Source adapter must define a non-empty format_name.")
    if not callable(getattr(adapter, "iter_records", None)):
        raise TypeError("Source adapter must implement iter_records(source).")
