import asyncio
import json

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

MCP_URL = "http://127.0.0.1:8000/mcp"

from llm_mcp_client import extract_structured_tool_result


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

            result = await session.call_tool(
                "get_top_skill_gaps",
                arguments={
                    "limit": 10,
                },
            )

            structured = extract_structured_tool_result(
                result
            )

            print("\n=== STRUCTURED RESULT ===")

            print(
                json.dumps(
                    structured,
                    ensure_ascii=False,
                    indent=2,
                    default=str,
                )
            )


if __name__ == "__main__":
    asyncio.run(main())