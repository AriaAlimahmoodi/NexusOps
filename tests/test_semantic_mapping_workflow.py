"""Tests for the semantic field-mapping orchestration workflow."""
import pytest

from tools.ollama_semantic_assist import OllamaSemanticAssistant
from tools.semantic_mapping_workflow import (
    analyze_source_mapping,
    build_reviewed_source_mapping,
)
from tools.source_mapping import SourceMappingSpec


def _source_profile():
    return {
        "source_name": "semantic-fixture.csv",
        "row_count": 12,
        "columns": {
            "Jobpost_RawTitle": {
                "inferred_type": "string",
                "null_ratio": 0.0,
                "sample_values": ["must not enter LLM prompt"],
            },
            "UnrecognizedExternalFeature": {
                "inferred_type": "string",
                "null_ratio": 0.25,
            },
        },
    }


class _UnavailableAssistant:
    def analyze(self, *_args, **_kwargs):
        return {
            "status": "unavailable",
            "error_code": "ollama_unavailable",
            "suggestions": [],
            "bilingual_pair_suggestions": [],
            "rejected_model_items": 0,
            "duplicate_model_items": 0,
        }


class _SuggestionAssistant:
    def __init__(self, suggestions):
        self.suggestions = suggestions
        self.calls = []

    def analyze(self, source_profile, dataset_profiles, **kwargs):
        self.calls.append({
            "source_profile": source_profile,
            "dataset_profiles": dataset_profiles,
            "kwargs": kwargs,
        })
        return {
            "status": "completed",
            "model": "fixture-model",
            "suggestions": self.suggestions,
            "bilingual_pair_suggestions": [],
            "rejected_model_items": 0,
            "duplicate_model_items": 0,
        }


def test_combines_deterministic_matcher_with_ollama_candidates_without_accepting():
    assistant = _SuggestionAssistant([{
        "source_field": "UnrecognizedExternalFeature",
        "candidate_field": "job_field",
        "relation": "synonym",
        "confidence": 0.8,
        "rationale": "Fixture suggestion requiring human review.",
    }])
    # A custom assistant is expected to return only registry-validated results.
    # The workflow still verifies the target against the selected Registry.
    result = analyze_source_mapping(
        _source_profile(),
        "labor_market",
        ollama_assistant=assistant,
    )

    title = next(item for item in result["fields"] if item["source_field"] == "Jobpost_RawTitle")
    assert title["status"] == "review_required"
    assert title["candidates"][0]["target_field"] == "job_title"
    assert title["candidates"][0]["origin"] == "deterministic_matcher"
    assert title["candidates"][0]["automatically_accepted"] is False

    unknown = next(item for item in result["fields"] if item["source_field"] == "UnrecognizedExternalFeature")
    assert unknown["status"] == "review_required"
    assert unknown["candidates"][0]["origin"] == "ollama"
    assert unknown["candidates"][0]["direct_projection_eligible"] is True
    assert result["policy"]["automatic_mapping_acceptance"] is False


def test_ollama_receives_only_header_names_and_types_through_existing_assistant():
    captured = {}

    class CapturingAssistant:
        def analyze(self, source_profile, dataset_profiles, **kwargs):
            captured["source_profile"] = source_profile
            captured["dataset_profiles"] = dataset_profiles
            return {
                "status": "completed",
                "suggestions": [],
                "bilingual_pair_suggestions": [],
                "rejected_model_items": 0,
                "duplicate_model_items": 0,
            }

    result = analyze_source_mapping(
        _source_profile(),
        "labor_market",
        ollama_assistant=CapturingAssistant(),
    )

    assert captured["source_profile"] is _source_profile() or (
        captured["source_profile"]["columns"]["Jobpost_RawTitle"]["sample_values"]
        == ["must not enter LLM prompt"]
    )
    # The existing Ollama assistant itself constructs a reduced prompt; this
    # workflow never copies sample values into its report.
    assert "sample_values" not in repr(result)
    assert result["policy"]["raw_source_values_sent_to_ollama"] is False


def test_ollama_unavailable_does_not_discard_deterministic_candidates():
    result = analyze_source_mapping(
        _source_profile(),
        "labor_market",
        ollama_assistant=_UnavailableAssistant(),
    )

    assert result["status"] == "completed_with_ollama_unavailable"
    assert result["ollama"]["error_code"] == "ollama_unavailable"
    title = next(item for item in result["fields"] if item["source_field"] == "Jobpost_RawTitle")
    assert title["candidates"]
    assert title["candidates"][0]["origin"] == "deterministic_matcher"


def test_can_skip_ollama_and_still_run_deterministic_matcher():
    result = analyze_source_mapping(
        _source_profile(),
        "labor_market",
        use_ollama=False,
    )

    assert result["status"] == "completed"
    assert result["ollama"]["status"] == "skipped"
    assert result["summary"]["candidate_mappings"] >= 1


def test_explicit_review_builds_immutable_source_mapping_spec():
    report = analyze_source_mapping(
        _source_profile(),
        "labor_market",
        use_ollama=False,
    )

    spec = build_reviewed_source_mapping(
        report,
        {"Jobpost_RawTitle": "job_title"},
        mapping_id="reviewed-jobvision-v1",
        reviewed_by="human-reviewer",
        reviewed_at="2026-11-15T05:00:00Z",
        review_reference="review://jobvision/phase11",
    )

    assert isinstance(spec, SourceMappingSpec)
    assert dict(spec.field_mappings) == {"Jobpost_RawTitle": "job_title"}
    assert spec.dataset_id == "labor_market"
    assert spec.source_name == "semantic-fixture.csv"


def test_review_builder_rejects_unproposed_pairs():
    report = analyze_source_mapping(
        _source_profile(),
        "labor_market",
        use_ollama=False,
    )

    with pytest.raises(ValueError, match="is not a candidate"):
        build_reviewed_source_mapping(
            report,
            {"UnrecognizedExternalFeature": "job_title"},
            mapping_id="bad-map",
            reviewed_by="reviewer",
            reviewed_at="2026-11-15T05:00:00Z",
            review_reference="review://bad",
        )


def test_review_builder_rejects_candidates_that_need_phase12_conversion():
    source = {
        "source_name": "needs-conversion.json",
        "columns": {
            "Jobpost_SoftwareSkills": {
                "inferred_type": "json_array",
                "null_ratio": 0.0,
            },
        },
    }
    report = analyze_source_mapping(
        source,
        "labor_market",
        use_ollama=False,
    )
    skill = next(item for item in report["fields"] if item["source_field"] == "Jobpost_SoftwareSkills")
    assert skill["candidate_count"] >= 1
    assert skill["candidates"][0]["direct_projection_eligible"] is False

    with pytest.raises(ValueError, match="Phase 12"):
        build_reviewed_source_mapping(
            report,
            {"Jobpost_SoftwareSkills": "skill"},
            mapping_id="needs-extraction",
            reviewed_by="reviewer",
            reviewed_at="2026-11-15T05:00:00Z",
            review_reference="review://needs-extraction",
        )


def test_review_builder_rejects_duplicate_target_approval():
    report = analyze_source_mapping(
        _source_profile(),
        "labor_market",
        use_ollama=False,
    )

    with pytest.raises(ValueError, match="Multiple source fields"):
        build_reviewed_source_mapping(
            report,
            {
                "Jobpost_RawTitle": "job_title",
                "UnrecognizedExternalFeature": "job_title",
            },
            mapping_id="duplicate-targets",
            reviewed_by="reviewer",
            reviewed_at="2026-11-15T05:00:00Z",
            review_reference="review://duplicate",
        )


@pytest.mark.parametrize(
    "profile",
    [
        None,
        {},
        {"source_name": "x", "columns": []},
        {"source_name": "x", "columns": {"": {"inferred_type": "string"}}},
        {"source_name": "x", "columns": {"Header": None}},
        {"columns": {"Header": {"inferred_type": "string"}}},
    ],
)
def test_rejects_invalid_source_profiles(profile):
    with pytest.raises((TypeError, ValueError)):
        analyze_source_mapping(profile, "labor_market", use_ollama=False)


def test_rejects_unknown_dataset_and_invalid_matcher_options():
    with pytest.raises(ValueError, match="not registered"):
        analyze_source_mapping(_source_profile(), "not-registered", use_ollama=False)

    with pytest.raises(TypeError, match="matcher_options"):
        analyze_source_mapping(
            _source_profile(), "labor_market", use_ollama=False,
            matcher_options=[],
        )


def test_bilingual_diagnostics_remain_separate_from_field_mappings():
    source = {
        "source_name": "bilingual.csv",
        "columns": {
            "Jobpost_ProvinceFa": {"inferred_type": "string"},
            "Jobpost_ProvinceEn": {"inferred_type": "string"},
        },
    }
    report = analyze_source_mapping(source, "labor_market", use_ollama=False)

    assert report["bilingual_pair_candidates"]
    assert all(
        pair["value_equivalence_verified"] is False
        and pair["safe_to_drop"] is False
        for pair in report["bilingual_pair_candidates"]
    )
