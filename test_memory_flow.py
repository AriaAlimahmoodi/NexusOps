import asyncio

from llm_mcp_client import (
    ask_nexusops,
    structured_memory_manager,
)


async def main():
    print("\n========== QUESTION 1 ==========")

    answer1 = await ask_nexusops(
        "۱۰ مهارتی که بیشترین شکاف بازار را دارند چیست؟"
    )

    print(answer1)

    print("\n========== QUESTION 2 ==========")

    answer2 = await ask_nexusops(
        "market_gap مربوط به Kubernetes چقدر است؟"
    )

    print(answer2)

    print("\n========== ADDING CONFLICT ==========")

    structured_memory_manager.store_tool_result(
        tool_name="get_top_skill_gaps",
        arguments={"limit": 10},
        data={
            "results": [
                {
                    "ranked_skill": "Docker",
                    "associated_course_id": "C013",
                    "associated_course_name": "رایانش ابری",
                    "course_coverage": 1.5,
                    "market_demand": 4.9,
                    "market_gap": 3.4,
                }
            ]
        },
    )

    print("\n========== QUESTION 3 ==========")

    answer3 = await ask_nexusops(
        "market_gap مربوط به Docker چقدر است؟"
    )

    print(answer3)

    print("\n========== MEMORY RECORDS ==========")

    for record in structured_memory_manager.structured_memory.all():
        print(record.to_dict())


if __name__ == "__main__":
    asyncio.run(main())