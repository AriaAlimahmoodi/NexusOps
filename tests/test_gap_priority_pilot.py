import unittest
from unittest.mock import patch

from scripts.compute_gap_priority import pilot_inputs
from tools.computational_engine.gap_priority import compute_gap_priority


class GapPriorityPilotTest(unittest.TestCase):
    def test_recorded_pilot_is_insufficient_for_competency_score(self):
        # These counts came from the verified JobVision and Purdue run.
        evidence = {
            "skill_id": "python",
            "market": {
                "scope": {
                    "country": "Iran", "first_activation_month": "2022-03",
                    "last_activation_month": "2024-03", "index": "job_postings_real",
                    "collection_batch": "5ea2992462bba91dd6afe2d48f7e3878cc3a11c800f16472d60a66b4d1c13293",
                    "categories": ["software development", "network and DevOps"],
                },
                "postings_with_recorded_skills": {"numerator": 1745, "denominator": 23528},
            },
            "education": {"required_courses": {"numerator": 1, "denominator": 15}},
        }
        with patch("tools.computational_engine.service.answer", return_value=evidence):
            payload, education = pilot_inputs(object())
        result = compute_gap_priority(**payload)
        self.assertAlmostEqual(result["demand"]["share"], 1745 / 23528)
        self.assertEqual(result["market_scope"]["end_date"], "2024-03-31")
        self.assertEqual(education["required_courses"]["numerator"], 1)
        self.assertEqual(result["limitation"], "missing_competency_target")
        self.assertIsNone(result["result"])
