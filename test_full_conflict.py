import asyncio

from memory import MemoryManager
from llm_mcp_client import (
    structured_memory_manager,
    ask_nexusops,
)


async def main():
    print("=" * 60)
    print("STEP 1 - Inject old verified result")
    print("=" * 60)

    structured_memory_manager.store_tool_result(
        tool_name="get_top_skill_gaps",
        arguments={"limit": 10},
        data={
            "results": [
                {
                    "ranked_skill": "Docker",
                    "course_coverage": 1.5,
                    "market_demand": 4.55,
                    "market_gap": 3.05,
                    "associated_course_id": "C013",
                    "associated_course_name": "رایانش ابری",
                }
            ]
        },
    )

    print("Old result stored: Docker = 3.05")

    print("\n" + "=" * 60)
    print("STEP 2 - Ask NexusOps")
    print("=" * 60)

    answer = await ask_nexusops(
        "market_gap مربوط به Docker چقدر است؟"
    )

    print("\nNexusOps answer:")
    print(answer)

    print("\n" + "=" * 60)
    print("STEP 3 - Active memory")
    print("=" * 60)

    active_records = (
        structured_memory_manager.get_verified_tool_results(
            tool_name="get_top_skill_gaps"
        )
    )

    for record in active_records:
        print(
            record.memory_id,
            "| status =", record.status,
            "| data =", record.data,
        )

    print("\n" + "=" * 60)
    print("STEP 4 - Full history")
    print("=" * 60)

    history = structured_memory_manager.find_records(
        record_type="tool_result",
        tool_name="get_top_skill_gaps",
        active_only=False,
    )

    for record in history:
        print(
            record.memory_id,
            "| status =", record.status,
            "| data =", record.data,
        )


if __name__ == "__main__":
    asyncio.run(main())