# Phase 11 — Semantic Field Mapping

## Objective

Phase 11 establishes a conservative, auditable workflow for proposing semantic
relationships between external source headers and the existing NexusOps
Dataset Registry. It reuses the deterministic matcher and optional local
Ollama assistant. It does not extend Registry schemas or approve ingestion.

## Phase 11.1 — Matcher and Ollama orchestration with explicit review

Implemented in:

- `tools/semantic_mapping_workflow.py`
- `tests/test_semantic_mapping_workflow.py`

### Analysis flow

`analyze_source_mapping(source_profile, dataset_id, ...)`:

1. Requires a completed source profile with an explicit source name and column
   metadata.
2. Loads exactly one target dataset contract from the existing Dataset
   Registry.
3. Runs `match_source_profile` as the deterministic baseline.
4. Optionally calls `OllamaSemanticAssistant` with the same source profile
   and target Registry contract. The existing assistant constructs a reduced
   prompt containing only source header names, inferred physical types,
   canonical field names/types/roles, and existing deterministic candidates.
   Raw record values, sample values, and value distributions are not sent.
5. Merges validated suggestions without duplicating deterministic candidates.
6. Returns per-field candidates, origin, confidence, rationale, ambiguity,
   physical-type warnings, bilingual-pair diagnostics, and aggregate counts.

Ollama is optional. If it is unavailable, deterministic candidates remain
available and the report is marked `completed_with_ollama_unavailable`.
Callers may also set `use_ollama=False` for a fully deterministic run.

### Approval boundary

Every candidate remains `requires_human_review=true` and
`automatically_accepted=false`, including deterministic candidates whose
matcher status is `auto_match_candidate`.

`build_reviewed_source_mapping(...)` accepts an explicit reviewer-supplied
mapping of source field to target field. It rejects pairs that were not
proposed in the analysis report, candidates that require physical type
conversion or nested extraction, and duplicate canonical targets. It then
constructs the existing immutable `SourceMappingSpec`, which continues to
validate target fields against the Dataset Registry and provenance contract.

Review metadata (`reviewed_by`, `reviewed_at`, and
`review_reference`) is supplied by the caller. The software records this
declaration; it does not independently prove that a human review occurred.

### Type and semantic boundaries

Phase 11 identifies semantic candidates only. It does not convert values.
Direct projection eligibility is limited to conservative source/target
physical-type combinations. Unknown/mixed types, JSON-array extraction, and
other conversions are blocked from MappingSpec construction and must be
handled by the Phase 12 Standardization Engine.

Bilingual header pairs remain diagnostics. Their presence does not establish
value-level equivalence and does not authorize dropping either source field.

### Safety invariants

- No source record is ingested or written to Elasticsearch.
- No Registry profile or Elasticsearch mapping is modified.
- No candidate is automatically approved, even at high confidence.
- Only targets in the selected canonical Registry contract can be proposed.
- Source-only fields are not added to NexusOps.
- Raw source values and samples are not copied into the semantic report or
  supplied to the Ollama prompt.
- A generated `SourceMappingSpec` is a reviewed projection declaration, not
  an ingestion authorization.
- JobVision remains blocked until its unresolved field semantics and
  `demand_score` definition are resolved through the project review process.

## Remaining Phase 11 work

Phase 11.1 provides the first integrated analysis and approval-building
boundary. The remaining work is to add a durable review artifact format and
operator interface, formalize reviewer decisions (including rejected,
deferred, and ambiguous candidates), add regression fixtures for known
JobVision semantic mismatches, and validate the complete profile → analysis →
review → MappingSpec → read-only preflight flow. These increments must preserve
the explicit human approval boundary.


## Phase 11.2 — Durable semantic review artifacts

Implemented in:

- `tools/semantic_review.py`
- `tests/test_semantic_review.py`

### Artifact lifecycle

`create_semantic_review_artifact(analysis_report, ...)` creates a JSON-serializable
review artifact tied to the exact analysis report by a SHA-256 fingerprint.
It records dataset/source identity and one pending decision for each proposed
source/target candidate. It stores candidate metadata only; it does not copy
source records, sample values, or raw field values.

`apply_semantic_review_decisions(artifact, decisions, ...)` returns an updated
artifact and supports partial review. Each submitted decision must identify an
existing candidate, use one of `approved`, `rejected`, `deferred`, or
`ambiguous`, include a non-empty reason, and record reviewer identity and a
timezone-aware timestamp. Unreviewed candidates remain pending.

`build_mapping_from_review_artifact(report, artifact, ...)` verifies the
artifact's source/dataset identity and exact analysis fingerprint. Only
explicitly approved, direct-projection-eligible candidates are passed to the
existing MappingSpec builder. Pending, rejected, deferred, and ambiguous
candidates are never projected. Conflicting approved targets are rejected by
the builder/MappingSpec validation.

### Audit and trust boundaries

- The artifact schema is versioned independently from the analysis report.
- The fingerprint detects accidental or deliberate changes to the analysis
  report after review; it does not cryptographically authenticate reviewers
  or prevent an operator from editing the review artifact itself.
- Reviewer identity, reason, and timestamp are recorded as declarations
  supplied by the caller, not independently verified identities.
- The artifact is evidence of recorded decisions, not proof of organizational
  authorization.
- `ingestion_authorized` remains false. Mapping construction does not publish
  data or authorize ingestion.
- No source values are copied into the artifact; no Registry, source data, or
  Elasticsearch state is changed.

Phase 11.2 adds the durable review data model and API. Operator-facing CLI
workflow and JobVision-specific semantic regression fixtures remain subsequent
increments.


## Phase 11.3 — Semantic mapping review operator CLI

Implemented in:

- `scripts/semantic_mapping_review.py`
- `tests/test_semantic_mapping_review_cli.py`

The CLI exposes three explicit subcommands. Each command reads/writes JSON
artifacts and performs no ingestion or Elasticsearch operation.

### 1. Analyze and create a pending review artifact

```powershell
python -m scripts.semantic_mapping_review analyze --profile .\source-profile.json --dataset labor_market --report .\semantic-analysis.json --artifact .\semantic-review.json --artifact-id jobvision-labor-market-v1 --created-by operator --no-ollama
```

Remove `--no-ollama` to enable the existing local Ollama assistant. The
analysis report and review artifact are written as UTF-8 JSON. The artifact
starts with every candidate in `pending`; no candidate is accepted.

### 2. Record reviewer decisions

Prepare a JSON array containing only the candidates being reviewed. Each item
must include `source_field`, `target_field`, `decision`, and
`decision_reason`. Allowed decisions are `approved`, `rejected`,
`deferred`, and `ambiguous`.

```powershell
python -m scripts.semantic_mapping_review review --artifact .\semantic-review.json --decisions .\review-decisions.json --output .\semantic-review-reviewed.json --reviewed-by reviewer-id --reviewed-at 2026-11-15T06:30:00Z
```

Partial decisions are supported. The input artifact is not overwritten; the
updated artifact is written to the requested output path. Reviewer timestamps
must include a timezone.

### 3. Export a reviewed MappingSpec

```powershell
python -m scripts.semantic_mapping_review build-mapping --report .\semantic-analysis.json --artifact .\semantic-review-reviewed.json --output .\source-mapping-spec.json --mapping-id jobvision-labor-market-v1 --reviewed-by reviewer-id --reviewed-at 2026-11-15T06:35:00Z --review-reference review-001
```

The command verifies the analysis fingerprint and source/dataset identity.
Only approved, direct-projection-eligible candidates are exported. If no
candidate has been approved, the command fails without creating the output
file. Duplicate target mappings and Registry violations remain rejected by
the existing MappingSpec validation.

### Operational safeguards

- JSON output is written through a temporary file followed by an atomic
  replacement in the destination directory.
- Analysis output and review artifacts contain candidate metadata, not raw
  source records or sample values.
- The CLI never constructs an Elasticsearch client, invokes ingestion, or
  publishes data.
- MappingSpec export reports `ingestion_authorized=false`; a separate,
  explicit preflight and publication authorization process remains necessary.
- The CLI does not authenticate reviewer identities. The supplied reviewer
  identifiers and timestamps are audit declarations.
- JobVision remains blocked; the CLI does not resolve its semantic mismatches
  or define `demand_score`.

