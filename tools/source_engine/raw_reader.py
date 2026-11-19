"""Offline, integrity-checked reader for Universal API Engine raw pages."""
from __future__ import annotations

import hashlib
import json
from collections.abc import Iterator, Mapping
from pathlib import Path
from typing import Any


class RawSourceIntegrityError(ValueError):
    """Raw acquisition evidence is incomplete, unsafe, or altered."""


def _read_json(path: Path) -> Any:
    try:
        with path.open("r", encoding="utf-8") as stream:
            return json.load(stream)
    except (OSError, json.JSONDecodeError) as exc:
        raise RawSourceIntegrityError(
            f"Cannot read {path.name} ({type(exc).__name__})."
        ) from None


def _fingerprint(config: Mapping[str, Any]) -> str:
    payload = json.dumps(
        config, sort_keys=True, separators=(",", ":")
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _resolve_path(document: Any, dotted_path: str) -> Any:
    if not isinstance(dotted_path, str) or not dotted_path.strip():
        raise RawSourceIntegrityError("response.records_path is required.")
    value = document
    for part in dotted_path.split("."):
        if isinstance(value, Mapping) and part in value:
            value = value[part]
        elif isinstance(value, list) and part.isdigit() and int(part) < len(value):
            value = value[int(part)]
        else:
            raise RawSourceIntegrityError(
                f"Configured records_path is missing: {dotted_path}."
            )
    return value


def _contained_file(root: Path, path: Path) -> Path:
    if path.is_symlink():
        raise RawSourceIntegrityError("Symlinks are not allowed in raw acquisitions.")
    root_real = root.resolve(strict=True)
    try:
        path_real = path.resolve(strict=True)
    except FileNotFoundError:
        raise RawSourceIntegrityError(
            f"Raw page file is missing: {path.name}."
        ) from None
    except OSError as exc:
        raise RawSourceIntegrityError(
            f"Cannot resolve raw page {path.name} ({type(exc).__name__})."
        ) from None
    if root_real not in path_real.parents:
        raise RawSourceIntegrityError("Raw page path escapes its acquisition directory.")
    return path_real


def iter_raw_api_records(
    raw_directory: str | Path,
    source_config: Mapping[str, Any],
    *,
    allow_partial: bool = False,
    verify_hashes: bool = True,
) -> Iterator[dict[str, Any]]:
    """Yield records from saved pages only; this function performs no HTTP calls."""
    if not isinstance(source_config, Mapping):
        raise TypeError("source_config must be a mapping.")
    source_id = source_config.get("id")
    if not isinstance(source_id, str) or not source_id.strip():
        raise ValueError("source_config.id must be a non-empty string.")

    root = Path(raw_directory)
    if not root.is_dir() or root.is_symlink():
        raise RawSourceIntegrityError("Raw acquisition directory is missing or unsafe.")
    manifest_path = _contained_file(root, root / "manifest.json")
    checkpoint_path = _contained_file(root, root / "checkpoint.json")
    manifest = _read_json(manifest_path)
    checkpoint = _read_json(checkpoint_path)
    if not isinstance(manifest, Mapping) or not isinstance(checkpoint, Mapping):
        raise RawSourceIntegrityError("Manifest and checkpoint must be JSON objects.")

    status = manifest.get("status")
    if status != "completed" and not (allow_partial and status == "partial"):
        raise RawSourceIntegrityError(f"Acquisition status is not eligible: {status}.")
    if manifest.get("source_id") != source_id or checkpoint.get("source_id") != source_id:
        raise RawSourceIntegrityError("Source id does not match acquisition evidence.")
    if checkpoint.get("config_fingerprint") != _fingerprint(source_config):
        raise RawSourceIntegrityError("Source configuration fingerprint mismatch.")
    if checkpoint.get("status") != status:
        raise RawSourceIntegrityError("Manifest and checkpoint statuses differ.")
    if manifest.get("raw_pages_preserved") is not True:
        raise RawSourceIntegrityError("Raw response pages were not preserved.")

    hashes = manifest.get("page_sha256")
    count = manifest.get("pages_completed_total")
    if not isinstance(hashes, Mapping) or not isinstance(count, int) or isinstance(count, bool):
        raise RawSourceIntegrityError("Invalid page hash inventory.")
    if count < 1 or len(hashes) != count:
        raise RawSourceIntegrityError("Page count does not match hash inventory.")
    checkpoint_count = checkpoint.get("pages_completed")
    if (
        not isinstance(checkpoint_count, int)
        or isinstance(checkpoint_count, bool)
        or checkpoint_count != count
    ):
        raise RawSourceIntegrityError(
            "Manifest and checkpoint page counts differ."
        )

    pages = root / "pages"
    if not pages.is_dir() or pages.is_symlink():
        raise RawSourceIntegrityError("Raw pages directory is missing or unsafe.")
    response = source_config.get("response")
    if not isinstance(response, Mapping):
        raise ValueError("source_config.response must be an object.")
    key_mode = response.get("record_key_mode", "array")
    if key_mode not in {"array", "object_values"}:
        raise ValueError("Unsupported response.record_key_mode.")

    # Older acquisitions may omit record totals. Check every total supplied.
    declared_totals = [
        evidence[key]
        for evidence, key in (
            (manifest, "records_saved_total"), (checkpoint, "records_saved")
        )
        if key in evidence
    ]
    if any(type(total) is not int or total < 0 for total in declared_totals):
        raise RawSourceIntegrityError("Invalid saved record count.")
    if len(set(declared_totals)) > 1:
        raise RawSourceIntegrityError("Manifest and checkpoint record counts differ.")

    records_read = 0
    for index in range(count):
        name = f"page_{index:08d}.json"
        expected = hashes.get(name)
        if not isinstance(expected, str) or len(expected) != 64:
            raise RawSourceIntegrityError(f"Missing SHA-256 for {name}.")
        page_path = _contained_file(pages, pages / name)
        if verify_hashes:
            actual = hashlib.sha256(page_path.read_bytes()).hexdigest()
            if actual != expected:
                raise RawSourceIntegrityError(f"SHA-256 mismatch for {name}.")
        document = _read_json(page_path)
        records = _resolve_path(document, response.get("records_path"))
        if key_mode == "object_values":
            if not isinstance(records, Mapping):
                raise RawSourceIntegrityError("object_values requires an object.")
            records = list(records.values())
        if not isinstance(records, list):
            raise RawSourceIntegrityError("records_path must resolve to an array.")
        records_read += len(records)
        for position, record in enumerate(records):
            if not isinstance(record, dict):
                raise RawSourceIntegrityError(
                    f"Record {position} in {name} is not a JSON object."
                )
            yield record

    if declared_totals and records_read != declared_totals[0]:
        raise RawSourceIntegrityError("Raw pages disagree with the saved record count.")
