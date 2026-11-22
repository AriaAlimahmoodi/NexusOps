# Phase 20 n8n chat integration

The operator verified the Persian UI to Production chat bridge after the loopback proxy fix in 6972b08. The live Python market and curriculum comparison returned one successful result and zero failures, with an n8n session ID. Its scoped figures matched the Phase 18 baseline.

The response did not carry a trace ID or an n8n execution number. Trace propagation for the skill-evidence response and MCP routing for the Phase 19 catalog and course-skill queries remain open. This verification did not change the workflow export.

## Live catalog routing

After the domain-gate fix and restart of MCP on the Phase 20 code, the Persian UI catalog query returned trace `nx-881`, one successful result, zero failed results, and 132 real course rows representing 120 distinct titles. This verifies the catalog route and trace propagation through Production. The final traced VHDL and Python regression runs on the updated workflow remain open.
