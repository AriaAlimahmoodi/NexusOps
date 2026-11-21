# Phase 15 skill indicators and competency gaps

The FPGA pilot combines the Phase 13 JobVision Iran posting snapshot with the five specific course publications from Phase 14. The scopes remain visible in every report. The historical market snapshot covers April 2022 through March 2024. The course publications come from four US institutions and are not a single program inventory.

## Metric definitions

| Measure | Rule | Missing evidence |
| --- | --- | --- |
| Observed market demand | 100 × distinct matching postings ÷ all unique valid role-matched postings. Each posting contributes at most once per skill across the eligible fields. | A missing field contributes no observed match. The denominator stays fixed and the report gives missing-field counts. An unavailable field count is null. A zero numerator records zero matches in the available evidence. |
| Observed syllabus mentions | 100 × reviewed publications with an explicit mention ÷ all selected publications. The same course offering is counted once. | The report distinguishes mention, reviewed absence in a full syllabus, and insufficient information. The possible maximum treats all insufficient publications as positive. A published mention establishes evidence at the publication level. |
| Competency coverage | Number of target competencies verified as taught and assessed ÷ target competency inventory. Required coverage uses the approved minimum ÷ the same inventory. | A mention or missing assessment leaves a competency unknown. A verified gap requires a referenced assessment. |
| Competency gap priority | 100 × observed demand share × max(0, (required count − verified covered count) ÷ required count). | A missing target, missing or incomplete assessment, or empty market population leaves the gap null. A fully assessed target that is met produces zero. |

The gap uses the existing program-specific GapPriority v1 formula. Its input program, level, target reference version, role, dates and market snapshot must be consistent across the ranking. The course alignment report available through the existing GapPriority request answers a separate course-level question. The Phase 15 rank sorts computed competency gaps by the exact unrounded score descending, then canonical skill ID ascending. FPGA is the title-based role selection criterion and is excluded from the rank. Unscored skills have a null rank.

JobVision identities are `RowNumber`. The Phase 13 profile discards exact duplicate rows and rejects conflicting payloads for a matching identity. The structured input remains `Jobpost_SoftwareSkills[].TitleEn` from Phase 13. Labels in that field are normalized using Unicode NFKC, case folding, whitespace and half-space normalization, Persian ی and ک, and exact versioned aliases. Examples include `System-Verilog` and «سیستم‌وریلاگ», `VHSIC Hardware Description Language` and «وی‌اچ‌دی‌ال», and «متلب». Verilog and SystemVerilog have distinct identifiers. Title and description matching retain the reviewed Phase 13 field rules. Changes to the aliases can change a future snapshot and must be reconciled with the versioned counts before reuse.

## Independently calculated acceptance sample

Four synthetic in-scope postings have IDs 1 through 4. A fifth row repeats posting 1, and an out-of-scope title is excluded. Posting 1 repeats VHDL in Persian and English, still contributing one match. Posting 4 has no structured skills. Sample course A has a full reviewed syllabus, while B has a partial publication. The competency assessment is a separate synthetic input.

| Skill | Observed market demand | Observed syllabus mentions | Competency result and rank |
| --- | ---: | ---: | --- |
| VHDL | 3 / 4 = 75% | 1 / 2 = 50%, possible maximum 100% | 100 × 3/4 × (3−1)/3 = 50 points, rank 2 |
| Verilog | 2 / 4 = 50% | 1 / 2 = 50%, possible maximum 50% | 100 × 2/4 × (1−0)/1 = 50 points, rank 1 |
| MATLAB | 1 / 4 = 25% | 0 / 2 = 0%, possible maximum 50% | Mention-only assessment, gap and rank null |

The test compares these values with engine output. It checks the denominator IDs, VHDL match IDs 1, 2 and 3, course A's source location, and the assessment reference for competency 1. Alphabetical canonical IDs break the 50-point tie.

## Published pilot and reproduction

| Skill | Observed JobVision matches | Publications mentioning skill | Possible mentions with unresolved evidence |
| --- | ---: | ---: | ---: |
| FPGA | 120 / 120 | 4 / 5 | 4 / 5 |
| VHDL | 87 / 120 | 2 / 5 | 4 / 5 |
| Verilog | 52 / 120 | 1 / 5 | 3 / 5 |
| MATLAB | 42 / 120 | 1 / 5 | 3 / 5 |
| SystemVerilog | 0 / 120 | 1 / 5 | 3 / 5 |

The published market snapshot has 22 missing structured skill lists and no job descriptions. All five real competency gaps and ranks are null because the pilot has no approved competency targets. The default report cites the verified snapshot and syllabus source locations. Exact posting identities require the verified raw CSV. When provided, the engine checks the batch hash, role rule, missing-field counts and Phase 13 posting ID checksum, then traces each numerator and denominator to the raw row IDs. An optional assessments JSON object can supply a reviewed `target` and `curriculum` per canonical skill ID. The entries use the existing GapPriority v1 input structures and require the verified CSV so a computed score has row-level references.

```bash
python -m scripts.compute_gap_priority --fpga-indicators
python -m scripts.compute_gap_priority --fpga-indicators --jobvision-csv data/raw/JobVision_Jobposts_Dataset.csv
python -m scripts.ask_skill_evidence "شاخص‌های مهارت FPGA را نشان بده"
python -m pytest -q tests/test_phase15_indicators.py tests/test_n8n_workflow_runtime.py
```

The repository n8n workflow routes the same question to the MCP `skill_evidence` tool. The local workflow node test checks the route and the final JSON in Persian and English.

## Live n8n acceptance

The user supplied the successful active chat response and MCP trace `nx-866` for «شاخص‌های مهارت FPGA را نشان بده». The tool `skill_evidence` completed in 37.826 ms on 2026-11-21 at 23:30:02 UTC. The response reproduced all five market and syllabus counts in the table above and reported missing competency targets for all five skills. This execution used the aggregate snapshot. Real posting-level verification against the raw CSV remains pending.

Tested implementation: [e4f3d14](https://github.com/AriaAlimahmoodi/NexusOps/commit/e4f3d14e47c2499b67361523df3554de25b229e5). [GitHub Actions run](https://github.com/AriaAlimahmoodi/NexusOps/actions/runs/44958850817).
