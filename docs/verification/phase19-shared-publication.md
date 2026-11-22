# Phase 19 shared course evidence

The operator verified the read-only migration review. Six Phase 17 rows produced three course-skill groups, each matched to reviewed course evidence with both origins retained.

The operator then verified the live skill lookup implemented in a5ea5ce. Searching for VHDL without a dataset ID returned Georgia Tech ECE 2031 and Johns Hopkins University 525.677.81 once each, with two origins per result. This accepts the migrated VHDL evidence lookup through the shared alias.

The operator verified shared search through the Persian chat and published a repeat copy of the reviewed CSV through the intake UI. The same query with the dataset ID blank returned the same two courses exactly once each. Each result retained its two original provenance references and included the new CSV publication as a third reference. This verifies live intake-to-shared-search integration and deduplication for the reviewed VHDL course evidence.

This acceptance covers the reviewed FPGA course corpus. Admission of previously unreviewed syllabi, catalog-wide discovery, and reconciliation with market counts were not exercised. The separate automatic chat-mode selection change was not verified by this run. The workflow export has not changed.
