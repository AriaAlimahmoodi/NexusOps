from __future__ import annotations

from ast import arguments
from dataclasses import dataclass, field
from datetime import datetime, timezone
import json
from typing import Any
from uuid import uuid4

from numpy import record


VALID_EVIDENCE_TYPES = {
    "tool_verified",
    "user_provided",
    "calculated",
    "unknown",
}

def build_request_signature(
    tool_name: str,
    arguments: dict[str, Any],
) -> str:
    """
    Build a stable signature for the exact MCP request.
    """
    return (
        tool_name
        + "|"
        + json.dumps(
            arguments,
            sort_keys=True,
            ensure_ascii=False,
            separators=(",", ":"),
        )
    )




@dataclass
class MemoryRecord:
    """
    One immutable-style structured memory record.

    The record stores exact information and its evidence status.
    """

    memory_id: str
    record_type: str
    data: Any
    evidence: str
    source: dict[str, Any] = field(default_factory=dict)
    created_at: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)
    status: str = "active"


    def __post_init__(self) -> None:
        if self.evidence not in VALID_EVIDENCE_TYPES:
            raise ValueError(f"Invalid evidence type: {self.evidence}")

        if self.status not in {"active", "superseded"}:
            raise ValueError(f"Invalid memory status: {self.status}")

        if not self.created_at:
            self.created_at = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> dict[str, Any]:
        return {
            "memory_id": self.memory_id,
            "record_type": self.record_type,
            "data": self.data,
            "evidence": self.evidence,
            "source": self.source,
            "created_at": self.created_at,
            "metadata": self.metadata,
            "status": self.status,
        }

class StructuredMemory:
    """
    Generic structured memory for exact project information.

    This class does not interpret or summarize stored data.
    """

    def __init__(self) -> None:
        self._records: dict[str, MemoryRecord] = {}

    def add(
        self,
        *,
        record_type: str,
        data: Any,
        evidence: str,
        source: dict[str, Any] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> MemoryRecord:
        """
        Store one structured memory record.
        """

        if evidence not in VALID_EVIDENCE_TYPES:
            raise ValueError(
                f"Invalid evidence type: {evidence}"
            )

        record = MemoryRecord(
            memory_id=f"mem_{uuid4().hex}",
            record_type=record_type,
            data=data,
            evidence=evidence,
            source=source or {},
            metadata=metadata or {},
        )

        self._records[record.memory_id] = record

        return record

    def get(self, memory_id: str) -> MemoryRecord | None:
        """
        Retrieve one record by memory ID.
        """

        return self._records.get(memory_id)

    def all(self) -> list[MemoryRecord]:
        return list(self._records.values())

    def active_records(self) -> list[MemoryRecord]:
        """
        Return only currently active memory records.
        """
        return [
            record
            for record in self._records.values()
            if record.status == "active"
        ]

    def mark_superseded(
        self,
        memory_id: str,
        superseded_by: str,
    ) -> bool:
        """
        Mark a memory record as superseded by a newer record.
        """
        record = self._records.get(memory_id)

        if record is None:
            return False

        record.status = "superseded"
        record.metadata["superseded_by"] = superseded_by

        return True

    def find_by_type(
        self,
        record_type: str,
    ) -> list[MemoryRecord]:
        """
        Return records matching a specific type.
        """

        return [
            record
            for record in self._records.values()
            if record.record_type == record_type
        ]

    def find_by_tool(
        self,
        tool_name: str,
    ) -> list[MemoryRecord]:
        """
        Return tool results produced by a specific MCP tool.
        """

        return [
            record
            for record in self._records.values()
            if record.source.get("tool") == tool_name
        ]
    def find_by_source(
        self,
        *,
        kind: str | None = None,
        tool: str | None = None,
    ) -> list[MemoryRecord]:
        """
        Find records by their source metadata.

        This method only retrieves stored records.
        It does not interpret or modify their data.
        """

        results = []

        for record in self._records.values():
            source = record.source

            if kind is not None and source.get("kind") != kind:
                continue

            if tool is not None and source.get("tool") != tool:
                continue

            results.append(record)

            return results
    def active_records(self) -> list[MemoryRecord]:
            return [
              record
         for record in self._records.values()
          if record.status == "active"
         ]


    def mark_superseded(self, memory_id: str, superseded_by: str) -> bool:
            record = self._records.get(memory_id)

            if record is None:
             return False

            record.status = "superseded"
            record.metadata["superseded_by"] = superseded_by

            return True


    def find_active_by_tool(
                self,
                tool_name: str,
                ) -> list[MemoryRecord]:
             return [
                 record
                 for record in self._records.values()
                 if record.status == "active"
                 and record.source.get("kind") == "mcp"
                 and record.source.get("tool") == tool_name
                ]
    def find_conflicts(
        self,
        source_kind: str | None = None,
        tool_name: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Find conflicting structured records.

        Records are considered conflicting when they come from the same
        tool and contain the same logical entity with different values.
        This method does not choose a winner.
        """
        records = list(self._records.values())

        if source_kind is not None:
            records = [
                record
                for record in records
                if record.source.get("kind") == source_kind
            ]

        if tool_name is not None:
            records = [
                record
                for record in records
                if record.source.get("tool") == tool_name
            ]

        conflicts = []

        for index, first in enumerate(records):
            for second in records[index + 1:]:
                if first.record_type != second.record_type:
                    continue

                first_data = first.data
                second_data = second.data

                if not isinstance(first_data, dict):
                    continue

                if not isinstance(second_data, dict):
                    continue

                first_results = first_data.get("results")
                second_results = second_data.get("results")

                if not isinstance(first_results, list):
                    continue

                if not isinstance(second_results, list):
                    continue

                for first_item in first_results:
                    if not isinstance(first_item, dict):
                        continue

                    for second_item in second_results:
                        if not isinstance(second_item, dict):
                            continue

                        first_skill = (
                            first_item.get("ranked_skill")
                            or first_item.get("skill")
                        )

                        second_skill = (
                            second_item.get("ranked_skill")
                            or second_item.get("skill")
                        )

                        if not first_skill or not second_skill:
                            continue

                        if str(first_skill).lower() != str(
                            second_skill
                        ).lower():
                            continue

                        differing_fields = {}

                        for field_name in (
                            "market_demand",
                            "course_coverage",
                            "market_gap",
                            "associated_course_id",
                            "associated_course_name",
                        ):
                            first_value = first_item.get(field_name)
                            second_value = second_item.get(field_name)

                            if (
                                first_value is not None
                                and second_value is not None
                                and first_value != second_value
                            ):
                                differing_fields[field_name] = {
                                    "record_1": first_value,
                                    "record_2": second_value,
                                }

                        if differing_fields:
                            conflicts.append(
                                {
                                    "entity": first_skill,
                                    "record_1": first.memory_id,
                                    "record_2": second.memory_id,
                                    "differing_fields": differing_fields,
                                }
                            )

        return conflicts    
    def clear(self) -> None:
        """
        Remove all structured memory.
        """

        self._records.clear()

    def count(self) -> int:
        """
        Return number of stored records.
        """

        return len(self._records)

    def to_list(self) -> list[dict[str, Any]]:
        """
        Export all records as dictionaries.
        """

        return [
            record.to_dict()
            for record in self._records.values()
        ]
    def mark_superseded(
        self,
        memory_id: str,
        superseded_by: str,
    ) -> bool:
        """
        Mark a memory record as superseded by a newer record.
        """
        record = self._records.get(memory_id)

        if record is None:
            return False

        record.status = "superseded"
        record.metadata["superseded_by"] = superseded_by

        return True
class MemoryManager:
    """
    High-level manager for structured memory.

    This layer manages retrieval and basic evidence-aware access.
    It does not invent, summarize, or reinterpret stored data.
    """

    def __init__(
        self,
        structured_memory: StructuredMemory | None = None,
    ) -> None:
        self.structured_memory = (
            structured_memory or StructuredMemory()
        )

    def store_tool_result(
        self,
        tool_name: str,
        arguments: dict[str, Any],
        data: Any,
    ) -> MemoryRecord:
        """Store a verified MCP tool result.

        Results from the same tool with the same arguments represent
        the same logical request scope. A newer result supersedes the
        previous active result for that exact request scope.
        """
        request_signature = build_request_signature(
            tool_name=tool_name,
            arguments=arguments,
        )
        existing_records = self.structured_memory.all()

        records_to_supersede = []

        for record in existing_records:
            if record.status != "active":
                continue

            if record.source.get("kind") != "mcp":
                continue

            if record.source.get("tool") != tool_name:
                continue

            existing_signature = record.metadata.get(
                "request_signature"
            )

            if existing_signature != request_signature:
                continue

            records_to_supersede.append(record)

        source = {
            "kind": "mcp",
            "tool": tool_name,
        }

        metadata = {
            "arguments": arguments,
            "request_signature": request_signature,
        }

        new_record = self.structured_memory.add(
            record_type="tool_result",
            data=data,
            evidence="tool_verified",
            source=source,
            metadata=metadata,
        )

        for record in records_to_supersede:
            self.structured_memory.mark_superseded(
                memory_id=record.memory_id,
                superseded_by=new_record.memory_id,
            )

        return new_record

    def store_calculation(
        self,
        *,
        operation: str,
        inputs: dict[str, Any],
        result: Any,
        formula: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> MemoryRecord:
        """
        Store a reproducible calculation.
        """

        data = {
            "operation": operation,
            "inputs": inputs,
            "result": result,
            "formula": formula,
        }

        return self.structured_memory.add(
            record_type="calculation",
            data=data,
            evidence="calculated",
            source={
                "kind": "internal_calculation",
            },
            metadata=metadata or {},
        )

    def store_user_fact(
        self,
        *,
        data: Any,
        metadata: dict[str, Any] | None = None,
    ) -> MemoryRecord:
        """
        Store information explicitly provided by the user.
        """

        return self.structured_memory.add(
            record_type="user_fact",
            data=data,
            evidence="user_provided",
            source={
                "kind": "user",
            },
            metadata=metadata or {},
        )

    def get_tool_results(
        self,
        tool_name: str | None = None,
    ) -> list[MemoryRecord]:
        """
        Retrieve stored MCP tool results.

        If tool_name is provided, only results from that tool
        are returned.
        """

        if tool_name:
            return self.structured_memory.find_by_tool(
                tool_name
            )

        return self.structured_memory.find_by_type(
            "tool_result"
        )
    def find_records(
        self,
        record_type: str | None = None,
        source_kind: str | None = None,
        tool_name: str | None = None,
        active_only: bool = True,
    ) -> list[MemoryRecord]:
        """
        Find structured memory records.

        By default, only active records are returned.
        Historical superseded records can be requested with
        active_only=False.
        """

        records = self.structured_memory.all()

        if active_only:
            records = [
                record
                for record in records
                if record.status == "active"
            ]

        if record_type is not None:
            records = [
                record
                for record in records
                if record.record_type == record_type
            ]

        if source_kind is not None:
            records = [
                record
                for record in records
                if record.source.get("kind") == source_kind
            ]

        if tool_name is not None:
            records = [
                record
                for record in records
                if record.source.get("tool") == tool_name
            ]

        return records

    def get_verified_tool_results(
        self,
        source_kind: str | None = None,
        tool_name: str | None = None,
    ) -> list[MemoryRecord]:
        """
        Return only active, verified tool results.
        """

        records = self.find_records(
            record_type="tool_result",
            source_kind=source_kind,
            tool_name=tool_name,
            active_only=True,
        )

        return [
            record
            for record in records
            if record.evidence == "tool_verified"
            and record.status == "active"
        ]

    def get_conflicts(
        self,
        source_kind: str | None = None,
        tool_name: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Return detected conflicts without resolving them.
        """
        return self._structured_memory.find_conflicts(
            source_kind=source_kind,
            tool_name=tool_name,
        )
    def get_calculations(self) -> list[MemoryRecord]:
        """
        Retrieve stored calculations.
        """

        return self.structured_memory.find_by_type(
            "calculation"
        )

    def get_user_facts(self) -> list[MemoryRecord]:
        """
        Retrieve explicitly user-provided facts.
        """

        return self.structured_memory.find_by_type(
            "user_fact"
        )

    def get_all(self) -> list[MemoryRecord]:
        """
        Retrieve all structured memory records.
        """

        return self.structured_memory.all()

    def clear(self) -> None:
        """
        Clear all structured memory.
        """

        self.structured_memory.clear()

    def count(self) -> int:
        """
        Return total number of structured memory records.
        """

        return self.structured_memory.count()

    def _resolve_conflicts_after_refresh(
         self,
         new_record: MemoryRecord,
         tool_name: str,
        ) -> None:

        active_records = self._structured_memory.find_active_by_tool(
           tool_name
        )

        for old_record in active_records:

         if old_record.memory_id == new_record.memory_id:
            continue

         if not self._records_overlap(
            old_record,
            new_record,
        ):
            continue

         if self._records_are_equal(
            old_record,
            new_record,
       ):
            old_record.status = "superseded"
            old_record.metadata["superseded_by"] = (
                new_record.memory_id
            )
            continue

        old_record.status = "superseded"
        old_record.metadata["superseded_by"] = (
            new_record.memory_id
        )
        old_record.metadata["superseded_reason"] = (
            "fresh_mcp_refresh"
        )

        def _records_overlap(
            self,
            first: MemoryRecord,
            second: MemoryRecord,
         ) -> bool:

           first_results = (
           first.data.get("results")
           if isinstance(first.data, dict)
           else None
        )

           second_results = (
            second.data.get("results")
            if isinstance(second.data, dict)
            else None
         )

           if not isinstance(first_results, list):
              return False

           if not isinstance(second_results, list):
             return False

           first_entities = {
             item.get("ranked_skill") or item.get("skill")
             for item in first_results
             if isinstance(item, dict)
            }

           second_entities = {
            item.get("ranked_skill") or item.get("skill")
            for item in second_results
            if isinstance(item, dict)
            }

           first_entities.discard(None)
           second_entities.discard(None)
 
           return bool(first_entities & second_entities)

    def _records_are_equal(
    self,
    first: MemoryRecord,
    second: MemoryRecord,
       ) -> bool:
       return first.data == second.data

    def build_request_signature(
       self,
       tool_name: str,
       arguments: dict[str, Any],
       ) -> str:
          return (
          tool_name
           + "::"
          + json.dumps(
            arguments,
            sort_keys=True,
            ensure_ascii=False,
            separators=(",", ":"),
          )
       )