# Phase 10 — Universal ingestion architecture

## Objective

Extend the existing ingestion foundation without creating a parallel pipeline or
changing the five registered canonical datasets. Phase 10 introduces a bounded-
memory source-reading boundary. Source discovery, semantic mapping, canonical
normalization, governance, and atomic publication remain separate responsibilities.

## Existing pipeline components

| Responsibility | Existing component |
|---|---|
| Source profiling | `tools/source_discovery.py` |
| Canonical contracts | `tools/dataset_registry.py` |
| Source-independent projection and type normalization | `tools/data_normalization.py` |
| Provenance and governance validation | `tools/data_governance.py` |
| Batch preparation and manifest checks | `tools/data_ingestion.py` |
| Atomic real-data publication | `tools/atomic_data_publisher.py` |
| Semantic matching | `tools/semantic_matching.py` |
| Optional local-model assistance | `tools/ollama_semantic_assist.py` |

## Phase 10.1 — Streaming CSV source adapter

Implemented in `tools/adapters/csv_adapter.py`.

The adapter:
- reads file-backed CSV sources incrementally; it does not load the full file;
- detects common delimiters or accepts an explicit delimiter;
- supports UTF-8 with BOM by default;
- preserves source headers and raw string values;
- distinguishes missing trailing cells (`None`) from explicit empty cells (`""`);
- skips completely blank rows;
- rejects duplicate/empty headers and extra cells; strict mode also rejects
  missing trailing cells;
- does not rename fields, infer canonical meaning, normalize values, mutate source
  files, or write to Elasticsearch.

The adapter is a raw-source reader, not an approval to ingest any particular
source. A source-specific mapping must be reviewed before records can enter
`normalize_real_record` or the real-data publisher.

## Phase 10.2 — Universal source adapter contract

Implemented in `tools/adapters/base.py` and consumed by
`CSVSourceAdapter` in `tools/adapters/csv_adapter.py`.

The shared contract consists of:

- `SourceSpec`: an opaque source URI plus immutable adapter-specific options;
- `SourceAdapter`: a runtime-checkable protocol exposing `format_name` and
  `iter_records(source)`;
- `RawRecord`: a mapping of original source field names to raw values;
- `validate_source_adapter`: a small fail-fast check for adapter conformance.

The CSV adapter implements this contract while preserving the existing
`iter_csv_records(path, ...)` function for backward compatibility. CSV-specific
options are limited to `encoding`, `delimiter`, and `strict`; unknown options
are rejected rather than silently ignored.

The URI is opaque at the contract level. CSV currently interprets it as a local
file path. Future JSON and API adapters may interpret it as a file path, endpoint,
or configured source identifier without changing downstream consumers.

The contract deliberately excludes pagination policy, retries, authentication,
canonical field mapping, normalization, governance, and publication. Those
concerns must be added only where a concrete source type requires them and must
not leak into the shared record interface.

## Required processing boundary

```text
Raw source file
    |
    v
Streaming source adapter
    |
    v
Source profile / structural checks
    |
    v
Reviewed source-specific semantic mapping
    |
    v
Canonical normalizer + Registry validation
    |
    v
Provenance / collection manifest validation
    |
    v
Atomic publisher (explicitly approved real-data ingestion)
```

## Safety invariants

1. Raw source files remain unchanged.
2. Source-only attributes are not added to canonical Registry schemas.
3. Unsupported source attributes are discarded during canonical projection.
4. Missing canonical capabilities are not invented or silently populated.
5. Semantic similarity alone is not mapping approval.
6. No source is ingested merely because its CSV can be read or profiled.
7. Elasticsearch publication remains a separate, explicit final operation.

## Current scope and limitations

This increment implements the generic CSV reading boundary, the shared source
adapter contract, and contract conformance tests. It does not implement JSON or
API adapters, source-to-canonical mappings, approve JobVision ingestion, change
Registry profiles, change Elasticsearch mappings, or alter n8n workflows.
JobVision remains blocked by the Phase 9 policy and the unresolved definition of
canonical `demand_score`.
