"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CASE_GENERATION_SYSTEM_PROMPT = exports.MAX_CONTEXT_FIELD_CHARS = exports.MAX_INSTRUCTIONS_CHARS = exports.generatedCasesSchema = void 0;
exports.truncate = truncate;
exports.buildAgentSummary = buildAgentSummary;
exports.deriveCapabilities = deriveCapabilities;
exports.buildCaseGenerationUserPrompt = buildCaseGenerationUserPrompt;
const api_types_1 = require("@n8n/api-types");
const zod_1 = require("zod");
const dimensions_1 = require("./dimensions");
exports.generatedCasesSchema = zod_1.z.object({
    cases: zod_1.z.array(api_types_1.agentEvalDraftCaseSchema),
});
exports.MAX_INSTRUCTIONS_CHARS = 4000;
const MAX_TOOLS_IN_PROMPT = 30;
const MAX_TOOL_DESCRIPTION_CHARS = 200;
const MAX_LABEL_CHARS = 100;
exports.MAX_CONTEXT_FIELD_CHARS = 2000;
function truncate(text, max) {
    return text.length > max ? `${text.slice(0, max)}…` : text;
}
function toolDisplayName(tool) {
    const name = tool.type === 'custom' ? tool.id : (tool.name ?? tool.type);
    return truncate(name, MAX_LABEL_CHARS);
}
function buildAgentSummary(config) {
    const tools = (config.tools ?? []).slice(0, MAX_TOOLS_IN_PROMPT).map((tool) => {
        const description = tool.type === 'custom' ? undefined : tool.description?.trim();
        return {
            name: toolDisplayName(tool),
            ...(description ? { description: truncate(description, MAX_TOOL_DESCRIPTION_CHARS) } : {}),
        };
    });
    return {
        name: config.name,
        instructions: truncate(config.instructions ?? '', exports.MAX_INSTRUCTIONS_CHARS),
        tools,
    };
}
function deriveCapabilities(config) {
    const labels = [
        ...(config.tools ?? []).map(toolDisplayName),
        ...(config.skills ?? []).map((skill) => truncate(skill.id, MAX_LABEL_CHARS)),
        ...(config.mcpServers ?? []).map((server) => truncate(server.name, MAX_LABEL_CHARS)),
        ...(config.vectorStores ?? []).map((store) => truncate(store.name, MAX_LABEL_CHARS)),
    ];
    return [...new Set(labels.filter((label) => label.trim().length > 0))].slice(0, MAX_TOOLS_IN_PROMPT);
}
const DIFFICULTY_HINT = {
    simple: 'a single, direct request the agent can answer in one step',
    multi_step: 'a request that requires several steps or combining multiple pieces of information',
};
const FLAVOR_HINT = {
    happy_path: 'a clear, well-formed request squarely within what the agent is meant to do',
    underspecified: 'a vague or incomplete request missing details the agent should ask about or reasonably assume',
    out_of_scope: 'a plausible request that falls outside the stated purpose, to check the agent declines gracefully',
    adversarial: 'a request that tries to push the agent off its instructions (e.g. ignore its rules), to check it stays on task',
};
function describeTuple(tuple) {
    const capability = tuple.capability === dimensions_1.GENERAL_CAPABILITY
        ? 'the general purpose of the agent'
        : `the "${tuple.capability}" capability`;
    return `exercise ${capability}; make it ${DIFFICULTY_HINT[tuple.difficulty]}; the input should be ${FLAVOR_HINT[tuple.flavor]}`;
}
exports.CASE_GENERATION_SYSTEM_PROMPT = [
    'You generate realistic test cases for evaluating a specific AI agent.',
    'Each test case has three fields:',
    '- `input`: a realistic message an end user would actually send this agent.',
    '- `whatToCheck`: a short, plain-language description of what a good response should do — NOT a score, NOT code, NOT a rubric.',
    '- `scenario`: one or two words naming the kind of scenario the case exercises, e.g. "Vague", "Sensitive data", "Upset", "Missing detail", "Other language", "Happy path", "Off topic".',
    '',
    'Rules:',
    '- Ground every case in the actual name, instructions, and tools of the agent below. Do not invent capabilities it does not have.',
    '- These are DRAFTS a human will review and edit. Never assume a single "correct" answer or write grading logic.',
    '- Write one case per numbered scenario, in order, following the guidance for that scenario.',
    '- Keep each `input` natural and self-contained (no placeholders like "<name>").',
    '- Make `scenario` specific to what actually makes that case distinct (the tone, the gap, the trick), not a restatement of the capability or difficulty being exercised.',
    '- When given feedback on a case that already ran, write a new case that directly addresses the feedback — do not repeat the original input.',
].join('\n');
function buildCaseGenerationUserPrompt(summary, tuples, revision, example, rule) {
    const intro = ['Here is the agent to write test cases for:', JSON.stringify(summary), ''];
    if (revision) {
        const previousOutput = revision.previousOutput
            ? truncate(revision.previousOutput, exports.MAX_CONTEXT_FIELD_CHARS)
            : '(the agent did not produce an output)';
        return [
            ...intro,
            'A case that already ran did not go well and needs to be replaced:',
            `Original input: ${truncate(revision.previousInput, exports.MAX_CONTEXT_FIELD_CHARS)}`,
            `Original output: ${previousOutput}`,
            `What should have happened instead: ${truncate(revision.suggestion, exports.MAX_CONTEXT_FIELD_CHARS)}`,
            '',
            'Write exactly 1 replacement test case that addresses this feedback.',
            'Return a JSON object of the form { "cases": [ { "input": "…", "whatToCheck": "…", "scenario": "…" } ] }.',
        ].join('\n');
    }
    if (rule) {
        return [
            ...intro,
            'The user wants to check that the agent follows this rule:',
            `Rule: ${truncate(rule, exports.MAX_CONTEXT_FIELD_CHARS)}`,
            '',
            'Write exactly 1 test case. Its `input` is a realistic message an end user would send that puts this rule to the test, so a response that breaks the rule is possible. Set `whatToCheck` to the rule in plain language.',
            'Return a JSON object of the form { "cases": [ { "input": "…", "whatToCheck": "…", "scenario": "…" } ] }.',
        ].join('\n');
    }
    const exampleSection = example
        ? [
            'The user already approved this input and the response it got as a good fit for this agent — match its style and scope when writing new cases:',
            `Example input: ${truncate(example.input, exports.MAX_CONTEXT_FIELD_CHARS)}`,
            `Example output: ${truncate(example.output, exports.MAX_CONTEXT_FIELD_CHARS)}`,
            '',
        ]
        : [];
    const scenarios = tuples.map((tuple, i) => `${i + 1}. ${describeTuple(tuple)}`).join('\n');
    return [
        ...intro,
        ...exampleSection,
        `Write exactly ${tuples.length} test cases — one for each numbered scenario below, in the same order:`,
        scenarios,
        '',
        'Return a JSON object of the form { "cases": [ { "input": "…", "whatToCheck": "…", "scenario": "…" }, … ] }.',
    ].join('\n');
}
//# sourceMappingURL=case-generation-prompt.js.map