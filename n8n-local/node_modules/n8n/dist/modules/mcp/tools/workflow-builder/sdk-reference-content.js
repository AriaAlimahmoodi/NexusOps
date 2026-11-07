"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSdkReferenceContent = getSdkReferenceContent;
const ai_workflow_builder_1 = require("@n8n/ai-workflow-builder");
const sdk_reference_1 = require("@n8n/workflow-sdk/prompts/sdk-reference");
const CODING_GUIDELINES = `Rules:
- Use exact parameter names and structures from the type definitions.
- Use unique variable names — never reuse builder function names (e.g. \`node\`, \`trigger\`) as variable names
- Use descriptive node names (Good: "Fetch Weather Data", "Check Temperature"; Bad: "HTTP Request", "Set", "If")
- Credentials: \`credentials: { slackApi: newCredential('Slack Bot') }\` — type must match what the node expects
- Expressions: use \`expr()\` for any \`{{ }}\` syntax  — always use single or double quotes, NOT backtick template literals
  - e.g. \`expr('Hello {{ $json.name }}')\` or \`expr("{{ $('Node').item.json.field }}")\`
  - For multiline expressions, use string concatenation: \`expr('Line 1\\n' + 'Line 2 {{ $json.value }}')\`
  - WRONG: \`expr('Daily Digest - ' + $now.toFormat('MMMM d') + '\\n' + $json.output)\` — $now and $json are outside {{ }}
  - CORRECT: \`expr('Daily Digest - {{ $now.toFormat("MMMM d") }}\\n{{ $json.output }}')\` — variables inside {{ }}
  - WRONG: \`expr('{{ ' + JSON.stringify($('Node').all().map(i => i.json)) + ' }}')\` — $() used as JavaScript
  - CORRECT: \`expr('{{ $("Node").all().map(i => i.json) }}')\` — $() inside {{ }} evaluated at runtime
- Placeholders: use \`placeholder('hint')\` directly as the parameter value, not inside \`expr()\`, objects, or arrays, etc.
- Every node MUST have an \`output\` property with sample data — following nodes depend on it for expressions
- String quoting: When a string value contains an apostrophe, use double quotes for that string.
  Example: \`output: [{{ text: "I've arrived" }}]\`
- Do NOT add or edit comments. Comments are ignored and not shared with user. Use sticky(...) to provide guidance.`;
const DESIGN_GUIDANCE = `Design guidance:
- **Trace item counts**: For each connection A → B, if A returns N items, should B run N times or just once? If B doesn't need A's items (e.g., it fetches from an independent source), either set \`executeOnce: true\` on B or use parallel branches + Merge to combine results.
- **Handling convergence after branches**: When a node receives data from multiple paths (after Switch, IF, Merge): use optional chaining \`expr('{{ $json.data?.approved ?? $json.status }}')\`, reference a node that ALWAYS runs \`expr("{{ $('Webhook').item.json.field }}")\`, or normalize data before convergence with Set nodes.
- **Prefer dedicated integration nodes** over HTTP Request when search results show one is available.
- **Normalize webhook payloads immediately**: Webhook data often appears under \`body\`, but clients and tests may provide fields directly on \`$json\`. Add a Set node after the webhook that uses optional chaining and defaults, e.g. \`expr('{{ $json.body?.name ?? $json.name ?? "there" }}')\`, \`expr('{{ $json.body?.email ?? $json.email ?? "" }}')\`, and \`expr('{{ $json.body?.message ?? $json.message ?? "" }}')\`.
- **Fan out independent side effects**: For workflows that send email, notify chat, write to storage, and respond to a webhook, branch all side-effect nodes from normalized data instead of chaining them. Set \`onError: 'continueRegularOutput'\` on independent external action nodes when one failed action should not block the others.
- **Pay attention to @builderHint annotations** in the type definitions — they provide critical guidance on how to correctly configure node parameters.`;
const SDK_IMPORT_SECTION = `## SDK Import Statement\n\n\`\`\`javascript\n${ai_workflow_builder_1.SDK_IMPORT_STATEMENT}\n\`\`\``;
const WORKFLOW_PATTERNS_SECTION = `## Workflow Patterns\n\n${sdk_reference_1.WORKFLOW_SDK_PATTERNS}`;
const WORKFLOW_PATTERNS_DETAILED_SECTION = `## Workflow Patterns Detailed\n\n${sdk_reference_1.WORKFLOW_PATTERNS_DETAILED}`;
const CODING_GUIDELINES_SECTION = `## Coding Guidelines\n\n${CODING_GUIDELINES}`;
const DESIGN_GUIDANCE_SECTION = `## Design Guidance\n\n${DESIGN_GUIDANCE}`;
const GROUPS_SECTION = sdk_reference_1.NODE_GROUPS_REFERENCE;
const SECTIONS = {
    import: SDK_IMPORT_SECTION,
    patterns: WORKFLOW_PATTERNS_SECTION,
    patterns_detailed: WORKFLOW_PATTERNS_DETAILED_SECTION,
    expressions: sdk_reference_1.EXPRESSION_REFERENCE,
    functions: sdk_reference_1.ADDITIONAL_FUNCTIONS,
    rules: sdk_reference_1.WORKFLOW_RULES,
    guidelines: CODING_GUIDELINES_SECTION,
    design: DESIGN_GUIDANCE_SECTION,
    groups: GROUPS_SECTION,
};
function getSdkReferenceContent(section) {
    if (section && section !== 'all' && section in SECTIONS) {
        return SECTIONS[section];
    }
    return [
        '# n8n Workflow SDK Reference',
        '',
        SECTIONS.import,
        '',
        sdk_reference_1.SDK_LANGUAGE_REFERENCE,
        '',
        SECTIONS.patterns,
        '',
        SECTIONS.patterns_detailed,
        '',
        SECTIONS.expressions,
        '',
        SECTIONS.functions,
        '',
        SECTIONS.rules,
        '',
        SECTIONS.guidelines,
        '',
        SECTIONS.design,
    ].join('\n');
}
//# sourceMappingURL=sdk-reference-content.js.map