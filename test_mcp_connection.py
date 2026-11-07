import asyncio
import traceback

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client


MCP_URL = "http://127.0.0.1:8000/mcp"


async def main():
    print("Connecting to MCP...")

    try:
        async with streamable_http_client(MCP_URL) as (
            read_stream,
            write_stream,
        ):
            print("HTTP transport connected.")

            async with ClientSession(
                read_stream,
                write_stream,
            ) as session:
                print("ClientSession created.")
                print("Calling initialize...")

                result = await session.initialize()

                print()
                print("MCP initialize succeeded.")
                print(result)

                print()
                print("Calling list_tools...")

                tools = await session.list_tools()

                print()
                print("Available tools:")

                for tool in tools.tools:
                    print(f"- {tool.name}")

    except Exception as exc:
        print()
        print("=" * 70)
        print("MCP CLIENT ERROR")
        print("=" * 70)
        print()
        print("Exception type:")
        print(type(exc).__name__)
        print()
        print("Exception:")
        print(exc)
        print()
        print("Full traceback:")
        traceback.print_exc()
        print()
        print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())