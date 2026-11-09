# NexusOps Runtime Reliability & Production Hardening

## Runtime topology

~~~text
Conversation client
    |
    | request_id + conversation_id
    v
NexusOps LLM client ---- Ollama (bounded request timeout / retry)
    |
    | fresh Streamable HTTP session per attempt
    v
MCP server
    |
    | bounded async concurrency + asyncio.to_thread
    v
Analytics / Search tools
    |
    | Elasticsearch client: request timeout + bounded transient retries
    v
Elasticsearch
~~~

The analytics engine remains the single implementation of generic analytics.
This hardening layer adds execution boundaries around the existing pipeline;
it does not create a second query engine.

## Conversation isolation

ask_nexusops(question, conversation_id="default") now uses a
conversation-scoped state object containing:

- message history
- memory summary
- verified structured evidence
- an async lock protecting turn order

Requests using the same conversation ID are serialized. Different IDs have
independent memory and can execute concurrently. The default ID preserves the
existing CLI behavior. Integrations serving multiple users must supply a
stable, non-empty conversation ID per logical conversation and must not use a
shared constant for every user.

The in-process state store targets 128 retained conversations. Inactive
least-recently-used entries may be evicted when capacity is reached; active
requests are protected from eviction, so the count may temporarily exceed the
target while all retained conversations are active. This state is process-local
and is not a distributed session store.

## MCP session and retry policy

- Each tool attempt opens a new Streamable HTTP transport and ClientSession.
- Session initialization, tool execution, and teardown occur inside one bounded
  timeout.
- Only transport errors and timeouts are retried.
- Validation failures, unknown datasets, invalid fields, and application-level
  tool errors are not retried.
- The default policy is two total attempts with a short exponential delay.
- MCP tool calls in this project are read-only; retrying a transport-interrupted
  read does not duplicate a data mutation.

Environment variables:

| Variable | Default | Purpose |
|---|---:|---|
| NEXUSOPS_MCP_URL | http://127.0.0.1:8000/mcp | MCP endpoint |
| NEXUSOPS_MCP_TIMEOUT_SECONDS | 60 | Timeout for one complete MCP attempt |
| NEXUSOPS_MCP_MAX_ATTEMPTS | 2 | Total attempts, including the first |
| NEXUSOPS_MCP_RETRY_BASE_DELAY_SECONDS | 0.35 | Exponential retry base delay |
| NEXUSOPS_OLLAMA_TIMEOUT_SECONDS | 60 | Ollama API request timeout |
| OLLAMA_BASE_URL | http://127.0.0.1:11434/v1 | Local Ollama OpenAI-compatible endpoint |
| OLLAMA_MODEL | qwen3:4b | Local model |
| NEXUSOPS_MCP_MAX_CONCURRENT_SYNC_TOOLS | 8 | Maximum concurrent blocking MCP tool operations |

## Blocking work and concurrency

MCP tool handlers are async, but Elasticsearch Python operations are synchronous.
All synchronous search and analytics work is now dispatched through
asyncio.to_thread and protected by a shared semaphore. A slow Elasticsearch
request therefore does not block the MCP event loop from servicing unrelated
MCP sessions. The semaphore bounds concurrent blocking operations.

Elasticsearch clients are created per operation and closed by their owning
tool. They are not shared between concurrent requests.

## Elasticsearch resilience

| Variable | Default | Purpose |
|---|---:|---|
| ELASTICSEARCH_REQUEST_TIMEOUT | 15 seconds | Per-request timeout |
| ELASTICSEARCH_MAX_RETRIES | 2 | Retry budget |
| ELASTICSEARCH_RETRY_ON_TIMEOUT | true | Retry timed-out read requests |
| ELASTICSEARCH_VERIFY_CERTS | false | TLS certificate verification |

Retries are limited to timeout handling and transient HTTP statuses
429, 502, 503, and 504. Certificate verification remains configurable;
the default preserves the current local self-signed Elasticsearch setup.
Production deployments should enable certificate verification and provide a
trusted CA configuration.

## Error contract

Generic analytics failures use the same envelope as successful analytics
responses:

~~~json
{
  "status": "error",
  "dataset_id": "university_graduates",
  "operation": "count",
  "result": null,
  "metadata": {
    "execution_time_ms": 1.25,
    "request_id": "correlation-id"
  },
  "warnings": [],
  "error": {
    "code": "UNKNOWN_DATASET",
    "message": "A safe error message",
    "details": {}
  }
}
~~~

The MCP client recognizes status="error" before success-result validation.
An execution error is never converted into an empty result. Validation and
application errors are returned without transport retries. Unexpected
server-side exceptions are logged with a stack trace but returned to clients
with a generic message.

Other MCP tools use the common top-level status and error fields for
execution failures while preserving their established success payloads.

## Observability

The MCP server and standalone LLM client configure JSON logging when launched
as processes. Events include timestamp, severity, logger, event name, and
available correlation fields such as:

- request_id
- conversation_ref (a short hash; raw IDs are not logged)
- tool_name
- dataset_id
- operation
- duration_ms
- attempt
- error_code

Raw prompts, tool arguments, complete Elasticsearch records, and result
payloads are deliberately excluded from routine logs. Exceptions are retained
in server logs for diagnosis. Set NEXUSOPS_LOG_LEVEL=DEBUG to enable
additional planner-stage diagnostics; INFO is the default.

## Automated coverage added

tests/test_runtime_reliability.py covers:

- conversation and verified-memory isolation
- conversation ID validation
- retry after a transient MCP transport failure
- no retry for application-level failures
- bounded retry exhaustion
- offloading synchronous MCP tools from the event loop
- retaining worker capacity until cancelled blocking calls actually finish
- canonical analytics error envelopes, including normalization of adapter errors
- analytics execution off the event loop
- JSON log correlation fields without request payloads
- Elasticsearch client cleanup after analytics failures
- Elasticsearch client cleanup after market-skill failures

These tests use mocked transport or data functions where appropriate. They do
not prove connectivity to the developer's live Ollama, MCP, Elasticsearch, or
n8n processes.

## Local acceptance

After pulling the branch, run the static and automated code gates:

~~~powershell
python -m py_compile llm_mcp_client.py
python -m py_compile server.py
python -m py_compile config.py
python -m py_compile runtime_logging.py
python -m py_compile scripts/runtime_preflight.py
python -m pytest -q tests
~~~

Then verify local service readiness with:

~~~powershell
python scripts/runtime_preflight.py
~~~

The preflight checks Elasticsearch, the configured Ollama model, the MCP
endpoint and required tool registry, and the n8n HTTP endpoint. It does not
execute analytical queries or replace the numerical and concurrency acceptance
scenarios below.


Then repeat the live n8n acceptance scenarios in
analytics-runtime-acceptance.md, including concurrent requests from different
conversations. Verify that same-conversation turns remain ordered and that
separate conversation IDs do not share evidence or history.
