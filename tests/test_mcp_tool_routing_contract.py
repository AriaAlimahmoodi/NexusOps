from pathlib import Path


def test_mcp_tool_descriptions_define_non_overlapping_routing_precedence():
    source = (
        Path(__file__).resolve().parents[1] / "server.py"
    ).read_text(encoding="utf-8")

    assert "TOOL SELECTION PRECEDENCE:" in source
    assert (
        "Use analytics_query for general-purpose data analysis, including custom"
        in source
    )
    assert (
        "Use get_top_market_skills only for its predefined top-N demand ranking."
        in source
    )
    assert (
        "Use get_top_skill_gaps only for its predefined top-N skill-gap ranking."
        in source
    )
    assert (
        "For custom filters, compound conditions, multiple metrics, grouping,"
        in source
    )
    assert (
        "MANDATORY for questions involving market demand" not in source
    )
    assert (
        "MANDATORY for questions involving university coverage" not in source
    )
