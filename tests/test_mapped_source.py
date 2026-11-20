import csv
import json
from pathlib import Path

import pytest

from scripts.ingest_mapped_source import build
from tools.computational_engine.field_rules import evaluate_rule
from tools.source_ingestion_preflight import audit_source_ingestion_preflight


def test_jobvision_projection_and_scope(tmp_path):
    config = json.loads(Path("configs/mappings/jobvision.json").read_text(encoding="utf-8"))
    category = config["scope"]["values"][0]
    path = tmp_path / "input.csv"
    with path.open("w", newline="", encoding="utf-8") as stream:
        writer = csv.writer(stream)
        writer.writerow(["RowNumber", "Jobpost_MainJobCategory", "Jobpost_ActivationTime_YEAR_MONTH", "Jobpost_SoftwareSkills"])
        writer.writerow(["1", category, "2024-01", '[{"TitleEn":" Python "},{"TitleEn":"PYTHON"}]'])
        writer.writerow(["2", category, "2024-01", ""])
        writer.writerow(["3", "unrelated", "2024-01", ""])
    batch, options = build(config, path, "2026-11-20T00:00:00Z")
    report = audit_source_ingestion_preflight(*batch, **options)
    assert report["decision"] == "preflight_passed"
    assert report["total_records"] == 2
    rows = list(options["adapter_registry"].iter_records(batch[1], batch[2]))
    assert [(row["labels"], row["total_labels"]) for row in rows] == [(["python"], 1), ([], 0)]


@pytest.mark.parametrize("op, expected", [("ratio", .5), ("percentage", 50), ("difference", -2)])
def test_numeric_rules(op, expected):
    assert evaluate_rule({"x": 2, "y": 4}, {"op": op, "inputs": ["x", "y"]}) == expected


def test_second_index_using_json_and_same_pipeline(tmp_path):
    config = json.loads(Path("configs/mappings/jobvision.json").read_text(encoding="utf-8"))
    config.update(dataset="us_unemployment_monthly", format="json", options={"mode": "jsonl"},
                  fields={"series": "series_id", "date": "month_start", "rate": "unemployment_rate_pct",
                          "fraction": "unemployment_rate_fraction"},
                  rules=[{"op": "ratio", "inputs": ["rate", "base"], "output": "fraction"}])
    del config["scope"]
    path = tmp_path / "input.jsonl"
    path.write_text(json.dumps({"series": "test", "date": "2025-01-01", "rate": 4, "base": 100}))
    batch, options = build(config, path, "2026-11-20T00:00:00Z")
    result = audit_source_ingestion_preflight(*batch, **options)
    assert result["valid_records"] == 1
    record, = options["adapter_registry"].iter_records(batch[1], batch[2])
    assert record["fraction"] == .04
