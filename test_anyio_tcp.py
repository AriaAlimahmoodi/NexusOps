import asyncio
import anyio


async def main():
    print("Testing AnyIO TCP connection...")
    print("Target: 127.0.0.1:8000")
    print()

    try:
        stream = await anyio.connect_tcp("127.0.0.1", 8000)

        print("TCP CONNECTION SUCCESS")
        print()
        print("Stream type:")
        print(type(stream).__name__)

        await stream.aclose()

    except Exception as exc:
        print("TCP CONNECTION FAILED")
        print()
        print("Exception type:")
        print(type(exc).__name__)
        print()
        print("Exception:")
        print(exc)


if __name__ == "__main__":
    asyncio.run(main())