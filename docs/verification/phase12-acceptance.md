# Phase 12 acceptance

Operational acceptance recorded on 2026-11-21. GitHub Actions evidence remains outstanding.

- Backend commit: `5475d18eed450fe7a83dcb2e0bf5a43100aa375c`.
- Export tested: `NexusOps-Phase12-Workflow.json`, 28 nodes. SHA-256: `1702048180411592a86737b85a2cb2fa1a133e314b15999df0a8d4465c97339b`.
- Live n8n execution: **854**, Succeeded in 118.751 seconds. Tool result timestamp: `2026-11-21T13:54:09.255772+00:00`. Chat output reported one successful result and zero failures.
- Chat question: «تقاضای پایتون در JobVision و پوشش آن در Purdue را مقایسه کن».
- Observed JobVision results: 1,745 of 29,587 postings overall (5.90%) and 1,745 of 23,528 with recorded skills (7.42%). Observed Purdue pilot results: 1 of 15 required courses (6.67%) and 3 of 41 required credits (7.32%).
- Raw-reader verification: a local fixture with one raw page and two records passed manifest and checkpoint validation. Deliberately changing the checkpoint page count caused rejection.
- Runtime troubleshooting: request `nx-852` reached an MCP process that did not expose `skill_evidence`. After restarting the pinned server, request `nx-853` reached Elasticsearch and received HTTP 401. Starting the server with the known-good credential restored authenticated searches and execution 854 succeeded.

GitHub returned no combined statuses and no pull-request workflow runs for the backend commit. Push-triggered CI and the cause of the earlier CI failure are unverified. The runtime errors above are from the live environment. Record the Actions run URL, conclusion and failing step when the historical CI log is available. Strict closure under the original roadmap remains pending that evidence.
