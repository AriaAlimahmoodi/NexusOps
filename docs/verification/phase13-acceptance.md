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

The submitted report contained 120 distinct `RowNumber` values and 120 title matches. Recounting structured labels from the posting records reproduced the report totals. The full CSV run and the earlier hardware-candidate export selected the same 120 distinct `RowNumber` values after applying the FPGA title pattern to both. The sorted unique integer IDs from each output were serialized as a comma-delimited ASCII string without a trailing newline. Both strings had SHA-256 `05aafe358d34e71502bc189902a5b01b76ede8cfa2f9418977c564b6c828e42a`.

## Evidence and coverage

All 120 FPGA observations came from the title field used for selection. Structured skill counts include VHDL (87), Verilog (52), and MATLAB (42). Shares across this pilot use the denominator of 120 postings. The source snapshot has no job-description column. The observed SystemVerilog count in the JobVision pilot is **0 / 120** across the available title and structured-skill fields. The missing description column limits the scope of this count.

## SystemVerilog cross-check — 2026-11-22

| Source and scope | Observed matches |
| --- | ---: |
| JobVision Iran FPGA pilot, title and structured skills | 0 / 120 |
| [Remotive public API response](https://remotive.com/api/remote-jobs), titles and descriptions across all returned postings | 0 / 16 |
| Remotive public job pages, targeted search for FPGA roles | At least 1 |

The API response contained 16 distinct postings, all with descriptions, and none with FPGA or FPGAs in the title. Its SHA-256 was `257d5bc4f2a979d8dc577e697033d85f4be2f2327ed14f155f86a6f5100d6258`. The public listing for [Capgemini Junior DV and FPGA Prototyping Engineer, ID 6099369](https://remotive.com/remote/jobs/engineering/junior-dv-and-fpga-prototyping-engineer-6099369) explicitly mentions System Verilog for RTL implementation and is labeled Worldwide. The search has no population denominator. The international listing provides evidence for the international sample. The JobVision Iran count remains scoped to the 120 historical postings.

## Live n8n verification — 2026-11-22

- Implementation: [`f0b0182`](https://github.com/AriaAlimahmoodi/NexusOps/commit/f0b01825fa3efb6da70d8d642c139ae57cb6602a). The 710 local tests and [GitHub Actions run #443](https://github.com/AriaAlimahmoodi/NexusOps/actions/runs/44950083412) passed on this implementation.
- Live request: «تقاضای SystemVerilog در آگهی‌های FPGA ایران چقدر است؟». Trace ID: `nx-857`. Tool result timestamp: `2026-11-21T21:23:26.663434+00:00`.
- After the FPGA route was added to the active n8n workflow, Validate Plan selected `skill_evidence` and MCP Parse Result showed `ok: true` with a 38 ms tool round trip.
- The result matched the verified JobVision FPGA snapshot and activation range (April 2022 through March 2024). SystemVerilog had **0 matches out of 120 postings (0%)** and **0 matches out of 98 postings with recorded skills (0%)**. The response reported 22 postings without structured skills and 120 without a description. Description evidence was `null`.

The live n8n acceptance check for the JobVision FPGA pilot passed.
