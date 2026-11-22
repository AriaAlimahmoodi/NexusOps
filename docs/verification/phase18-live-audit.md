# Phase 18 live audit

The operator supplied the successful read-only inventory from the main Elasticsearch environment. Live Elasticsearch inventory is accepted. This record captures migration decisions.

| Area | Decision |
| --- | --- |
| Market demand | Resolve active real-data aliases. Count each eligible posting once per canonical skill. Report the denominator and missing skill evidence. Verify cross-batch overlap before pooling. |
| Curriculum | Use the real catalog for course discovery and verified, versioned syllabus evidence for content claims. Require a complete mandatory-course inventory for coverage and complete credits for credit-weighted coverage. |
| Pilot and dynamic publications | Preserve originals. Migrate eligible source rows into searchable records after validating provenance, semantic identity, and evidence type. Keep pilot summaries out of posting-level counts. |
| Graduate outcomes | Require a real cohort, defined follow-up, and observed outcomes. Return insufficient evidence until these requirements are met. |
| Legacy routes | Retain synthetic and historical data for regression. Replace synthetic defaults and legacy market scores in public routes. Preserve exact-ID lookup and deterministic calculations. |
| Persian chat | Move the public UI to the operational n8n and MCP path in Phase 20. Use a shared execution identifier and verify from the UI through Elasticsearch. |

Phase 19 starts with canonical publication, real-data discovery, and migration verification. Phase 18 acceptance covers the Elasticsearch inventory. The operator also supplied main-environment n8n execution #871, marked Succeeded on 2026-11-22. The corresponding trace `nx-871` shows a successful `skill_evidence` MCP call and a parsed result for the Python market and curriculum comparison. The Autosave history link identifies a workflow revision. The supplied execution metadata does not establish whether the message entered through the Production URL.
