"""Compose registered readers, configured computations and canonical field mappings."""
import hashlib
from pathlib import Path

from tools.adapters.base import SourceSpec
from tools.adapters.registry import create_default_adapter_registry
from tools.computational_engine.field_rules import evaluate_rule
from tools.source_mapping import SourceMappingSpec


def digest_file(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


class DerivedRecords:
    format_name = "mapped_source"

    def __init__(self, reader, config, provenance, digest):
        self.reader = reader
        self.config = config
        self.provenance = provenance
        self.digest = digest

    def iter_records(self, source):
        for pos, raw in enumerate(self.reader.iter_records(source), 1):
            record = dict(raw)
            try:
                scope = self.config.get("scope")
                if scope and record[scope["field"]] not in scope["values"]:
                    continue
                for rule in self.config.get("rules", []):
                    target = rule["output"]
                    if target in record:
                        raise ValueError(f"Derived field collision: {target}")
                    record[target] = evaluate_rule(record, rule)
                yield {**record, **self.provenance}
            except (TypeError, ValueError, KeyError) as err:
                raise ValueError(f"Input row {pos}: {err}") from err
        if digest_file(Path(source.uri)) != self.digest:
            raise ValueError("Source changed while reading")


def build(config, path, observed_at):
    digest = digest_file(path)
    manifest = dict(config["manifest"], retrieved_at=observed_at, collection_batch=digest)
    provenance = dict(source=manifest["source_name"], observed_at=observed_at,
                      collection_batch=digest, time_granularity=config["time_granularity"])
    registry = create_default_adapter_registry()
    adapter = DerivedRecords(registry.get_adapter(config["format"]), config, provenance, digest)
    registry.register(adapter)
    fields = dict(config["fields"])
    fields.update({name: name for name in provenance})
    mapping = SourceMappingSpec(**config["review"], dataset_id=config["dataset"],
                                source_name=manifest["source_name"], field_mappings=fields)
    spec = SourceSpec(str(path), config.get("options", {}))
    return (config["dataset"], adapter.format_name, spec, manifest), dict(
        mapping_spec=mapping, adapter_registry=registry)


