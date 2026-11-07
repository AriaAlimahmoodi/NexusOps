from memory import MemoryManager


def main():
    memory = MemoryManager()

    first = memory.store_tool_result(
        tool_name="get_top_skill_gaps",
        arguments={"limit": 10},
        data={
            "results": [
                {
                    "ranked_skill": "Docker",
                    "market_gap": 3.05,
                }
            ]
        },
    )

    second = memory.store_tool_result(
        tool_name="get_top_skill_gaps",
        arguments={"limit": 10},
        data={
            "results": [
                {
                    "ranked_skill": "Docker",
                    "market_gap": 3.40,
                }
            ]
        },
    )

    print("ACTIVE:")

    for record in memory.get_verified_tool_results(
        tool_name="get_top_skill_gaps"
    ):
        print(
            record.memory_id,
            record.status,
            record.data,
        )

    print("\nHISTORY:")

    for record in memory.find_records(
        record_type="tool_result",
        tool_name="get_top_skill_gaps",
        active_only=False,
    ):
        print(
            record.memory_id,
            record.status,
            record.data,
        )


if __name__ == "__main__":
    main()