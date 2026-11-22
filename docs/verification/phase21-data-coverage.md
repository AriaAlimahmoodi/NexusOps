# Phase 21 data coverage and analytical evidence

Baseline: Phase 20 acceptance at fc3c338. Its successful catalog, VHDL and scoped Python queries are regression checks for Phase 21.

| Workstream | First deliverable | Acceptance |
| --- | --- | --- |
| Curriculum | Inventory active catalog by institution, program, study level and version. Prioritize official programs and course outlines from universities in Tehran and Ahvaz. | Validate identity, required/elective status, credit completeness and provenance. Test integrated lists across eligible programs and source retrieval by course. |
| Labor market | Inventory active posting batches by role, calendar coverage and availability of skill evidence. | Reconcile unique-posting counts across contributing batches before pooling. Independently reproduce numerator, denominator and unknown-skill count. |
| Graduate outcomes | Identify a real program-level cohort with graduation period, follow-up window, eligible population and observed outcomes. | Independently reproduce the rate for a clearly labeled population, report unknown outcomes and exercise insufficient-evidence behavior. |
| Course alignment and review | Join canonical skill mentions and comparable market scopes. Keep competencies and assessed outcomes distinct from mentions. | Reproduce ranking from versioned inputs and support each review proposal with the corresponding course and market evidence. |

## Graduate outcome gap

The existing graduate profile requires job title, job field and employment months. Those fields cannot identify all eligible graduates or distinguish non-employment from missing follow-up. A real outcome contract must represent both states separately, preserve cohort and follow-up scope, and count each graduate once within that scope. An observed-response rate uses employed divided by respondents with known eligible outcomes, with the response denominator and cohort coverage disclosed. A cohort-wide rate requires complete outcome coverage or a justified statistical design with explicit assumptions. Source selection and validation precede publication of either metric.

Course effect claims require linked completed courses and later outcomes, with a defensible study design. Market alignment is a separate, directly measurable indicator.

## Status

Phase 21 has started. This document records the initial contract review and acceptance targets. The operator reproduced the Purdue Computer Engineering May 2014 figures through the CLI and supplied the rendered evidence-tool answer after updating the server: 46 of 55 reported destinations in the employed category (83.64%), response coverage of 55 of 59 (93.22%), and insufficient evidence for a cohort-wide rate. This verifies the scoped historical calculation and rendered answer. The operator supplied successful Production trace `nx-893` with one successful result and zero failures after restoring the tracked cohort file to the sparse worktree. The live response retained the cohort, source locator, exact denominators and insufficient-evidence status. This accepts the file-backed historical cohort route. The curriculum and labor-market coverage workstreams remain open.

## JobVision overlap audit

The operator reported 29,587 software/network postings and 313 hardware candidates. IDs were unique within both batches. The 119 IDs shared by the two batches agreed on activation month, job field, and canonical skill set. Counting the shared IDs once yields 29,781 distinct posting IDs for these two audited batches. This denominator applies to the audited union only. The live split by recorded-skill availability still requires the updated pooled audit.
