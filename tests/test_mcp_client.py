import asyncio
import json

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client


MCP_URL = "http://127.0.0.1:8000/mcp"


def print_result(title, result):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)
    print(result)

    if hasattr(result, "content"):
        for item in result.content:
            if hasattr(item, "text"):
                try:
                    parsed = json.loads(item.text)
                    print(json.dumps(parsed, ensure_ascii=False, indent=2))
                except json.JSONDecodeError:
                    print(item.text)


async def main():

    async with streamable_http_client(MCP_URL) as (
        read_stream,
        write_stream,
    ):

        async with ClientSession(
            read_stream,
            write_stream,
        ) as session:

            await session.initialize()

            tools = await session.list_tools()

            print("\nAvailable tools:")
            for tool in tools.tools:
                print(f"- {tool.name}")

            # ---------------------------------------------------------
            # 1. COUNT
            # ---------------------------------------------------------

            result = await session.call_tool(
                "analytics_query",
                {
                    "dataset_id": "labor_market",
                    "operation": "count",
                },
            )

            print_result(
                "TEST 1 - COUNT",
                result,
            )

            # ---------------------------------------------------------
            # 2. GROUP BY + AVG
            # ---------------------------------------------------------

            result = await session.call_tool(
                "analytics_query",
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
            )

            print_result(
                "TEST 2 - GROUP BY + AVG",
                result,
            )

            # ---------------------------------------------------------
            # 3. SUM
            # ---------------------------------------------------------

            result = await session.call_tool(
                "analytics_query",
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
            )

            print_result(
                "TEST 3 - SUM",
                result,
            )

            # ---------------------------------------------------------
            # 4. FILTER
            # ---------------------------------------------------------

            result = await session.call_tool(
                "analytics_query",
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
            )

            print_result(
                "TEST 4 - FILTER",
                result,
            )

            # ---------------------------------------------------------
            # 5. MULTI GROUP BY
            # ---------------------------------------------------------

            result = await session.call_tool(
                "analytics_query",
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
            )

            print_result(
                "TEST 5 - MULTI GROUP BY",
                result,
            )

            # ---------------------------------------------------------
            # 6. MULTI METRIC
            # ---------------------------------------------------------

            result = await session.call_tool(
                "analytics_query",
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
                            "function": "max",
                            "field": "demand_score",
                            "alias": "maximum_demand",
                        },
                    ],
                    "limit": 5,
                },
            )

            print_result(
                "TEST 6 - MULTI METRIC",
                result,
            )

            # ---------------------------------------------------------
            # 7. SORT
            # ---------------------------------------------------------

            result = await session.call_tool(
                "analytics_query",
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
            )

            print_result(
                "TEST 7 - SORT BY METRIC",
                result,
            )

            # ---------------------------------------------------------
            # 8. DATASET AGNOSTIC TEST
            # ---------------------------------------------------------

            result = await session.call_tool(
                "analytics_query",
                {
                    "dataset_id": "university_courses",
                    "operation": "aggregate",
                    "group_by": ["course_category"],
                    "metrics": [
                        {
                            "function": "avg",
                            "field": "credits",
                            "alias": "average_credits",
                        }
                    ],
                    "limit": 10,
                },
            )

            print_result(
                "TEST 8 - UNIVERSITY COURSES",
                result,
            )

            # ---------------------------------------------------------
            # 9. INVALID DATASET
            # ---------------------------------------------------------

            try:

                result = await session.call_tool(
                    "analytics_query",
                    {
                        "dataset_id": "dataset_that_does_not_exist",
                        "operation": "count",
                    },
                )

                print_result(
                    "TEST 9 - INVALID DATASET",
                    result,
                )

            except Exception as exc:

                print("\n" + "=" * 70)
                print("TEST 9 - INVALID DATASET")
                print("=" * 70)
                print("Expected controlled error:")
                print(type(exc).__name__)
                print(str(exc))

            # ---------------------------------------------------------
            # 10. INVALID FIELD
            # ---------------------------------------------------------

            try:

                result = await session.call_tool(
                    "analytics_query",
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
                    },
                )

                print_result(
                    "TEST 10 - INVALID FIELD",
                    result,
                )

            except Exception as exc:

                print("\n" + "=" * 70)
                print("TEST 10 - INVALID FIELD")
                print("=" * 70)
                print("Expected controlled error:")
                print(type(exc).__name__)
                print(str(exc))


if __name__ == "__main__":
    asyncio.run(main())