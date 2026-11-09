# NexusOps Analytics Runtime Acceptance

This runbook validates the full local path:

**n8n → Ollama (qwen3:4b) → MCP Streamable HTTP → Analytics Engine → Elasticsearch**

The automated Python suite validates planning, request validation, the analytics pipeline, and Elasticsearch adapter translation. The checks below are additionally required because GitHub-side changes cannot execute against local services.

## 1. Local code gate

Run on **refactor/integration-foundation**:

~~~powershell
git pull --ff-only origin refactor/integration-foundation
python -m py_compile llm_query_planner.py
python -m py_compile llm_mcp_client.py
python -m py_compile query_planner.py
python -m py_compile server.py
python -m py_compile config.py
python -m py_compile runtime_logging.py
python -m py_compile scripts/runtime_preflight.py
python -m pytest -q tests
~~~

Expected suite size after this change: **99 tests**. The exact result must be taken from the local run; the expected count is not a test result.

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
