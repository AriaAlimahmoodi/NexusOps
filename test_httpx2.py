import asyncio
import httpx2


URL = "http://127.0.0.1:8000/mcp"


async def main():
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2025-06-18",
            "capabilities": {},
            "clientInfo": {
                "name": "httpx2-test",
                "version": "1.0",
            },
        },
    }

    print("Testing httpx2...")
    print("URL:", URL)
    print()

    async with httpx2.AsyncClient() as client:
        try:
            response = await client.post(
                URL,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json, text/event-stream",
                },
            )

            print("HTTP status:", response.status_code)
            print()
            print("Response headers:")
            print(response.headers)
            print()
            print("Response body:")
            print(response.text)

        except Exception as exc:
            print("REQUEST FAILED")
            print()
            print("Exception type:")
            print(type(exc).__name__)
            print()
            print("Exception:")
            print(exc)


if __name__ == "__main__":
    asyncio.run(main())