# NexusOps Agentic Workflow Contract

## Scope

The n8n workflow coordinates natural-language requests, local planning with Ollama, validated tool plans, MCP Streamable HTTP calls, result normalization, and Persian response composition. Elasticsearch remains the analytical source of truth; the workflow must not invent records or treat execution failures as empty result sets.

## Execution sequence

1. **Input and domain gate** — normalize the incoming chat request and reject requests outside the university/labor-market domain.
2. **Planning** — ask the local Qwen3 model for one or more independent plans.
3. **Plan validation** — validate tool names, registered dataset/field contracts, operation shape, filter operators, metric aliases, sorting, and limits before any MCP call.
4. **MCP session lifecycle** — initialize the MCP session, retain the negotiated protocol version and session identifier, send `notifications/initialized`, and verify that the notification receives a successful 2xx HTTP response.
5. **Tool execution** — issue one MCP `tools/call` request per validated plan, retaining JSON-RPC IDs and plan metadata for response correlation.
6. **Normalization and interpretation** — distinguish transport/protocol failures from valid empty results, preserve execution metadata, and provide only returned facts to the answer writer.
7. **Final composition** — report failed or unrecognized plans explicitly; never translate an execution error into a zero count.

## MCP initialization failure policy

The initialization response alone does not prove that the session is ready. The initialized notification is now checked explicitly. A non-2xx or missing HTTP status is routed to the existing error-reply path, and no tool call is issued. A 2xx response continues to the tool-call builder.

The notification is a JSON-RPC notification and therefore does not require a JSON-RPC response body. The HTTP status is the acceptance signal used by this workflow.

## Operational constraints

- The workflow remains inactive in the exported artifact until it is imported and deliberately activated in the target n8n instance.
- The configured MCP endpoint is local: `http://127.0.0.1:8000/mcp`. n8n must be able to reach the MCP server at that address from its own runtime/network namespace.
- The local Ollama model and n8n credentials are environment-specific and must be selected during import/deployment; exported credential identifiers are not portable secrets.
- The workflow's static contract tests validate node identity, graph references, and MCP initialization routing. They do not replace an execution test against the user's live n8n, Ollama, MCP server, and Elasticsearch processes.

## Validation

Run:

```powershell
python -m json.tool .\workflows\nexusops-agentic-workflow.json > $null
pytest -q tests/test_n8n_workflow_contract.py
```


## Deterministic routing and response normalization

- Exact course and graduate identifiers are routed to `search_elasticsearch` when the request is a lookup, even if the local model returns an unsupported or malformed plan. Only the extracted identifiers are sent as the search query.
- The `get_top_skill_gaps` result is a skill-level ranking. Its `ranked_skill`, associated course, coverage, demand, and gap fields are normalized into a stable ranked-row contract. The MCP envelope may contain the payload under `result`; both direct and enveloped forms are accepted.
- `ranking` and `calculation` response modes render structured result tables. Numeric display values are rounded to two decimal places without modifying the structured facts retained for analysis.
- A successfully executed tool result that cannot be normalized is a contract failure, not an empty result. Dedicated code-node runtime tests execute the workflow's actual JavaScript with mocked n8n bindings to protect these paths.

## Validation

The consolidated Python suite includes the workflow contract and Node-backed Code node execution tests. Node.js must be available for the latter; it is already a runtime dependency of the local n8n installation.


## Phase 5 — request isolation and response integrity

The workflow treats a multi-plan response as an integrity boundary rather than a best-effort collection:

- Request language is selected by dominant writing system; Persian wins ties so Latin technical names do not override a Persian request.
- Every successful MCP response must carry a JSON-RPC ID that maps to exactly one originating request. Duplicate, missing, unknown, or mismatched IDs fail closed. Positional association is retained only for an HTTP transport failure with no JSON-RPC response body, where no successful data can be misattributed.
- Before analysis, the workflow verifies expected plan count, contiguous unique plan indexes, unique plan IDs and RPC IDs, consistent response mode, question, and session identity. Missing or mixed metadata is rejected rather than combined.
- Exact course identifiers are resolved only against the canonical `university_courses` index; exact graduate identifiers use `university_graduates`. Denormalized course-graduate rows cannot override or duplicate canonical course identity.
- Answer Writer is an analysis-only stage. It returns no unsolicited analysis and does not reproduce deterministic tables or replace facts rendered by Compose Final.

These safeguards are workflow-level checks. They do not claim that concurrent executions have been stress-tested against the user's live n8n deployment.
