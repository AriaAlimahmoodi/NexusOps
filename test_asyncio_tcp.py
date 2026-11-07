import asyncio


async def main():
    print("Testing asyncio TCP connection...")
    print("Target: 127.0.0.1:8000")
    print()

    try:
        reader, writer = await asyncio.open_connection(
            "127.0.0.1",
            8000,
        )

        print("ASYNCIO TCP CONNECTION SUCCESS")
        print()
        print("Reader:", type(reader).__name__)
        print("Writer:", type(writer).__name__)

        writer.close()
        await writer.wait_closed()

    except Exception as exc:
        print("ASYNCIO TCP CONNECTION FAILED")
        print()
        print("Exception type:")
        print(type(exc).__name__)
        print()
        print("Exception:")
        print(repr(exc))


if __name__ == "__main__":
    asyncio.run(main())