from memory import MemoryManager


def main():
    memory = MemoryManager()

    print("\n========== REQUEST 1: LIMIT 10 ==========")

    record_10 = memory.store_tool_result(
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

    print(record_10.to_dict())

    print("\n========== REQUEST 2: LIMIT 20 ==========")

    record_20 = memory.store_tool_result(
        tool_name="get_top_skill_gaps",
        arguments={"limit": 20},
        data={
            "results": [
                {
                    "ranked_skill": "Docker",
                    "market_gap": 3.40,
                }
            ]
        },
    )

    print(record_20.to_dict())

    print("\n========== ACTIVE RECORDS ==========")

    active_records = memory.get_verified_tool_results(
        tool_name="get_top_skill_gaps"
    )

    for record in active_records:
        print(record.to_dict())

    print("\n========== ALL RECORDS ==========")

    for record in memory.structured_memory.all():
        print(record.to_dict())

    print("\n========== STATUS CHECK ==========")

    for record in memory.structured_memory.all():
        print(
            record.memory_id,
            "| signature =",
            record.metadata.get("request_signature"),
            "| status =",
            record.status,
        )


if __name__ == "__main__":
    main()