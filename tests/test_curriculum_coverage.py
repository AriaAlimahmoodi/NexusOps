from copy import deepcopy
import json
from pathlib import Path

import pytest

from scripts.compute_curriculum_coverage import run
from test_atomic_data_publisher import FakeClient, install_fake_bulk
from tools.computational_engine.curriculum import compute_curriculum_coverage


FIXTURE = Path(__file__).parent / "fixtures" / "curriculum-coverage.json"
SCOPE = {"program_id": "CS", "major": "Computer Science", "study_level": "BSc"}


def _compute(rows, expected=None):
    return compute_curriculum_coverage(
        rows, scope=SCOPE, skill_id="python", skill_vocabulary=["python"],
        expected_required_course_ids=["C01"] if expected is None else expected,
    )


def test_spec_example_uses_approved_scope_and_versioned_metrics():
    report = run(FIXTURE)
    assert report["validation_status"] == "passed"
    assert report["input_records"] == 5
    metrics = report["result"]
    assert metrics["mandatory_course_coverage"]["result"] == 50
    assert metrics["mandatory_credit_coverage"]["result"] == 40
    assert metrics["mandatory_credit_coverage"]["metric_version"] == "1.0.0"
    assert report["provenance"]["inventory_reference"]
    assert run(FIXTURE)["result"] == metrics

    with pytest.raises(ValueError, match="Publication requires a real source"):
        run(FIXTURE, apply=True)


def test_missing_credits_affect_only_the_credit_measure_and_zero_is_explicit():
    row = {**SCOPE, "course_id": "C01", "course_type": "required", "skills": ["python"]}
    result = _compute([row])
    assert result["mandatory_course_coverage"]["result"] == 100
    assert result["mandatory_credit_coverage"]["limitation"] == "missing_required_course_credits"
    assert result["mandatory_credit_coverage"]["result"] is None
    assert _compute([{**row, "credits": 0}])["mandatory_credit_coverage"]["limitation"] == "zero_denominator"
    assert _compute([], expected=[])["mandatory_course_coverage"]["limitation"] == "zero_denominator"


@pytest.mark.parametrize(("changes", "error"), [
    ({"course_type": None}, "Unknown course type"),
    ({"course_type": "elective"}, "inventory mismatch"),
    ({"skills": None}, "Missing skill evidence"),
    ({"skills": ["unmapped"]}, "Unreviewed skill"),
    ({"study_level": "MSc"}, "outside the requested program"),
])
def test_quality_gates_reject_invalid_or_incomplete_program(changes, error):
    row = {**SCOPE, "course_id": "C01", "course_type": "required", "skills": [], **changes}
    with pytest.raises(ValueError, match=error):
        _compute([row])


def test_csv_to_normalized_input_to_atomic_alias(tmp_path, monkeypatch):
    import config

    class Connection(FakeClient):
        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def info(self):
            return {"version": {"number": "test"}}

    client = Connection()
    install_fake_bulk(monkeypatch)
    monkeypatch.setattr(config, "get_elasticsearch_client", lambda: client)
    spec = json.loads(FIXTURE.read_text())
    source = tmp_path / "catalog.csv"
    source.write_bytes(FIXTURE.with_suffix(".csv").read_bytes())
    spec["source"]["uri"] = source.name
    # Use only a fake publisher to exercise the operator's real-input branch.
    spec["source_classification"] = "real"
    config_path = tmp_path / "config.json"
    config_path.write_text(json.dumps(spec))

    report = run(config_path, apply=True)
    assert report["input_publication"]["indexed_records"] == 5
    physical_index = client.aliases["curriculum_catalog_real"]
    stored = client.documents[physical_index]
    row = stored[f"{report['provenance']['collection_batch']}::CS-BSC::C01"]
    assert row["course_type"] == "required"
    assert row["skills"] == ["python"]
    assert row["credits"] == 3
    assert "Notes" not in row
    assert "mandatory_course_coverage" not in row

    invalid = deepcopy(spec)
    invalid["inventory"]["required_course_ids"].append("C05")
    config_path.write_text(json.dumps(invalid))
    with pytest.raises(ValueError, match="inventory mismatch"):
        run(config_path, apply=True)
    assert client.aliases["curriculum_catalog_real"] == physical_index
