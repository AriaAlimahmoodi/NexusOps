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

## Agentic End-to-End acceptance

The repository includes a separate n8n acceptance workflow at
`workflows/nexusops-agentic-e2e-test-suite.json`. It calls the active production
Chat Trigger endpoint of the main agent workflow, rather than calling MCP tools
directly. Its four cases cover a numeric graduate count, course C002 retrieval,
a multi-objective graduate-count/skill-gap request, and out-of-domain rejection.

The suite serializes requests with a one-item Loop Over Items node. This is
intentional for the local Ollama runtime and avoids creating accidental model
concurrency during ordinary acceptance runs. The test suite checks observable
HTTP response content; it does not introspect hidden planner state and therefore
does not claim that a multi-objective prompt necessarily became two independent
plans. It also does not inject an MCP transport failure or establish concurrent
execution isolation. Those are separate resilience and concurrency acceptance
gates.

The main Chat Trigger workflow must be active for the production webhook to
accept requests. The suite uses the Chat Trigger webhook ID stored in the
exported workflow; if n8n regenerates that ID during import, update the suite
endpoint to the Chat URL displayed by the active Chat Trigger.

## Specialized skill-gap result normalization

The `get_top_skill_gaps` MCP tool returns a ranked list of skills using
`ranked_skill`, `associated_course_id`, `associated_course_name`,
`course_coverage`, `market_demand`, and `market_gap`. The result normalizer
must not reuse the market-demand tool's field contract (`skill`,
`average_demand_score`, and `total_frequency`).

The formatter handles both a direct tool payload and a nested MCP
`result` envelope, validates the skill identity and numeric gap value,
and renders the associated course and market fields without changing their
meaning. The displayed rank is the one-based position in the tool's
market-gap-descending result order; it is not a separately stored dataset field.

## Planner retry contract

The Query Planner receives the previous validation errors and raw invalid plan on
retry. It must use those diagnostics to repair the plan rather than repeating the
same output. Canonical examples define an unfiltered graduate count and a C002
course lookup; simple single-objective requests must remain single plans. This
prompt-level contract is covered by a static workflow contract test. It does not
replace live Ollama acceptance testing.


## Deterministic analytics planning and validation recovery

The n8n workflow includes a deterministic pre-validation fallback for three
well-defined analytical intents: grouped graduate outcome averages, compound
skill-mapping thresholds, and full skill ranking by average market gap.
When the request unambiguously matches one of these contracts, the validator
uses a schema-checked canonical plan instead of forwarding malformed LLM
output. The local planner prompt also contains canonical examples using the
exact `analytics_query` argument schema (`group_by`, `metrics`,
`filter_conditions`, and `sort`). This avoids model-invented fields such
as `select_fields` and invalid metric shapes.

An exhausted planner retry is classified separately from a genuinely
unsupported request. Validation errors are reported as planner/contract
failures; they must not be presented to the user as proof that Analytics lacks
the requested capability. The deterministic fallback does not replace
validation: every generated plan still passes the same dataset, field-role,
metric, filter, alias, sort, and limit checks before MCP execution.


## Live analytics acceptance follow-up

The live n8n run exposed three presentation/planning edge cases and the workflow contract
now addresses them:

- Persian ZWNJ and spacing variants such as «ماه‌های اشتغال» are normalized before
  deterministic intent matching. Grouped graduate outcomes include a document-count
  metric as well as both requested averages.
- Planner envelope metadata (`unsupported_reason` and `response_mode`) is removed only
  from the nested argument object after validating its values. All other unknown
  analytics arguments remain rejected by the strict schema.
- Filtered SELECT counts are explicitly scoped to matching records and must not be
  described as the size of the entire Elasticsearch index. Floating-point artifacts
  are rounded to two decimal places for display while structured facts retain precision.

The exact Persian grouped-graduate request is covered by a workflow contract regression
test. Live acceptance still requires rerunning all three Chat Trigger scenarios after
importing the updated workflow into n8n.
