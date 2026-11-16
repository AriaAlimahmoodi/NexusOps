"""Acquire raw ESCO taxonomy and Remotive jobs without indexing or normalization.

Run from the repository root:
    python -m scripts.acquire_global_labor_datasets --source esco
    python -m scripts.acquire_global_labor_datasets --source remotive
    python -m scripts.acquire_global_labor_datasets --source all

ESCO paging is resumable: completed page JSON files are reused. Remotive is
requested once per run at most, and an existing snapshot is reused unless
--refresh-remotive is explicitly supplied.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from tools.source_connectors import ESCOClient, RemotiveClient


ROOT = Path(__file__).resolve().parents[1]
RAW_ROOT = ROOT / "data" / "raw"
ESCO_VERSION = "api-default"
ESCO_SCHEMES = {
    "skills": "http://data.europa.eu/esco/concept-scheme/skills",
    "occupations": "http://data.europa.eu/esco/concept-scheme/occupations",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_json_atomic(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    with temporary.open("w", encoding="utf-8", newline="\n") as stream:
        json.dump(payload, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
    temporary.replace(path)


def embedded_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract the HAL embedded resource list without changing raw payloads."""
    embedded = payload.get("_embedded")
    if not isinstance(embedded, dict):
        raise ValueError(
            "ESCO response is not a recognized HAL collection: "
            "missing object '_embedded'. Raw page has been retained."
        )

    # ESCO collection responses embed resources as {concept_uri: resource};
    # some HAL endpoints instead use named lists. Support both shapes, but
    # prefer URI-keyed resource objects and exclude ancillary embedded lists.
    uri_keyed_items = [
        value for value in embedded.values()
        if isinstance(value, dict) and isinstance(value.get("uri"), str)
    ]
    if uri_keyed_items:
        return uri_keyed_items

    candidates: list[list[Any]] = []
    for value in embedded.values():
        if isinstance(value, list) and all(isinstance(item, dict) for item in value):
            candidates.append(value)
    if not candidates:
        raise ValueError(
            "ESCO HAL response has no embedded resource objects. "
            "Raw page has been retained for schema inspection."
        )
    return max(candidates, key=len)


def acquire_esco(
    *,
    language: str = "en",
    page_size: int = 100,
    max_pages: int | None = None,
    delay_seconds: float = 0.25,
) -> dict[str, Any]:
    if not 1 <= page_size <= 100:
        raise ValueError("page_size must be between 1 and 100")
    if max_pages is not None and max_pages < 1:
        raise ValueError("max_pages must be positive")
    if delay_seconds < 0:
        raise ValueError("delay_seconds cannot be negative")

    client = ESCOClient()
    summaries: dict[str, Any] = {}

    for kind, scheme_uri in ESCO_SCHEMES.items():
        dataset_dir = (
            RAW_ROOT / "esco" / ESCO_VERSION / language / kind
        )
        dataset_dir.mkdir(parents=True, exist_ok=True)
        page_count = 0
        record_count = 0
        complete = False
        started_at = utc_now()

        page_number = 0
        while max_pages is None or page_number < max_pages:
            page_path = dataset_dir / f"page_{page_number:05d}.json"
            if page_path.exists():
                with page_path.open("r", encoding="utf-8") as stream:
                    payload = json.load(stream)
            else:
                if page_number:
                    time.sleep(delay_seconds)
                if kind == "skills":
                    payload = client.get_skills_by_scheme(
                        scheme_uri=scheme_uri,
                        language=language,
                        limit=page_size,
                        offset=page_number * page_size,
                        selected_version=None,
                    )
                else:
                    payload = client.get_occupations_by_scheme(
                        scheme_uri=scheme_uri,
                        language=language,
                        limit=page_size,
                        offset=page_number,
                        selected_version=ESCO_VERSION,
                    )
                write_json_atomic(page_path, payload)

            items = embedded_items(payload)
            page_count += 1
            record_count += len(items)
            print(
                f"ESCO {kind}: page={page_number} "
                f"records={len(items)} cumulative={record_count}"
            )

            response_offset = payload.get("offset", page_number * page_size)
            response_total = payload.get("total")
            if isinstance(response_total, int):
                complete = response_offset + len(items) >= response_total
            else:
                complete = len(items) < page_size
            if complete:
                break
            page_number += 1

        page_files = sorted(dataset_dir.glob("page_*.json"))
        summary = {
            "provider": "ESCO",
            "dataset": kind,
            "version": ESCO_VERSION,
            "version_note": (
                "API default; selectedVersion omitted because explicit version "
                "parameters returned HTTP 500 in the observed API response."
            ),
            "language": language,
            "scheme_uri": scheme_uri,
            "endpoint": (
                "GET /resource/skill" if kind == "skills"
                else "GET /resource/occupation"
            ),
            "page_size": page_size,
            "pages_processed_this_run": page_count,
            "page_files_present": len(page_files),
            "records_processed_this_run": record_count,
            "complete": complete,
            "started_at": started_at,
            "finished_at": utc_now(),
            "raw_directory": str(dataset_dir.relative_to(RAW_ROOT)),
            "page_checksums": {
                path.name: sha256_file(path) for path in page_files
            },
        }
        write_json_atomic(dataset_dir / "manifest.json", summary)
        summaries[kind] = summary
        if not complete:
            print(
                f"ESCO {kind}: partial acquisition; rerun the same command "
                "to continue from the next page."
            )

    return summaries


def acquire_remotive(*, refresh: bool = False) -> dict[str, Any]:
    dataset_dir = RAW_ROOT / "remotive"
    raw_path = dataset_dir / "remote_jobs.json"
    manifest_path = dataset_dir / "manifest.json"

    if raw_path.exists() and not refresh:
        with raw_path.open("r", encoding="utf-8") as stream:
            payload = json.load(stream)
        print("Remotive: existing raw snapshot reused; no API request made.")
    else:
        # One unfiltered request obtains the provider's complete active feed.
        payload = RemotiveClient().get_jobs()
        write_json_atomic(raw_path, payload)
        print(f"Remotive: fetched {len(payload['jobs'])} active jobs.")

    jobs = payload.get("jobs")
    if not isinstance(jobs, list):
        raise ValueError("Remotive response does not contain a jobs array.")

    summary = {
        "provider": "Remotive",
        "dataset": "active_remote_job_postings",
        "endpoint": "GET https://remotive.com/api/remote-jobs",
        "filters": {},
        "job_count_reported": payload.get("job-count"),
        "records_saved": len(jobs),
        "fetched_or_reused_at": utc_now(),
        "raw_file": str(raw_path.relative_to(RAW_ROOT)),
        "sha256": sha256_file(raw_path),
        "complete_for_provider_response": True,
        "scope_note": (
            "Active listings returned by Remotive at acquisition time; "
            "not a historical archive or a census of the global labor market."
        ),
        "attribution_requirement": (
            "Preserve Remotive as source and each job's original Remotive URL."
        ),
        "rate_limit_note": "Provider advises a maximum of four API requests per day.",
    }
    write_json_atomic(manifest_path, summary)
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source", choices=("esco", "remotive", "all"), default="all"
    )
    parser.add_argument("--language", default="en")
    parser.add_argument("--page-size", type=int, default=100)
    parser.add_argument("--max-pages", type=int, default=None)
    parser.add_argument("--delay-seconds", type=float, default=0.25)
    parser.add_argument(
        "--refresh-remotive", action="store_true",
        help="Make a new Remotive API request even if a snapshot already exists.",
    )
    args = parser.parse_args()

    result: dict[str, Any] = {
        "status": "started",
        "started_at": utc_now(),
        "source": args.source,
        "raw_root": str(RAW_ROOT),
        "datasets": {},
    }
    if args.source in {"esco", "all"}:
        result["datasets"]["esco"] = acquire_esco(
            language=args.language,
            page_size=args.page_size,
            max_pages=args.max_pages,
            delay_seconds=args.delay_seconds,
        )
    if args.source in {"remotive", "all"}:
        result["datasets"]["remotive"] = acquire_remotive(
            refresh=args.refresh_remotive
        )

    result["status"] = "completed"
    result["finished_at"] = utc_now()
    write_json_atomic(RAW_ROOT / "global_labor_acquisition_manifest.json", result)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
