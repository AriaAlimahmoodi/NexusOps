# Phase 20 n8n chat integration

The operator verified the Persian UI to Production chat bridge after the loopback proxy fix in 6972b08. The live Python market and curriculum comparison returned one successful result and zero failures, with an n8n session ID. Its scoped figures matched the Phase 18 baseline.

The response did not carry a trace ID or an n8n execution number. Trace propagation for the skill-evidence response and MCP routing for the Phase 19 catalog and course-skill queries remain open. This verification did not change the workflow export.

## Live catalog routing

After the domain-gate fix and restart of MCP on the Phase 20 code, the Persian UI catalog query returned trace `nx-881`, one successful result, zero failed results, and 132 real course rows representing 120 distinct titles. This verifies the catalog route and trace propagation through Production. 

## Final live acceptance

The operator supplied the final Production responses on 2026-11-23 (Tehran time). The Persian UI returned the following traces through n8n and MCP, each with one successful result and zero failed results.

| Query | Trace | Verified result |
| --- | --- | --- |
| Real catalog | nx-881 | 132 records and 120 distinct course titles |
| VHDL course evidence | nx-882 | ECE 2031 and 525.677.81 with reviewed syllabus evidence |
| Python market and curriculum comparison | nx-883 | 1,745 scoped matches, 5.90% of scoped postings, 7.42% of postings with recorded skills, 6.67% of mandatory courses and 7.32% of mandatory credits |

Phase 20 acceptance is complete for these three general chat routes and response trace propagation. The final successful responses exercise the success path. The corrected tool-error counters were tested separately with a simulated tool error.
