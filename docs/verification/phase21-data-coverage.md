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

The operator reported 29,587 software/network postings and 313 hardware candidates. IDs were unique within both batches. The 119 IDs shared by the two batches agreed on activation month, job field, and canonical skill set. Counting the shared IDs once yields 29,781 distinct posting IDs for these two audited batches. This denominator applies to the audited union only. The operator ran the updated pooled audit and verified 29,781 unique posting IDs, 23,696 with recorded skills, and 6,085 without recorded skills. This accepts the live denominator reconciliation for these two batches. The validated counts are denominators, not skill-specific demand numerators.

## Live curriculum and alignment acceptance

The operator supplied the live curriculum/alignment audit from 8431a52. The real catalog contained 132 memberships in four BS program snapshots: Georgia Tech Computer Engineering 33, Illinois Computer Engineering 67, Purdue Computer Engineering 17, and Webster Computer Science 15. The snapshots contained 67 required memberships, all with recorded credits. In 127 catalog memberships the skills field contained no recorded skills. Separate syllabus statements can supply additional verified skills. The snapshots establish the registered scope, not complete degree inventories or coverage beyond the bachelor's level.

The three Computer Engineering programs compared against two market batches yielded 234 course/batch comparisons: 3 computed and 231 insufficient-evidence results. Georgia Tech ECE 2031 matched all three documented skills in the 313-posting hardware candidate batch (assembly language 5, FPGA 120, VHDL 88). The VHDL count is for this broader 313-posting scope. Purdue ECE 20875 matched its one scored skill, Python, in 29 of 313 hardware candidates and 1,745 of 29,587 software/network postings. These are observed skill-match results, not effectiveness or employment measures.

For Illinois ECE 385, the reviewed course description lists SystemVerilog, but no match was captured in the hardware candidate batch. The live report withheld a score and recommended reviewing role scope and skill capture before proposing curriculum changes. This accepts evidence-aware ranking and review decisions within published scopes.

The live checks are complete for the existing catalog, scoped alignment, audited JobVision denominators, and historical Purdue outcomes. Real curriculum expansion was subsequently verified as described below. No additional live access was needed to verify this report.

## Curriculum expansion acceptance

The operator published and verified four source-scoped excerpts in the active real curriculum catalog using d0dfbb6: eight Shahid Chamran Ahvaz bachelor records, six University of Tehran bachelor records, one Purdue ECE master's primary-area core record and one Purdue ECE doctoral primary-area core record. The totals matched the prepared batches. Tehran and Ahvaz are attributed secondary/student-association excerpts. The Purdue rows reflect official primary-area requirements excerpts. These records do not establish complete study plans or graduate-level coverage for Tehran and Ahvaz.

Phase 21 is accepted for the implemented and verified scopes: the audited two-batch labor denominator, the historical Purdue outcome route, the live evidence-aware alignment report, and the published curriculum excerpts. Broader official program verification remains a data expansion item. The publication did not require a workflow change.
