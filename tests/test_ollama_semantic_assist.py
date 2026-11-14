import json
from urllib.error import URLError

from tools.ollama_semantic_assist import OllamaSemanticAssistant


def _profiles():
    return [
        {
            "dataset_id": "labor_market",
            "fields": {
                "job_title": {"type": "keyword", "roles": ["dimension"]},
                "employment_months": {"type": "integer", "roles": ["metric"]},
            },
        }
    ]


def _source_profile():
    return {
        "columns": {
            "عنوان موقعیت شغلی": {
                "inferred_type": "string",
                "sample_values": ["مدیر نرم افزار"],
            },
            "Comany_CompanyOwnershipTypesFa": {"inferred_type": "string"},
            "Company_CompanyOwnershipTypesEn": {"inferred_type": "string"},
        }
    }


class _FakeResponse:
    def __init__(self, payload):
        self.payload = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return self.payload


def _fake_opener_with_content(content, captured):
    def opener(request, timeout):
        captured["url"] = request.full_url
        captured["timeout"] = timeout
        captured["body"] = json.loads(request.data.decode("utf-8"))
        return _FakeResponse({"message": {"content": json.dumps(content)}})
    return opener


def test_returns_registry_validated_suggestions_without_auto_acceptance():
    captured = {}
    model_output = {
        "suggestions": [{
            "source_field": "عنوان موقعیت شغلی",
            "candidate_dataset_id": "labor_market",
            "candidate_field": "job_title",
            "relation": "synonym",
            "confidence": 0.91,
            "rationale": "The header denotes a job position title.",
        }],
        "bilingual_pair_suggestions": [{
            "source_fields": [
                "Comany_CompanyOwnershipTypesFa",
                "Company_CompanyOwnershipTypesEn",
            ],
            "relation": "possible_translation",
            "confidence": 0.88,
            "rationale": "The headers differ by a likely spelling error.",
        }],
    }
    assistant = OllamaSemanticAssistant(
        opener=_fake_opener_with_content(model_output, captured)
    )

    result = assistant.analyze(_source_profile(), _profiles())

    assert result["status"] == "completed"
    assert len(result["suggestions"]) == 1
    assert result["suggestions"][0]["automatically_accepted"] is False
    assert len(result["bilingual_pair_suggestions"]) == 1
    assert result["bilingual_pair_suggestions"][0]["safe_to_drop"] is False
    assert result["policy"]["automatic_schema_mutation"] is False
    assert captured["url"].endswith("/api/chat")
    assert captured["body"]["model"] == "qwen3:4b"
    assert captured["body"]["think"] is False
    sent_content = captured["body"]["messages"][1]["content"]
    assert "sample_values" not in sent_content
    assert "مدیر نرم افزار" not in sent_content


def test_accepts_qwen_bilingual_pairs_compatibility_key():
    captured = {}
    model_output = {
        "suggestions": [],
        "bilingual_pairs": [{
            "source_fields": [
                "Comany_CompanyOwnershipTypesFa",
                "Company_CompanyOwnershipTypesEn",
            ],
            "relation": "possible_translation",
            "confidence": 0.88,
            "rationale": "The headers may be translated equivalents.",
        }],
    }
    assistant = OllamaSemanticAssistant(
        opener=_fake_opener_with_content(model_output, captured)
    )

    result = assistant.analyze(_source_profile(), _profiles())

    assert result["status"] == "completed"
    assert len(result["bilingual_pair_suggestions"]) == 1
    assert result["bilingual_pair_suggestions"][0]["value_equivalence_verified"] is False
    assert result["bilingual_pair_suggestions"][0]["safe_to_drop"] is False


def test_rejects_ambiguous_bilingual_pair_keys():
    captured = {}
    model_output = {
        "suggestions": [],
        "bilingual_pair_suggestions": [],
        "bilingual_pairs": [{
            "source_fields": [
                "Comany_CompanyOwnershipTypesFa",
                "Company_CompanyOwnershipTypesEn",
            ],
            "relation": "possible_translation",
            "confidence": 0.88,
            "rationale": "Potential translation.",
        }],
    }
    assistant = OllamaSemanticAssistant(
        opener=_fake_opener_with_content(model_output, captured)
    )

    result = assistant.analyze(_source_profile(), _profiles())

    assert result["status"] == "unavailable"
    assert result["error_code"] == "invalid_model_output"


def test_rejects_hallucinated_registry_fields_and_unknown_source_headers():
    captured = {}
    model_output = {
        "suggestions": [{
            "source_field": "UnknownHeader",
            "candidate_dataset_id": "labor_market",
            "candidate_field": "not_in_registry",
            "relation": "synonym",
            "confidence": 0.99,
            "rationale": "Invalid references.",
        }],
        "bilingual_pair_suggestions": [],
    }
    assistant = OllamaSemanticAssistant(
        opener=_fake_opener_with_content(model_output, captured)
    )

    result = assistant.analyze(_source_profile(), _profiles())

    assert result["status"] == "completed"
    assert result["suggestions"] == []
    assert result["rejected_model_items"] == 1


def test_rejects_invalid_confidence_and_invalid_pair_members():
    captured = {}
    model_output = {
        "suggestions": [{
            "source_field": "عنوان موقعیت شغلی",
            "candidate_dataset_id": "labor_market",
            "candidate_field": "job_title",
            "relation": "synonym",
            "confidence": 1.5,
            "rationale": "Out of range.",
        }],
        "bilingual_pair_suggestions": [{
            "source_fields": ["عنوان موقعیت شغلی", "not_a_source_field"],
            "relation": "translation",
            "confidence": 0.9,
            "rationale": "Invalid source header.",
        }],
    }
    assistant = OllamaSemanticAssistant(
        opener=_fake_opener_with_content(model_output, captured)
    )

    result = assistant.analyze(_source_profile(), _profiles())

    assert result["suggestions"] == []
    assert result["bilingual_pair_suggestions"] == []
    assert result["rejected_model_items"] == 2


def test_ollama_unavailable_returns_safe_empty_fallback():
    def unavailable_opener(_request, timeout):
        raise URLError("connection refused")

    assistant = OllamaSemanticAssistant(opener=unavailable_opener)
    result = assistant.analyze(_source_profile(), _profiles())

    assert result["status"] == "unavailable"
    assert result["error_code"] == "ollama_unavailable"
    assert result["suggestions"] == []
    assert result["bilingual_pair_suggestions"] == []
    assert result["policy"]["automatic_ingestion"] is False


def test_rejects_invalid_model_json_without_raising():
    class InvalidContentResponse(_FakeResponse):
        def __init__(self):
            self.payload = json.dumps({"message": {"content": "not-json"}}).encode("utf-8")

    assistant = OllamaSemanticAssistant(
        opener=lambda _request, timeout: InvalidContentResponse()
    )
    result = assistant.analyze(_source_profile(), _profiles())

    assert result["status"] == "unavailable"
    assert result["error_code"] == "invalid_model_json"




def test_reports_rejection_reasons_for_incomplete_qwen_output():
    captured = {}
    model_output = {
        "suggestions": [{
            "source_field": "عنوان موقعیت شغلی",
            "candidate_dataset": "labor_market",
            "candidate_field": "job_title",
            "relation": "synonym",
            "confidence": 0.9,
        }],
        "bilingual_pair_suggestions": [{
            "source_fields": [
                "Comany_CompanyOwnershipTypesFa",
                "Company_CompanyOwnershipTypesEn",
            ],
            "relation": "possible_translation",
        }],
    }
    assistant = OllamaSemanticAssistant(
        opener=_fake_opener_with_content(model_output, captured)
    )

    result = assistant.analyze(_source_profile(), _profiles())

    assert result["rejected_model_items"] == 2
    assert result["rejection_details"][0]["reasons"] == [
        "missing_or_invalid_candidate_dataset_id",
        "missing_or_invalid_rationale",
    ]
    assert result["rejection_details"][1]["reasons"] == [
        "invalid_confidence",
        "missing_or_invalid_rationale",
    ]


def test_deduplicates_deterministic_mappings_and_bilingual_pairs():
    captured = {}
    model_output = {
        "suggestions": [{
            "source_field": "عنوان موقعیت شغلی",
            "candidate_dataset_id": "labor_market",
            "candidate_field": "job_title",
            "relation": "synonym",
            "confidence": 0.91,
            "rationale": "A valid but already identified mapping.",
        }],
        "bilingual_pair_suggestions": [{
            "source_fields": [
                "Company_CompanyOwnershipTypesEn",
                "Comany_CompanyOwnershipTypesFa",
            ],
            "relation": "possible_translation",
            "confidence": 0.88,
            "rationale": "A valid but already identified pair.",
        }],
    }
    assistant = OllamaSemanticAssistant(
        opener=_fake_opener_with_content(model_output, captured)
    )

    result = assistant.analyze(
        _source_profile(),
        _profiles(),
        existing_matches=[{
            "source_field": "عنوان موقعیت شغلی",
            "best_candidate": {
                "dataset_id": "labor_market",
                "target_field": "job_title",
            },
        }],
        existing_bilingual_pairs=[{
            "fields": [
                {"name": "Comany_CompanyOwnershipTypesFa"},
                {"name": "Company_CompanyOwnershipTypesEn"},
            ],
        }],
    )

    assert result["suggestions"] == []
    assert result["bilingual_pair_suggestions"] == []
    assert result["rejected_model_items"] == 0
    assert result["duplicate_model_items"] == 2
    assert {item["kind"] for item in result["duplicate_details"]} == {
        "suggestion", "bilingual_pair",
    }
    prompt = captured["body"]["messages"][0]["content"]
    assert "candidate_dataset_id" in prompt
    assert "Every bilingual pair MUST include both confidence and rationale" in prompt


def test_rejects_invalid_configuration():
    try:
        OllamaSemanticAssistant(timeout=0)
    except ValueError as error:
        assert "timeout" in str(error)
    else:
        raise AssertionError("zero timeout must be rejected")

    try:
        OllamaSemanticAssistant(base_url="file:///tmp/ollama")
    except ValueError as error:
        assert "http" in str(error)
    else:
        raise AssertionError("non-http endpoint must be rejected")


def test_rejects_malformed_unhashable_model_fields_without_crashing():
    captured = {}
    model_output = {
        "suggestions": [{
            "source_field": ["not", "a", "string"],
            "candidate_dataset_id": "labor_market",
            "candidate_field": "job_title",
            "relation": "synonym",
            "confidence": 0.9,
            "rationale": "Malformed source field.",
        }],
        "bilingual_pair_suggestions": [{
            "source_fields": [["not", "a", "string"], "Company_CompanyOwnershipTypesEn"],
            "relation": "translation",
            "confidence": 0.9,
            "rationale": "Malformed pair member.",
        }],
    }
    assistant = OllamaSemanticAssistant(
        opener=_fake_opener_with_content(model_output, captured)
    )

    result = assistant.analyze(_source_profile(), _profiles())

    assert result["status"] == "completed"
    assert result["suggestions"] == []
    assert result["bilingual_pair_suggestions"] == []
    assert result["rejected_model_items"] == 2
