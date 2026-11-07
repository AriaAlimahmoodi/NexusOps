import asyncio
import json

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client


MCP_URL = "http://127.0.0.1:8000/mcp"


def print_result(name, result):
    print(f"\n{'=' * 70}")
    print(f"TEST: {name}")
    print(f"{'=' * 70}")

    print(f"Is Error: {result.is_error}")

    if result.is_error:
        print("\nERROR:")
        for content in result.content:
            print(content)
        return False

    for content in result.content:
        if hasattr(content, "text"):
            try:
                parsed = json.loads(content.text)
                print(json.dumps(
                    parsed,
                    ensure_ascii=False,
                    indent=2,
                ))
            except json.JSONDecodeError:
                print(content.text)

    return True


async def call_analytics(session, name, arguments):
    result = await session.call_tool(
        "analytics_query",
        arguments=arguments,
    )

    return print_result(name, result)


async def main():
    async with streamable_http_client(MCP_URL) as (
        read_stream,
        write_stream,
    ):
        async with ClientSession(read_stream, write_stream) as session:

            # ---------------------------------------------------------
            # 1. Initialize
            # ---------------------------------------------------------

            await session.initialize()

            print("\nMCP connection: OK")

            # ---------------------------------------------------------
            # 2. Tool discovery
            # ---------------------------------------------------------

            tools = await session.list_tools()

            print("\n=== AVAILABLE MCP TOOLS ===")

            for tool in tools.tools:
                print(f"- {tool.name}")

            analytics_tool = next(
                tool
                for tool in tools.tools
                if tool.name == "analytics_query"
            )

            print("\n=== ANALYTICS QUERY SCHEMA ===")
            print(json.dumps(
                analytics_tool.inputSchema
                if hasattr(analytics_tool, "inputSchema")
                else analytics_tool.input_schema,
                ensure_ascii=False,
                indent=2,
            ))

            passed = 0
            failed = 0

            # ---------------------------------------------------------
            # TEST 1 — COUNT
            # ---------------------------------------------------------

            if await call_analytics(
                session,
                "1 - COUNT labor_market",
                {
                    "dataset_id": "labor_market",
                    "operation": "count",
                },
            ):
                passed += 1
            else:
                failed += 1

            # ---------------------------------------------------------
            # TEST 2 — AVG + GROUP BY
            # ---------------------------------------------------------

            if await call_analytics(
                session,
                "2 - AVG demand_score GROUP BY skill",
                {
                    "dataset_id": "labor_market",
                    "operation": "aggregate",
                    "group_by": ["skill"],
                    "metrics": [
                        {
                            "function": "avg",
                            "field": "demand_score",
                            "alias": "average_demand",
                        }
                    ],
                    "limit": 5,
                },
            ):
                passed += 1
            else:
                failed += 1

            # ---------------------------------------------------------
            # TEST 3 — SUM
            # ---------------------------------------------------------

            if await call_analytics(
                session,
                "3 - SUM frequency GROUP BY skill",
                {
                    "dataset_id": "labor_market",
                    "operation": "aggregate",
                    "group_by": ["skill"],
                    "metrics": [
                        {
                            "function": "sum",
                            "field": "frequency",
                            "alias": "total_frequency",
                        }
                    ],
                    "limit": 5,
                },
            ):
                passed += 1
            else:
                failed += 1

            # ---------------------------------------------------------
            # TEST 4 — FILTER
            # ---------------------------------------------------------

            if await call_analytics(
                session,
                "4 - FILTER experience_level = Junior",
                {
                    "dataset_id": "labor_market",
                    "operation": "aggregate",
                    "group_by": ["skill"],
                    "metrics": [
                        {
                            "function": "avg",
                            "field": "demand_score",
                            "alias": "average_demand",
                        }
                    ],
                    "filters": {
                        "logic": "and",
                        "conditions": [
                            {
                                "field": "experience_level",
                                "operator": "eq",
                                "value": "Junior",
                            }
                        ],
                    },
                    "limit": 5,
                },
            ):
                passed += 1
            else:
                failed += 1

            # ---------------------------------------------------------
            # TEST 5 — MULTI GROUP BY
            # ---------------------------------------------------------

            if await call_analytics(
                session,
                "5 - GROUP BY job_field + experience_level",
                {
                    "dataset_id": "labor_market",
                    "operation": "aggregate",
                    "group_by": [
                        "job_field",
                        "experience_level",
                    ],
                    "metrics": [
                        {
                            "function": "avg",
                            "field": "demand_score",
                            "alias": "average_demand",
                        }
                    ],
                    "limit": 10,
                },
            ):
                passed += 1
            else:
                failed += 1

            # ---------------------------------------------------------
            # TEST 6 — MULTI METRIC
            # ---------------------------------------------------------

            if await call_analytics(
                session,
                "6 - MULTI METRIC",
                {
                    "dataset_id": "labor_market",
                    "operation": "aggregate",
                    "group_by": ["skill"],
                    "metrics": [
                        {
                            "function": "avg",
                            "field": "demand_score",
                            "alias": "average_demand",
                        },
                        {
                            "function": "sum",
                            "field": "frequency",
                            "alias": "total_frequency",
                        },
                        {
                            "function": "count_documents",
                            "alias": "record_count",
                        },
                    ],
                    "limit": 5,
                },
            ):
                passed += 1
            else:
                failed += 1

            # ---------------------------------------------------------
            # TEST 7 — SORT
            # ---------------------------------------------------------

            if await call_analytics(
                session,
                "7 - SORT by average demand",
                {
                    "dataset_id": "labor_market",
                    "operation": "aggregate",
                    "group_by": ["skill"],
                    "metrics": [
                        {
                            "function": "avg",
                            "field": "demand_score",
                            "alias": "average_demand",
                        }
                    ],
                    "sort": [
                        {
                            "field": "average_demand",
                            "order": "desc",
                        }
                    ],
                    "limit": 5,
                },
            ):
                passed += 1
            else:
                failed += 1

            # ---------------------------------------------------------
            # TEST 8 — DATASET AGNOSTIC
            # university_courses
            # ---------------------------------------------------------

            if await call_analytics(
                session,
                "8 - university_courses GROUP BY category",
                {
                    "dataset_id": "university_courses",
                    "operation": "aggregate",
                    "group_by": ["course_category"],
                    "metrics": [
                        {
                            "function": "count_documents",
                            "alias": "course_count",
                        }
                    ],
                    "limit": 10,
                },
            ):
                passed += 1
            else:
                failed += 1

            # ---------------------------------------------------------
            # TEST 9 — INVALID DATASET
            # ---------------------------------------------------------

            if await call_analytics(
                session,
                "9 - INVALID DATASET",
                {
                    "dataset_id": "dataset_that_does_not_exist",
                    "operation": "count",
                },
            ):
                print("\nExpected controlled error received.")
                passed += 1
            else:
                print("\nTool transport error.")
                failed += 1

            # ---------------------------------------------------------
            # TEST 10 — INVALID FIELD
            # ---------------------------------------------------------

            if await call_analytics(
                session,
                "10 - INVALID FIELD",
                {
                    "dataset_id": "labor_market",
                    "operation": "aggregate",
                    "group_by": ["field_that_does_not_exist"],
                    "metrics": [
                        {
                            "function": "avg",
                            "field": "demand_score",
                            "alias": "average_demand",
                        }
                    ],
                    "limit": 5,
                },
            ):
                print("\nExpected controlled error received.")
                passed += 1
            else:
                print("\nTool transport error.")
                failed += 1

            # ---------------------------------------------------------
            # FINAL SUMMARY
            # ---------------------------------------------------------

            print("\n")
            print("=" * 70)
            print("MCP ANALYTICS TEST SUMMARY")
            print("=" * 70)
            print(f"PASSED: {passed}")
            print(f"FAILED: {failed}")
            print(f"TOTAL : {passed + failed}")

            if failed == 0:
                print("\nALL MCP ANALYTICS TESTS PASSED")
            else:
                print("\nSOME MCP ANALYTICS TESTS FAILED")


if __name__ == "__main__":
    asyncio.run(main())