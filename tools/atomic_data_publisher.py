"""Atomic publication of canonical real datasets through Elasticsearch aliases.

Bulk requests are not transactions. This publisher writes a complete candidate
snapshot to a private versioned index, validates it, and then atomically changes
the stable Registry name from the old physical index to the new one.
"""
from __future__ import annotations

import threading
import uuid
from collections.abc import Iterable, Mapping
from typing import Any

from elasticsearch.helpers import bulk

from tools.data_ingestion import validate_collection_manifest
from tools.data_normalization import normalize_real_record
from tools.dataset_registry import get_dataset_index, get_dataset_profile


_PUBLISH_LOCK = threading.RLock()


def _body(response: Any) -> Any:
    return getattr(response, "body", response)


def _manifest_issues(manifest: Any) -> list[dict[str, str]]:
    if not isinstance(manifest, Mapping):
        return [{
            "code": "INVALID_MANIFEST",
            "message": "Collection manifest must be a JSON object.",
        }]
    # Validate required metadata without materializing the incoming iterable.
    return validate_collection_manifest(manifest, [])


def _canonical_mapping(dataset_id: str) -> dict[str, Any]:
    profile = get_dataset_profile(dataset_id)
    properties = {
        field: {"type": config["type"]}
        for field, config in profile.get("fields", {}).items()
        if config.get("type")
    }

    provenance_contract = profile.get("provenance_contract", {})
    timestamp_fields = {"observed_at", "published_at", "valid_from", "valid_until"}
    for field in (
        list(provenance_contract.get("required_fields", []))
        + list(provenance_contract.get("optional_fields", []))
    ):
        properties[field] = {
            "type": "date" if field in timestamp_fields else "keyword"
        }

    properties["data_classification"] = {"type": "keyword"}
    return {"dynamic": "strict", "properties": properties}


def _merge_canonical_mapping(
    existing_mapping: dict[str, Any],
    dataset_id: str,
) -> dict[str, Any]:
    """Add newly required canonical fields without changing existing mappings."""
    mapping = {
        **existing_mapping,
        "properties": dict(existing_mapping.get("properties", {})),
    }
    expected_properties = _canonical_mapping(dataset_id)["properties"]

    for field, expected in expected_properties.items():
        existing = mapping["properties"].get(field)
        if existing is None:
            mapping["properties"][field] = expected
            continue
        if existing.get("type") != expected["type"]:
            raise RuntimeError(
                f"Existing real-index mapping for '{field}' is "
                f"'{existing.get('type')}', but the canonical contract requires "
                f"'{expected['type']}'. A reviewed migration is required."
            )

    return mapping


def _current_alias_target(client: Any, alias: str) -> str | None:
    if not client.indices.exists_alias(name=alias):
        if client.indices.exists(index=alias):
            raise RuntimeError(
                f"'{alias}' is a concrete index, not an alias. "
                "A reviewed one-time migration is required before atomic publication."
            )
        return None

    aliases = _body(client.indices.get_alias(name=alias))
    if len(aliases) != 1:
        raise RuntimeError(
            f"Alias '{alias}' must point to exactly one physical index; "
            f"found {len(aliases)}."
        )
    index_name, metadata = next(iter(aliases.items()))
    alias_config = (metadata.get("aliases") or {}).get(alias) or {}
    if alias_config:
        raise RuntimeError(
            f"Alias '{alias}' has filters or routing options. "
            "Atomic publisher will not silently discard alias behavior."
        )
    return index_name


def _flush_actions(client: Any, actions: list[dict[str, Any]]) -> int:
    if not actions:
        return 0
    indexed, errors = bulk(
        client,
        actions,
        raise_on_error=False,
        stats_only=False,
        refresh=False,
    )
    if errors:
        error = RuntimeError(
            f"Staging bulk failed: {len(errors)} Elasticsearch error(s); "
            f"{indexed} operation(s) succeeded in the unpublished staging index."
        )
        error.indexed_count = indexed
        error.errors = errors
        raise error
    if indexed != len(actions):
        raise RuntimeError(
            f"Staging bulk count mismatch: expected {len(actions)}, got {indexed}."
        )
    return indexed


def ingest_real_records_atomically(
    client: Any,
    dataset_id: str,
    records: Iterable[Mapping[str, Any]],
    manifest: Mapping[str, Any],
    *,
    batch_size: int = 500,
) -> dict[str, Any]:
    """Validate, stage, and atomically publish a real-data snapshot.

    Existing real data is copied into the candidate snapshot before new records
    are applied. The stable Registry index name is an alias after first publish.
    Old physical versions are retained for rollback and are never auto-deleted.

    Run one publisher process per dataset at a time. The in-process lock prevents
    overlapping publications from this process; external multi-process writers
    must coordinate at the deployment layer.
    """
    if not isinstance(batch_size, int) or isinstance(batch_size, bool) or batch_size < 1:
        raise ValueError("batch_size must be a positive integer.")

    manifest_issues = _manifest_issues(manifest)
    if manifest_issues:
        error = ValueError(
            f"Collection manifest rejected with {len(manifest_issues)} issue(s)."
        )
        error.issues = manifest_issues
        raise error

    profile = get_dataset_profile(dataset_id)
    target_alias = get_dataset_index(dataset_id, "real")
    id_fields = profile.get("document_id_fields") or (
        [profile["primary_key"]] if profile.get("primary_key") else []
    )
    if not id_fields:
        raise ValueError(f"Dataset '{dataset_id}' has no registered document identity.")

    with _PUBLISH_LOCK:
        previous_index = _current_alias_target(client, target_alias)
        staging_index = f"{target_alias}__v_{uuid.uuid4().hex[:16]}"
        published = False

        try:
            if previous_index:
                old_mapping_response = _body(
                    client.indices.get_mapping(index=previous_index)
                )
                old_mapping = old_mapping_response[previous_index]["mappings"]
                compatible_mapping = _merge_canonical_mapping(
                    old_mapping, dataset_id
                )
                client.indices.create(
                    index=staging_index, mappings=compatible_mapping
                )

                copied = _body(client.reindex(
                    source={"index": previous_index},
                    dest={"index": staging_index},
                    wait_for_completion=True,
                    refresh=True,
                ))
                if copied.get("failures"):
                    raise RuntimeError(
                        f"Could not copy the current real dataset into staging: "
                        f"{len(copied['failures'])} reindex failure(s)."
                    )
                base_count = int(copied.get("created", 0)) + int(copied.get("updated", 0))
            else:
                client.indices.create(
                    index=staging_index,
                    mappings=_canonical_mapping(dataset_id),
                )
                base_count = 0

            seen_ids: set[str] = set()
            actions: list[dict[str, Any]] = []
            processed = 0
            indexed = 0
            batch_id = manifest["collection_batch"]

            for position, source_record in enumerate(records):
                if not isinstance(source_record, Mapping):
                    raise ValueError(
                        f"Record at position {position} is not a JSON object."
                    )
                if source_record.get("collection_batch") != batch_id:
                    error = ValueError(
                        f"Record at position {position} has a collection_batch "
                        "different from the manifest."
                    )
                    error.issues = [{
                        "code": "COLLECTION_BATCH_MISMATCH",
                        "field": "collection_batch",
                        "record_id": str(position),
                        "message": str(error),
                    }]
                    raise error

                source_identity = [
                    source_record.get(field) for field in id_fields
                ]
                record_id = "::".join(
                    str(value).strip()
                    for value in source_identity
                    if value is not None and str(value).strip()
                ) or str(position)

                normalized, issues = normalize_real_record(
                    dataset_id, source_record, record_id=record_id
                )
                if issues:
                    error = ValueError(
                        f"Record '{record_id}' violates the canonical dataset contract."
                    )
                    error.issues = issues
                    raise error

                identity_values = [normalized.get(field) for field in id_fields]
                if any(
                    not isinstance(value, (str, int))
                    or isinstance(value, bool)
                    or not str(value).strip()
                    for value in identity_values
                ):
                    error = ValueError(
                        f"Record '{record_id}' is missing registered identity fields."
                    )
                    error.issues = [{
                        "code": "MISSING_PRIMARY_KEY",
                        "field": ",".join(id_fields),
                        "record_id": record_id,
                        "message": str(error),
                    }]
                    raise error

                document_id = "::".join(
                    str(value).strip() for value in identity_values
                )
                if document_id in seen_ids:
                    error = ValueError(
                        f"Duplicate document identity '{document_id}' in collection batch."
                    )
                    error.issues = [{
                        "code": "DUPLICATE_PRIMARY_KEY",
                        "field": ",".join(id_fields),
                        "record_id": document_id,
                        "message": str(error),
                    }]
                    raise error
                seen_ids.add(document_id)

                actions.append({
                    "_op_type": "index",
                    "_index": staging_index,
                    "_id": document_id,
                    "_source": normalized,
                })
                processed += 1

                if len(actions) >= batch_size:
                    indexed += _flush_actions(client, actions)
                    actions = []

            indexed += _flush_actions(client, actions)
            if processed == 0:
                raise ValueError("At least one record is required for ingestion.")
            if indexed != processed:
                raise RuntimeError(
                    f"Indexed count mismatch: processed {processed}, indexed {indexed}."
                )

            client.indices.refresh(index=staging_index)
            staged_count_response = _body(client.count(index=staging_index))
            staged_count = int(staged_count_response.get("count", -1))
            if staged_count < base_count or staged_count > base_count + processed:
                raise RuntimeError(
                    "Staging index count is inconsistent with the previous snapshot "
                    f"and incoming batch (base={base_count}, incoming={processed}, "
                    f"staged={staged_count})."
                )

            # Re-check the publication base before the atomic alias switch.
            if _current_alias_target(client, target_alias) != previous_index:
                raise RuntimeError(
                    f"Alias '{target_alias}' changed during ingestion; "
                    "candidate snapshot was not published."
                )

            alias_actions = []
            if previous_index:
                alias_actions.append({
                    "remove": {"index": previous_index, "alias": target_alias}
                })
            alias_actions.append({
                "add": {"index": staging_index, "alias": target_alias}
            })
            result = _body(client.indices.update_aliases(actions=alias_actions))
            if result.get("acknowledged") is False:
                raise RuntimeError("Elasticsearch did not acknowledge the alias switch.")

            published = True
            return {
                "dataset_id": dataset_id,
                "classification": "real",
                "index": target_alias,
                "physical_index": staging_index,
                "previous_physical_index": previous_index,
                "collection_batch": batch_id,
                "processed_records": processed,
                "indexed_records": indexed,
                "total_records": staged_count,
                "publication": "atomic_alias_switch",
                "previous_version_retained": previous_index is not None,
            }
        finally:
            if not published:
                # The alias API may have completed even if its response was lost.
                # Confirm the live target before considering candidate cleanup.
                try:
                    active_index = _current_alias_target(client, target_alias)
                except Exception:
                    active_index = staging_index  # Unknown state: never risk deleting it.
                if active_index != staging_index:
                    try:
                        if client.indices.exists(index=staging_index):
                            client.indices.delete(index=staging_index)
                    except Exception:
                        # Preserve the original exception; an orphan staging index is
                        # safer than masking the cause or touching the published alias.
                        pass
