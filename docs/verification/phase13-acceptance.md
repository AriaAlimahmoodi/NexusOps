# Phase 13 acceptance — JobVision FPGA pilot

The FPGA pilot was accepted on 2026-11-22 for reproducible title-based selection, posting-level counting, and evidence provenance.

## Reproduction

- Tested implementation: [`e193ed12`](https://github.com/AriaAlimahmoodi/NexusOps/commit/e193ed12aebea640da4231c150deec36ae90143e).
- Verification: 708 local tests passed on that commit. The `python-tests` job passed in [GitHub Actions](https://github.com/AriaAlimahmoodi/NexusOps/actions/runs/44915702536) on the same commit.
- Input: JobVision Iran snapshot, `JobVision_Jobposts_Dataset.csv`. SHA-256: `5ea2992462bba91dd6afe2d48f7e3878cc3a11c800f16472d60a66b4d1c13293`.
- Command from the repository root: `python -m scripts.profile_jobvision_role --input data/raw/JobVision_Jobposts_Dataset.csv --role fpga`.
- Scope: postings selected by an explicit FPGA or FPGAs match in `Jobpost_RawTitle`. The matched postings have activation months from April 2022 through March 2024.

## Observed results

| Measure | Count |
| --- | ---: |
| CSV rows read | 364,838 |
| Rows without a title | 0 |
| Title matches | 120 |
| Matches without a row identifier | 0 |
| Exact duplicate matching rows | 0 |
| Accepted denominator, unique valid title-matched rows | **120** |
| Postings with structured skills | 98 |
| Postings missing structured skills | 22 |
| Postings missing an activation month | 0 |
| Postings with a job description available in the snapshot | 0 |

The submitted report contained 120 distinct `RowNumber` values and 120 title matches. Recounting structured labels from the posting records reproduced the report totals. The 120 matches also agree with the earlier hardware-candidate count. Row identities across the two outputs were not compared.

## Evidence and coverage

All 120 FPGA observations came from the title field used for selection. Structured skill counts include VHDL (87), Verilog (52), and MATLAB (42). Shares across this pilot use the denominator of 120 postings. The source snapshot has no job-description column. SystemVerilog had zero direct observations in the available title and structured-skill fields, so its market-demand status remains `insufficient_evidence`. Assessing it requires traceable postings with job descriptions.
