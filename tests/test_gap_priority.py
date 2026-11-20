import copy
import unittest

from tools.computational_engine.gap_priority import compute_gap_priority


class GapPriorityTest(unittest.TestCase):
    def setUp(self):
        identity = dict(skill_id="sql", role_id="analyst")
        self.market = dict(identity, geography="example", start_date="2024-01-01",
                           end_date="2024-12-31", population="analyst postings",
                           denominator_definition="unique postings with listed skills",
                           source_reference="fixture:market", matching_postings=20,
                           assessable_postings=100)
        context = dict(identity, program_id="program", level="intro", reference_version="1")
        self.target = dict(context, competency_ids=list("abcde"), minimum_covered=4,
                           source_reference="fixture:target")
        self.curriculum = dict(context, source_reference="fixture:curriculum", competencies={
            cid: dict(status="taught_and_assessed" if cid in "ab" else "verified_not_covered",
                      source_reference=f"fixture:assessment:{cid}") for cid in "abcde"
        })

    def test_actionable_deficit(self):
        result = compute_gap_priority("sql", self.market, self.target, self.curriculum)
        self.assertEqual(result["result"], 10)
        self.assertEqual(result["competencies_needed"], 2)
        self.assertEqual(result["verified_gaps"], list("cde"))

    def test_missing_target_is_not_numeric(self):
        result = compute_gap_priority("sql", self.market)
        self.assertEqual(result["limitation"], "missing_competency_target")
        self.assertIsNone(result["result"])

    def test_missing_and_mention_only_evidence_are_unknown(self):
        curriculum = copy.deepcopy(self.curriculum)
        del curriculum["competencies"]["c"]
        curriculum["competencies"]["d"]["status"] = "mention_only"
        result = compute_gap_priority("sql", self.market, self.target, curriculum)
        self.assertEqual(result["unknown_competencies"], list("cd"))
        self.assertIsNone(result["result"])

    def test_target_met_produces_zero(self):
        target = dict(self.target, minimum_covered=2)
        result = compute_gap_priority("sql", self.market, target, self.curriculum)
        self.assertEqual(result["status"], "computed")
        self.assertEqual(result["result"], 0)

    def test_invalid_target_and_mismatched_scope(self):
        with self.assertRaises(ValueError):
            compute_gap_priority("sql", self.market, dict(self.target, minimum_covered=0))
        with self.assertRaises(ValueError):
            compute_gap_priority("sql", self.market, self.target,
                                 dict(self.curriculum, level="advanced"))

    def test_empty_market(self):
        market = dict(self.market, matching_postings=0, assessable_postings=0)
        result = compute_gap_priority("sql", market, self.target, self.curriculum)
        self.assertEqual(result["limitation"], "empty_market_population")
        self.assertIsNone(result["result"])

    def test_reversed_dates_and_impossible_counts(self):
        with self.assertRaises(ValueError):
            compute_gap_priority("sql", dict(self.market, start_date="2025-01-01"))
        with self.assertRaises(ValueError):
            compute_gap_priority("sql", dict(self.market, matching_postings=101))
