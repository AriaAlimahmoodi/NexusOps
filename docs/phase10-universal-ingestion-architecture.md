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

## Phase 10.3 — Streaming JSON source adapter

Implemented in `tools/adapters/json_adapter.py`.

The adapter implements the shared `SourceAdapter` contract and supports two
explicit source layouts:

- `jsonl` (default): one JSON object per non-empty line;
- `array`: a top-level JSON array containing JSON objects.

JSON Lines are decoded one line at a time. JSON arrays are decoded incrementally
using a bounded input buffer; the complete source document is not loaded into
memory. Array items and JSON Lines values must be objects. Malformed JSON,
non-object values, trailing content, and unsupported options are rejected.

Adapter-specific options are `encoding`, `mode`, and `chunk_size`. The default
encoding is `utf-8-sig`, the default mode is `jsonl`, and array mode uses a
64 KiB input chunk by default. The adapter preserves JSON value types and
original property names. It does not infer schema or canonical meaning.

The adapter does not support pretty-printed multi-line JSON objects in JSON
Lines mode. Such sources must use array mode or be converted to one-object-per-
line JSON Lines before being read.

## Phase 10.4 — Configurable HTTP API source adapter

Implemented in `tools/adapters/api_adapter.py`.

The adapter implements the shared `SourceAdapter` contract and supports
HTTP(S) GET requests and explicitly configured POST requests. POST endpoints
may have side effects; callers must review the endpoint contract before use. Direct JSONL and top-level JSON-array responses are streamed through
the shared JSON readers. JSON envelope extraction and pagination operate one
response page at a time and preserve each source record's property names and
JSON value types.

Supported request options:

- `headers`: optional string-to-string request headers, including API
  authentication headers;
- `timeout`: positive timeout in seconds (default: 30);
- `method`: `GET` (default) or `POST`;
- `body`: JSON-serializable request body, required for POST and prohibited
  for GET;
- `content_type`: POST content type (default: `application/json`);
- `mode`: `jsonl` (default) or `array`;
- `encoding`: response encoding (default: `utf-8-sig`);
- `chunk_size`: positive JSON-array reader chunk size (default: 64 KiB);
- `records_path`: optional dotted path to the array of records inside a JSON
  response envelope; numeric path segments can address array elements.

Pagination is opt-in through the `pagination` mapping and requires
`mode="array"` plus `records_path`:

- `strategy="page"`: query-parameter pagination. Configure `page_param`
  (default `page`), `start_page` (default 1), required `page_size`, and
  optional paired `page_size_param`. A short page ends iteration.
- `strategy="next_url"`: link-based pagination. Configure
  `next_url_path` to the dotted path containing the next URL; a null or empty
  value ends iteration.
- Both strategies support `max_pages` (default 100). Next URLs are restricted
  to the original origin so authorization headers are not forwarded to another
  host.

Retry options are `retries` (default 0), `retry_backoff_seconds` (default
0.5; exponential backoff), and `retry_statuses` (default 429, 500, 502, 503,
504). GET retries are enabled when configured. POST retries are disabled by
default; `retry_post=True` explicitly opts in and can repeat a non-idempotent
operation, so callers must only enable it when the endpoint supports safe
retries or an idempotency key.

Only HTTP(S) URLs without embedded user credentials are accepted. HTTP error
messages do not expose request URLs or header values. No automatic token
refresh, provider-specific field mapping, canonical normalization, governance,
or publication is performed. Tests use mocked responses and do not contact
external APIs. Direct JSONL and JSON-array modes stream records; envelope
extraction buffers one response page in memory, so page size and
`max_pages` should be chosen conservatively for large sources.

## Phase 10.5 — Explicit source adapter registry and dispatch

Implemented in `tools/adapters/registry.py` and
`tests/test_adapter_registry.py`.

The registry provides one explicit dispatch point for the built-in CSV, JSON,
and HTTP API adapters:

- `SourceAdapterRegistry` stores adapters by their declared `format_name`;
- registration validates the shared adapter contract before accepting an
  adapter;
- duplicate format registrations are rejected unless the caller explicitly
  requests replacement;
- `get_adapter(format_name)` resolves a registered adapter and reports the
  available formats for unknown names;
- `iter_records(format_name, source)` validates the shared `SourceSpec` and
  returns the selected adapter's iterator without collecting or transforming
  records;
- `create_default_adapter_registry()` returns a fresh registry containing
  `csv`, `json`, and `api`. Each call is independent; there is no mutable
  process-global registry.

The caller must select the format explicitly. The registry does not infer a
format from a filename or URL, inspect file contents, load arbitrary Python
plugins, resolve credentials, or perform network access during registration.
It does not invoke source discovery, canonical mapping, normalization,
governance, or publication. In particular, registering an API adapter does not
make a request, and this phase does not authorize JobVision ingestion.

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
6. No source is ingested merely because its records can be read or profiled.
7. Elasticsearch publication remains a separate, explicit final operation.

## Current scope and limitations

This increment implements streaming CSV and JSON readers, a configurable
HTTP API reader with pagination, retries, POST, and envelope extraction, the
shared source adapter contract, and adapter conformance tests. It does not
implement source-to-canonical mappings, approve JobVision ingestion, change
Registry profiles, change Elasticsearch mappings, or alter n8n workflows.
JobVision remains blocked by the Phase 9 policy and the unresolved definition of
canonical `demand_score`.


## Phase 10.6 — Streaming source ingestion coordinator

Implemented in `tools/data_ingestion.py` and
`tests/test_source_ingestion.py`.

The new `ingest_source(...)` function is a thin orchestration boundary:

1. It requires an explicit `SourceSpec` and format name.
2. It uses the supplied `SourceAdapterRegistry`, or creates a fresh default
   registry containing CSV, JSON, and API adapters.
3. It obtains the adapter iterator through registry dispatch.
4. It passes that iterator directly to the existing
   `ingest_real_records(...)` path, including the configured publisher
   `batch_size`.

The coordinator does not collect records, infer source formats, map fields,
normalize values, validate canonical semantics, or publish independently.
The existing atomic publisher consumes the iterator incrementally, applies the
canonical Registry projection and provenance checks, stages bounded bulk
requests, and switches the alias only after the complete candidate snapshot
passes validation. If source reading or record validation fails during
iteration, the candidate is not published.

The existing `ingest_real_records` signature remains backward compatible;
`batch_size` is an optional keyword-only setting defaulting to 500.

This coordinator does not make arbitrary raw sources safe for ingestion:
records must already use reviewed canonical field names and include the
required manifest and provenance metadata. It does not authorize JobVision
ingestion or change any canonical Registry profile.


## Phase 10.7 — Adapter-backed source profiling

Implemented in `tools/source_discovery.py` and
`tests/test_adapter_source_profiling.py`.

The existing CSV profiler remains available. Two generic entry points extend
source profiling to any registered adapter:

- `profile_record_stream(records, ...)` profiles an iterator of raw mapping
  records without retaining the records themselves;
- `profile_source(format_name, source, ...)` resolves an explicitly selected
  adapter through the supplied registry or a fresh default registry, then
  profiles its iterator.

The report observes the union of source field names, physical value types,
null counts, bounded samples, bounded top/distinct values, and nested JSON
object keys/array item types. Fields first seen later in the stream are counted
as missing in earlier records. JSON-compatible nested values are serialized
only for profiling and are not written back to the source.

The profiler rejects non-mapping records and empty/non-string field names.
Memory used for value statistics is bounded by the configured sample and
distinct-value limits (plus the observed field-name set). It does not rename
fields, infer canonical meaning, approve mappings, normalize records, validate
a dataset contract, or write to Elasticsearch.

Profiling is a separate, explicit read of the source. It is not automatically
inserted into `ingest_source`: doing so would read a source twice, which can be
expensive or unsafe for POST endpoints and other non-repeatable sources. A
successful structural profile is not semantic approval or ingestion
authorization. JobVision remains blocked under the existing policy.


## Phase 10.8 — Read-only source compatibility assessment

Implemented in `tools/source_compatibility.py` and
`tests/test_source_compatibility.py`.

`assess_source_compatibility(dataset_id, format_name, source, ...)` performs
one adapter-backed source read and compares the resulting structural profile
with the selected Dataset Registry contract.

The report includes:

- exact source field-name matches against registered dataset and provenance
  fields (candidate matches only; not semantic approval);
- registered required fields not observed in the source;
- source-only fields outside the canonical and provenance contracts, which
  canonical projection will discard;
- conservative physical-type checks for exact-name matches, including an
  explicit not-assessable status for unknown or mixed observations;
- the bounded source profile and aggregate assessment counts.

The assessment is read-only. It does not map differently named source fields,
change Registry schemas, normalize records, mutate source files, or write to
Elasticsearch. Its decision is always `manual_review_required`; the report
explicitly sets `semantic_mapping_performed=false` and
`ingestion_authorized=false`. A successful name/type comparison is not
evidence that two fields have the same meaning. In particular, this phase
does not unblock JobVision ingestion or resolve canonical `demand_score`.
