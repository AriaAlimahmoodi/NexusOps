# Phase 14 FPGA course evidence

The university review uses the Phase 13 title-scoped JobVision Iran FPGA pilot of 120 postings. The review includes FPGA as the role technology, the three frequent structured skills VHDL (87), Verilog (52), and MATLAB (42), and SystemVerilog as the Phase 13 cross-source check. The domestic snapshot showed zero recorded SystemVerilog mentions in available fields. The international cross-check and the published courses each have separate scopes.

| Course | Publication reviewed | Role in the pilot |
| --- | --- | --- |
| Georgia Tech ECE 2031, Spring 2027, section C | Entire 12-page official hybrid syllabus PDF | Digital hardware lab with direct FPGA and VHDL evidence |
| Georgia Tech ECE 2020, Fall 2026, section A | Entire 3-page official syllabus PDF | Digital design prerequisite for ECE 2031 |
| Illinois ECE 385, Spring 2027 offering | Official description and departmental outline, last updated 2025-05-14 | Digital systems lab with direct FPGA and SystemVerilog evidence |
| Boston University ENG EC 551, Fall 2026 | Official catalog description and offering schedule | Direct Verilog and FPGA evidence |
| Johns Hopkins 525.677.81, Fall 2026 | Public abridged syllabus for section 81 | Direct MATLAB, VHDL, and FPGA evidence |

[Review data](../../configs/evidence/fpga-course-syllabi.json) records official URLs, version and section details, the SHA-256 of each reviewed PDF, and the exact phrase and source location for each positive result. Page numbers refer to PDF viewer pages including front matter. The absence review covered all PDF pages and checked standalone skill names and variants such as FPGAs, field-programmable gate array, VHSIC Hardware Description Language, System Verilog, System-Verilog, and MathWorks. The scope of absence is the exact syllabus publication. Canvas content, separate course resources, and other sections are outside that scope. SystemVerilog is assessed independently of Verilog.

Run from the repository root:

```bash
python -m scripts.ask_skill_evidence "Show FPGA syllabus evidence"
python -m scripts.ask_skill_evidence "شواهد سرفصل FPGA برای ENG EC 551 و 525.677.81 را نشان بده"
```

The same question works through the `skill_evidence` MCP tool and the repository n8n workflow. The response includes the same fixed set of Phase 14 skills for each selected reviewed course. For example, ECE 2031 VHDL is `mentioned` with a phrase and a PDF page link, ECE 2031 Verilog is `not_mentioned_in_full_syllabus`, and ECE 385 Verilog is `insufficient_course_information`. A skill with no explicit review remains insufficient even for a course with a complete syllabus.

Local verification covered all 15 course–skill pairs, a real HTTP call to the local MCP server, and the n8n Validate Plan and Compose Final nodes. The suite passed 714 tests. For v1, the user supplied a successful active n8n execution on 2026-11-22 (Asia/Tehran). Validate Plan selected `skill_evidence` on attempt 0. The tool output confirmed all three statuses for ECE 2031 and ECE 385. The execution ID was not provided.

Version `fpga-course-syllabi-v2` expands the review to 25 course–skill pairs. The new courses provide direct evidence for Verilog and MATLAB. Both public sources establish positive mentions, with insufficient information for skills lacking positive evidence. The US university course sample is evaluated against the same JobVision Iran posting snapshot.

## Expanded pilot acceptance

- Tested implementation: [`64180ff`](https://github.com/AriaAlimahmoodi/NexusOps/commit/64180ff090cec4e4ecc8c42afdf7d9cb36851f8b). The 716 local tests and [GitHub Actions run #445](https://github.com/AriaAlimahmoodi/NexusOps/actions/runs/44956473691) passed.
- Active n8n chat request: «شواهد سرفصل FPGA برای ENG EC 551 و 525.677.81 را نشان بده». The user supplied the successful tool response with timestamp `2026-11-21T22:32:24.534528+00:00` (2026-11-22 in Asia/Tehran). The execution ID was not provided.
- The result reported `fpga-course-syllabi-v2`, the JobVision Iran FPGA scope of 120 postings, and exactly the two requested courses.
- Boston University ENG EC 551 reported Verilog as `mentioned` with an official course description reference. Johns Hopkins 525.677.81 reported MATLAB as `mentioned` with a Course Learning Outcomes reference. Each partial source reported `insufficient_course_information` for skills without evidence.

The active n8n acceptance check for the expanded FPGA course pilot passed.
