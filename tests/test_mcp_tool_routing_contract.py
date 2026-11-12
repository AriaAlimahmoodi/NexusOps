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


def test_domain_analytics_tool_has_explicit_evidence_boundaries():
    source = (Path(__file__).resolve().parents[1] / "server.py").read_text(encoding="utf-8")
    assert 'name="analyze_university_market"' in source
    assert "skill_trends" in source
    assert "course_effectiveness" in source
    assert "does not perform cross-index JOINs" in source
    assert "not causal educational" in source
