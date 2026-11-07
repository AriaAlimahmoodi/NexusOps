
import asyncio

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client


async def main():
    async with streamable_http_client(
        "http://127.0.0.1:8000/mcp"
    ) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()

            result = await session.list_tools()
            tool = result.tools[0]

            print("Tool type:", type(tool))
            print("Tool fields:", type(tool).model_fields.keys())
            print("Tool data:", tool.model_dump())


if __name__ == "__main__":
    asyncio.run(main())
