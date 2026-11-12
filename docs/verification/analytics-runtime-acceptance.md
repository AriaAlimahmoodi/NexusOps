# NexusOps Analytics Runtime Acceptance

This runbook validates the full local path:

**n8n → Ollama (qwen3:4b) → MCP Streamable HTTP → Analytics Engine → Elasticsearch**

The automated Python suite validates planning, request validation, the analytics pipeline, and Elasticsearch adapter translation. The checks below are additionally required because GitHub-side changes cannot execute against local services.

## 1. Local code gate

Run on **feat/agentic-workflow-hardening**:

~~~powershell
git pull --ff-only origin feat/agentic-workflow-hardening
python -m py_compile llm_query_planner.py
python -m py_compile llm_mcp_client.py
python -m py_compile query_planner.py
python -m py_compile server.py
python -m py_compile config.py
python -m py_compile runtime_logging.py
python -m py_compile scripts/runtime_preflight.py
python -m pytest -q tests
~~~

The last user-reported baseline before the Phase 4 changes was **233 passed**. Phase 4 adds additional tests, so do not use that historical count as the expected total. Record the exact result from the current local run.

## 2. Verify live services before opening n8n

Run the consolidated preflight first:

~~~powershell
python scripts/runtime_preflight.py
~~~

All four checks must report ok=true before continuing.

- Elasticsearch responds at http://127.0.0.1:9200 and the required indexes are available.
- Ollama is running and ollama list shows qwen3:4b.
- NexusOps MCP server is running at http://127.0.0.1:8000/mcp using Streamable HTTP.
- n8n is running at http://localhost:5678; the active workflow's MCP client points to the local MCP endpoint.

## 3. End-to-end acceptance scenarios

**Previously completed gates (2026-11-09):** local code gate passed with `102 passed in 1.52s`; the dataset-aware preflight returned `ok: true`, and all five registered Elasticsearch indexes existed. A subsequent MCP tool-routing contract change and its regression test have since been committed; rerun syntax checks and pytest before treating the current branch head as green. These results establish code-suite and service-readiness status only. The n8n execution scenarios below remain pending until they are run through the actual workflow.

Run each prompt through the actual n8n workflow, not only through a direct Python function call.

| ID | Prompt | Expected route | Acceptance condition |
|---|---|---|---|
| A | تعداد فارغ‌التحصیلان در سال ۱۴۰۲ چقدر است؟ | analytics_query / COUNT | Returned count equals the live Elasticsearch filtered count. |
| B | میانگین ارتباط شغلی و مدت اشتغال را به تفکیک رشته فارغ‌التحصیلان مقایسه کن. | analytics_query / AGGREGATE | Each major has both averages; values agree with an equivalent Elasticsearch aggregation. |
| C | فهرست مهارت‌هایی که market_demand >= 4.8 و market_gap >= 2.5 دارند. | analytics_query / SELECT | Both thresholds appear in one AND filter; every returned row satisfies both conditions. |
| D1 | اطلاعات فارغ‌التحصیل G0001 را نشان بده. | search_elasticsearch | Exact ID lookup is retained; no generic analytics planner replaces it. |
| D2 | اطلاعات درس C002 را نشان بده. | search_elasticsearch | Exact course ID lookup is retained. |
| D3 | ۵ مهارت با بیشترین شکاف بازار را نشان بده. | get_top_skill_gaps | Specialized skill-gap tool is selected and returns five rows if five exist. |
| D4 | ۵ مهارت دارای بیشترین تقاضای بازار را نشان بده. | get_top_market_skills | Specialized market-skill tool is selected and returns five rows if five exist. |
| E | Compare average market demand and market gap by skill, rank by highest market gap. | analytics_query / AGGREGATE | Both metrics are returned per skill and ordering is by average_market_gap, descending. |

## 4. Independent Elasticsearch numerical checks

Use Kibana Dev Tools to independently verify the values returned by the workflow.

### A. Exact graduate count

~~~http
GET university_graduates/_count
{
  "query": {
    "term": {
      "graduation_year": 1402
    }
  }
}
~~~

The count value must equal scenario A.

### B. Grouped graduate averages

~~~http
GET university_graduates/_search
{
  "size": 0,
  "aggs": {
    "by_major": {
      "terms": {
        "field": "major",
        "size": 100
      },
      "aggs": {
        "average_career_relevance": {
          "avg": {
            "field": "career_relevance"
          }
        },
        "average_employment_months": {
          "avg": {
            "field": "employment_months"
          }
        }
      }
    }
  }
}
~~~

Compare bucket keys and both metric values with scenario B. Allow only normal floating-point display rounding; do not accept missing buckets or substituted metrics.

### C. Compound skill filters

~~~http
GET skill_mapping/_search
{
  "query": {
    "bool": {
      "filter": [
        {
          "range": {
            "market_demand": {
              "gte": 4.8
            }
          }
        },
        {
          "range": {
            "market_gap": {
              "gte": 2.5
            }
          }
        }
      ]
    }
  }
}
~~~

The set of returned skill records must match scenario C. Both constraints must be present in the same Boolean AND filter.

### E. Multi-metric skill comparison

~~~http
GET skill_mapping/_search
{
  "size": 0,
  "aggs": {
    "by_skill": {
      "terms": {
        "field": "skill",
        "size": 100,
        "order": {
          "average_market_gap": "desc"
        }
      },
      "aggs": {
        "average_market_demand": {
          "avg": {
            "field": "market_demand"
          }
        },
        "average_market_gap": {
          "avg": {
            "field": "market_gap"
          }
        }
      }
    }
  }
}
~~~

Compare each skill bucket, both metric values, and the descending gap order with scenario E.

## 5. Concurrency and isolation

Submit two materially different questions through separate n8n executions at nearly the same time:

1. Scenario A (graduate COUNT).
2. Scenario E (skill AGGREGATE).

Both executions must complete with their own dataset, operation, filters, and result. Neither response may contain the other's rows, count, aggregation buckets, or metadata. Repeat with scenarios C and D3 to exercise the specialized-tool path alongside generic analytics.

## Acceptance record

Record the local pytest summary, the selected MCP tool for each scenario, the numerical comparison outcome for A/B/C/E, and the concurrency outcome. A green unit suite is necessary but does not replace these live acceptance checks.


## 6. Dataset-aware preflight interpretation

The Elasticsearch preflight now checks every index declared by the five registered
dataset profiles, not merely the cluster's `info` endpoint. Review the
`required_indices` object in its JSON output and confirm every entry has
`exists: true`; `missing_indices` must be empty.

The n8n preflight result proves only that the configured base URL is reachable.
It does not inspect workflow activation, credentials, MCP node configuration,
or execution history. These must be verified by running the actual workflow in
the scenarios above.


## 7. Acceptance record — 2026-11-09

### Completed gates

| Gate | Evidence | Status |
|---|---|---|
| Python syntax compilation | `runtime_preflight.py`, `server.py`, `llm_mcp_client.py` compiled successfully | PASS |
| Automated tests | `102 passed in 1.52s` | PASS |
| Elasticsearch connectivity | Cluster `my-elk-cluster`, version `9.5.5` | PASS |
| Registered index readiness | `labor_market`, `university_courses`, `university_graduates`, `course_graduate_records`, `skill_mapping` all exist | PASS |
| Ollama | `qwen3:4b` available | PASS |
| MCP | All five required tools listed | PASS |
| n8n HTTP reachability | Base URL returned HTTP 200 | PASS |

### Still pending — actual n8n workflow executions

Do not mark these scenarios passed based on preflight or pytest:

| Scenario | Actual tool selected | Result / reference comparison | Status |
|---|---|---|---|
| A — graduate count, year 1402 | Pending | Pending | NOT RUN |
| B — graduate averages by major | Pending | Pending | NOT RUN |
| C — combined market demand and gap filters | Pending | Pending | NOT RUN |
| D1 — graduate G0001 | Pending | Pending | NOT RUN |
| D2 — course C002 | Pending | Pending | NOT RUN |
| D3 — top five skill gaps | Pending | Pending | NOT RUN |
| D4 — top five market-demand skills | Pending | Pending | NOT RUN |
| E — demand and gap averages by skill | Pending | Pending | NOT RUN |
| Concurrency and conversation isolation | Pending | Pending | NOT RUN |

### TLS warning

The local Elasticsearch connection currently uses `verify_certs=false`. The resulting urllib3 / Elasticsearch security warnings are expected under that development configuration and do not mean the connection failed. Production or network-exposed deployments must validate the certificate chain; do not suppress the warning as a substitute for fixing TLS configuration.


## 8. MCP tool-routing contract

The MCP tool descriptions now define explicit precedence:

- `analytics_query` owns custom filters, nested AND/OR conditions, grouped analysis, multiple metrics, and user-defined sorting.
- `get_top_market_skills` is reserved for its predefined top-N market-demand ranking.
- `get_top_skill_gaps` is reserved for its predefined top-N skill-gap ranking.
- `get_market_skill_details` handles explicitly named skills and their demand/frequency details.
- `search_elasticsearch` handles document retrieval, not analytics.

This prevents a field-name mention such as `market_gap` or `market_demand` from overriding the shape of the requested operation. The regression test `tests/test_mcp_tool_routing_contract.py` protects the precedence language from reverting to broad, overlapping mandatory instructions.


## 9. Unified reliability release gate

Run from the repository root:

~~~powershell
python scripts/release_gate.py
~~~

This parses the Python source tree and runs the complete pytest suite. To include live service readiness:

~~~powershell
python scripts/release_gate.py --with-runtime-preflight
~~~

To include three simultaneous requests against the active production Chat Trigger in separate sessions, including both Persian and English requests (and automatically run preflight first):

~~~powershell
python scripts/release_gate.py --with-live-concurrency
~~~

The live concurrency harness reads the production Chat Trigger webhook ID from the canonical workflow JSON and submits independent English graduate-count, Persian C002 lookup, and Persian skill-gap requests with distinct session IDs. It validates each response's expected language and intent-specific evidence, reports per-request duration, and requires at least five visible ranked skill-gap entries. This is a cross-session isolation smoke test; Python-client same-conversation ordering is covered by automated concurrency tests; this harness does not claim n8n same-session ordering or full numerical parity with Kibana.

The release report uses NOT_RUN for any live gate that was not requested. A static-only PASS must not be described as a complete live release acceptance.

## 10. Numerical integrity rules

The analytics formatter rejects:
- boolean, floating-point, or negative COUNT values;
- SELECT metadata where returned_records differs from the actual records list;
- SELECT total_records smaller than returned_records;
- non-finite or non-numeric aggregate metric values.

Use the independent Kibana Dev Tools queries in sections 4A–4E to compare live values. Do not treat successful HTTP status, a passing text assertion, or a passing unit suite as proof that all live aggregate values match Elasticsearch.


## 11. Phase 4 execution record — 2026-11-12

The repository already contains three distinct acceptance layers and they must remain separate:

1. **Python contract/reliability tests:** deterministic tests for planning, validation, MCP protocol, runtime failure handling, and conversation isolation.
2. **MCP Runtime Test Suite:** six live protocol/tool/analytics checks without Ollama.
3. **Agentic E2E Acceptance Suite:** five sequential requests through the active production Chat Trigger and local Ollama.

The live concurrency harness submits three independent Chat Trigger executions concurrently. Its assertions cover:
- exact graduate count token (30), not a substring such as 130;
- Persian course identifier and expected course name;
- a five-entry skill-gap ranking;
- expected response language for each case;
- HTTP failures and explicit incomplete/integrity states fail closed.

The concurrency harness is a smoke test for cross-session separation. It does not prove same-session ordering in n8n, nor does it replace the numerical Kibana comparisons in sections 4A–4E.

### Current verification boundary

| Evidence | Status |
|---|---|
| Phase 3 local suite | PASS — 233 passed, as reported by the user before Phase 4 changes |
| Persian/English course-gap live examples | PASS — user-provided n8n outputs on 2026-11-12 |
| Phase 4 regression tests | Pending local execution after pull |
| MCP Runtime Test Suite (T01–T06) | Pending fresh live execution |
| Agentic E2E Suite (A01–A05) | Pending fresh live execution |
| Independent Kibana numerical comparisons (A/B/C/E) | Pending fresh comparison |
| Concurrent Chat Trigger acceptance (C01–C03) | Pending fresh live execution |

A Phase 4 release is not complete until the pending local and live evidence has been collected. A passing pytest run alone is not a live release acceptance.
