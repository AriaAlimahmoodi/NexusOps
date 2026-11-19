"""Normalize a scoped curriculum CSV/JSON, compute coverage and optionally publish inputs."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from tools.adapters.base import SourceSpec
from tools.adapters.registry import create_default_adapter_registry
from tools.computational_engine.curriculum import compute_curriculum_coverage
from tools.data_ingestion import prepare_real_records
from tools.source_mapping import SourceMappingSpec, iter_mapped_records

DATASET_ID = "curriculum_catalog"


def _prepare_rows(rows, *, manifest, format_name, published_at, course_types, skill_aliases):
    for row in rows:
        values = dict(row)
        if format_name == "csv" and "skills" in values:
            raw = values["skills"]
            values["skills"] = json.loads(raw) if raw and raw.strip() else None
        course_type = values.get("course_type")
        if isinstance(course_type, str):
            course_type = course_type.strip()
            values["course_type"] = course_types.get(course_type, course_type)
        skills = values.get("skills")
        if isinstance(skills, list) and all(isinstance(skill, str) for skill in skills):
            skills = [skill.strip() for skill in skills]
            values["skills"] = list(dict.fromkeys(skill_aliases.get(skill, skill) for skill in skills))
        if values.get("credits") == "":
            values["credits"] = None
        stamped = {
            **values,
            "source": manifest["source_name"],
            "observed_at": manifest["retrieved_at"],
            "collection_batch": manifest["collection_batch"],
            "time_granularity": "snapshot",
        }
        if published_at is not None:
            stamped["published_at"] = published_at
        yield stamped


def run(config_path, *, apply=False):
    config_path = Path(config_path)
    config = json.loads(config_path.read_text(encoding="utf-8-sig"))
    if config["source_classification"] not in ("real", "synthetic"):
        raise ValueError("source_classification must be real or synthetic.")
    if apply and config["source_classification"] != "real":
        raise ValueError("Publication requires a real source.")

    source_config = config["source"]
    format_name = source_config["format"]
    if format_name not in ("csv", "json"):
        raise ValueError("Use a local CSV or JSON source.")
    locator = config_path.parent / source_config["uri"]

    def source_digest():
        with locator.open("rb") as stream:
            return hashlib.file_digest(stream, "sha256").hexdigest()

    digest = source_digest()
    manifest = dict(config["manifest"])
    batch = manifest["collection_batch"]
    if not isinstance(batch, str) or not batch.strip():
        raise ValueError("Supply a non-empty collection_batch.")
    # Separate updates to the source or mapping from older published snapshots.
    batch_config = {key: value for key, value in config.items() if key != "skill_id"}
    batch_identity = json.dumps({"config": batch_config, "source_sha256": digest}, sort_keys=True)
    manifest["collection_batch"] = hashlib.sha256(batch_identity.encode("utf-8")).hexdigest()
    inventory = config["inventory"]
    vocabulary = config["vocabulary"]
    for label, evidence in (("Inventory", inventory), ("Vocabulary", vocabulary)):
        reference = evidence["reference"]
        if not isinstance(reference, str) or not reference.strip():
            raise ValueError(f"{label} needs a non-empty source reference.")

    course_types = config.get("course_type_values", {})
    skill_aliases = vocabulary.get("aliases", {})
    for name, aliases, targets in (
        ("course_type_values", course_types, {"required", "elective"}),
        ("vocabulary.aliases", skill_aliases, vocabulary["skill_ids"]),
    ):
        if not isinstance(aliases, dict) or any(
            not key.strip() or key != key.strip() or value not in targets
            for key, value in aliases.items()
        ):
            raise ValueError(f"{name} must map source strings to reviewed identifiers.")

    mapping = SourceMappingSpec(dataset_id=DATASET_ID, **config["mapping"])
    if mapping.source_name != manifest["source_name"]:
        raise ValueError("Mapping source_name must match the collection manifest.")
    provenance = {"source", "observed_at", "collection_batch", "time_granularity",
                  "published_at", "valid_from", "valid_until"}
    if provenance.intersection(mapping.field_mappings.values()):
        raise ValueError("Supply collection provenance through the manifest, not field mappings.")

    registry = create_default_adapter_registry()
    source = SourceSpec(str(locator), source_config.get("options", {}))
    raw = registry.iter_records(format_name, source)
    mapped = iter_mapped_records(raw, mapping)
    prepared = prepare_real_records(
        DATASET_ID,
        list(_prepare_rows(
            mapped, manifest=manifest, format_name=format_name,
            published_at=config.get("published_at"), course_types=course_types,
            skill_aliases=skill_aliases,
        )),
        manifest,
    )
    if source_digest() != digest:
        raise ValueError("Input file changed during preparation.")

    metrics = compute_curriculum_coverage(
        prepared, scope=config["scope"], skill_id=config["skill_id"],
        skill_vocabulary=vocabulary["skill_ids"],
        expected_required_course_ids=inventory["required_course_ids"],
    )
    report = {
        "computation_id": "curriculum_coverage",
        "specification_version": "0.2",
        "validation_status": "passed",
        "scope": config["scope"],
        "skill_id": config["skill_id"],
        "input_records": len(prepared),
        "result": metrics,
        "provenance": {
            "source_classification": config["source_classification"],
            "source_reference": manifest["source_url"],
            "source_sha256": digest,
            "collection_batch": manifest["collection_batch"],
            "mapping_id": mapping.mapping_id,
            "mapping_version": mapping.version,
            "review_reference": mapping.review_reference,
            "inventory_reference": inventory["reference"],
            "vocabulary_reference": vocabulary["reference"],
            "computed_at": datetime.now(timezone.utc).isoformat(),
        },
    }
    if apply:
        if metrics["mandatory_course_coverage"]["status"] != "computed":
            raise ValueError("Mandatory course coverage must be computable before publication.")
        from config import get_elasticsearch_client
        from tools.data_ingestion import ingest_real_records

        with get_elasticsearch_client() as client:
            client.info()
            report["input_publication"] = ingest_real_records(client, DATASET_ID, prepared, manifest)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--apply", action="store_true", help="Publish real, validated curriculum inputs.")
    args = parser.parse_args()
    try:
        report = run(args.config, apply=args.apply)
    except (OSError, ValueError, KeyError, TypeError) as error:
        codes = sorted({issue["code"] for issue in getattr(error, "issues", [])})
        detail = f" Validation issue codes: {', '.join(codes)}." if codes else ""
        parser.exit(1, f"{error}{detail}\n")
    print(json.dumps(report, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
