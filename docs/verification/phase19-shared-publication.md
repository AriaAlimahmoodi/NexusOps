# Phase 19 shared course evidence

The operator verified the read-only migration review. Six Phase 17 rows produced three course-skill groups, each matched to reviewed course evidence with both origins retained.

The operator then verified the live skill lookup implemented in a5ea5ce. Searching for VHDL without a dataset ID returned Georgia Tech ECE 2031 and Johns Hopkins University 525.677.81 once each, with two origins per result. This accepts the migrated VHDL evidence lookup through the shared alias.

The operator verified shared search through the Persian chat and published a repeat copy of the reviewed CSV through the intake UI. The same query with the dataset ID blank returned the same two courses exactly once each. Each result retained its two original provenance references and included the new CSV publication as a third reference. This verifies live intake-to-shared-search integration and deduplication for the reviewed VHDL course evidence.

## Final live acceptance

The operator verified the real catalog listing in the Persian UI. After publication of a reviewed non-FPGA course through CSV intake, the UI displayed the shared-search confirmation. In the deployed UI, that success branch clears the dataset selection. The subsequent general Python query returned CS50P with the official course description and the CSV provenance. The VHDL regression still returned both previously accepted courses with their provenance.

Phase 19 is complete for reviewed educational intake, shared course-skill discovery, and the live real-catalog listing. The catalog listing covered the active catalog. Market-count reconciliation and Phase 20 n8n integration were outside these checks. The workflow export did not change.
