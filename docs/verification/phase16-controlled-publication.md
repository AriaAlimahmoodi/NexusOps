# Phase 16 controlled FPGA publication

The publisher verifies the original JobVision CSV against the Phase 13 fingerprint and posting identities. It builds the publication from that snapshot, the five reviewed course documents, and the Phase 15 Johns Hopkins course assessment. The review artifact contains the market counts and row references, syllabus evidence, coverage limits, and assessment scope. Preparation is local and does not connect to Elasticsearch.

Review the generated JSON and record its SHA-256 before publication. The publish command requires that exact digest. It creates and reads back a versioned index, blocks writes, and then switches the dedicated real-data alias `nexusops_real_fpga_evidence`. The previous index is retained and its name appears in the publication receipt. The publication process needs Elasticsearch index creation, document write and read, settings, and alias management privileges on that namespace. The live MCP account needs read access to the alias.

## Prepare and publish

From the Phase 16 checkout, reuse the validated raw JobVision CSV path and the environment configuration for the intended Elasticsearch instance. The output path must be new.

```powershell
& $python -m scripts.publish_fpga_evidence --prepare "$csv" --output "$evidenceFile"
Get-FileHash -LiteralPath $evidenceFile -Algorithm SHA256
```

Review the file and supply the approved lowercase digest only after publication is authorized.

```powershell
& $python -m scripts.publish_fpga_evidence --publish "$evidenceFile" --approve-sha256 "$approvedSha"
```

Run the Phase 16 MCP server against the same Elasticsearch instance and import and publish the separately delivered Phase 16 workflow. The published-evidence route uses only the real alias. A missing publication produces an explicit unavailable response. The structured MCP response includes the approval digest, row evidence and source links. Chat renders the evidence summary.

## Live acceptance

| Chat question | Expected result |
| --- | --- |
| با شواهد منتشرشده FPGA مهارت پرتقاضا، درس مرتبط، سرفصل کم‌پوشش و پیشنهاد بازنگری را نشان بده | VHDL in 87/120 postings, Johns Hopkins 525.677.81, and Verilog in 52/120 postings and 1/5 reviewed documents. Boston University ENG EC 551 provides direct Verilog evidence. The proposed review calls for complete syllabi and graded work to determine whether coverage is truly limited. |
| با شواهد منتشرشده FPGA آیا کمبود تقاضای SystemVerilog قطعی است؟ | Insufficient evidence. Zero recorded mentions in the available fields, job descriptions unavailable for all 120 postings, and no documented SystemVerilog assessment in the selected course. |

Record the publication receipt and the two live execution IDs with their responses. Run with no attachment or API request from the chat user.
