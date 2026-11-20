"""Acceptance tests for course answers and persisted index audits."""
import sys
import unittest
from unittest.mock import MagicMock, patch

from scripts.audit_elasticsearch_contracts import audit_index
from tools.dataset_registry import canonical_mapping
from tools.computational_engine.service import answer


class ElasticsearchEvidenceAcceptance(unittest.TestCase):
    def test_answer_uses_content_and_provenance_from_three_source_families(self):
        docs = {
            "curriculum_catalog_real": [
                dict(program_id="example", course_id="ECE 385", course_name="Digital Lab",
                     collection_batch="course", major="Computer Engineering", skills=["fpga"]),
            ],
            "job_postings_real": [
                dict(collection_batch="jobvision", source="JobVision", skills=["fpga"], posting_title="FPGA"),
            ],
            "labor_market": [dict(skill="fpga", demand_score=7), dict(skill="fpga", demand_score=9)],
            "us_unemployment_monthly_real": [
                dict(source="BLS", collection_batch="bls", series_id="LNS14000000",
                     month_start="2024-03-01", unemployment_rate_pct=4.2),
            ],
        }
        client = MagicMock()
        client.indices.exists.side_effect = lambda index: index in docs
        client.count.side_effect = lambda index: {"count": len(docs[index]), "_shards": {"failed": 0}}
        helpers = MagicMock()
        helpers.scan.side_effect = lambda client, index, **kwargs: (
            {"_source": row} for row in docs[index]
        )
        with patch.dict(sys.modules, {"elasticsearch.helpers": helpers}):
            report = answer(client, "GapPriority")
        row = report["courses"][0]
        self.assertEqual(row["postings_by_course_skill"], {"fpga": 1})
        self.assertEqual(row["observed_alignment_percent"], 100)
        self.assertEqual(row["market_sources"], ["JobVision"])
        self.assertEqual(row["posting_evidence_by_skill"]["fpga"]["both"], 1)
        bls = report["source_context"]["us_unemployment_monthly_real"]
        self.assertEqual(bls["classification"], "real")
        self.assertEqual(bls["geography"], "United States")
        self.assertEqual(bls["summaries"][0]["source"], "BLS")
        self.assertEqual(bls["summaries"][0]["collection_batch"], "bls")
        self.assertEqual(bls["summaries"][0]["mean"], 4.2)
        synthetic = report["source_context"]["labor_market"]
        self.assertEqual(synthetic["classification"], "synthetic")
        self.assertEqual(synthetic["summaries"][0]["mean"], 8)

    def test_contract_and_formula_detect_drift_in_published_output(self):
        mappings = {"physical": {"mappings": canonical_mapping("job_postings")}}
        mappings["physical"]["mappings"]["properties"]["skill_count"]["type"] = "keyword"
        hit = {"_id": "1", "_source": {"posting_id": "1", "job_field": "hardware",
                                      "activation_month": "2024-03", "skills": ["fpga"], "skill_count": 2}}
        report = audit_index("job_postings", "real", mappings, [hit])
        self.assertEqual(report["mapping_issues"]["physical"]["skill_count"]["expected"], "integer")
        self.assertEqual(report["stored_formula_checks"]["skill_count"]["failed"], 1)
        self.assertTrue(report["record_issues"])
