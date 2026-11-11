import asyncio
import httpx2

async def main():
    async with httpx2.AsyncClient(
        trust_env=False,
        timeout=5,
    ) as client:
        response = await client.get("http://127.0.0.1:8000/mcp")
        print("HTTP status:", response.status_code)
        print("Response:", response.text[:300])

asyncio.run(main())
