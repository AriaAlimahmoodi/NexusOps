"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unwrapProviderEnvelope = unwrapProviderEnvelope;
exports.createLlmCompletionMockHandler = createLlmCompletionMockHandler;
const tool_1 = require("@n8n/agents/tool");
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const instance_ai_1 = require("@n8n/instance-ai");
const is_record_1 = require("@n8n/utils/is-record");
const is_unknown_array_1 = require("@n8n/utils/is-unknown-array");
const zod_1 = require("zod");
const structured_output_conformance_1 = require("./structured-output-conformance");
const COMPLETION_MOCK_PROMPT = `You simulate ONE response from the LLM that powers an AI agent inside an n8n workflow under evaluation. The agent runs a tool-calling loop and calls you once per turn. Decide the agent's NEXT step and submit it via submit_agent_step.

This is a MOCK whose only purpose is to exercise the workflow's wiring and data flow — NOT to produce a realistic deliverable. Keep everything MINIMAL and schema-valid. Never write long documents, full HTML pages, or essays; a short stub string that satisfies the schema is ideal.

You are given the conversation so far, whether any tool results have come back, and the tools the agent may call (each with its JSON input schema).

How to decide:
- If NO tool results are present yet and the agent's instructions describe gathering/processing steps, advance the loop: pick the SINGLE most appropriate NON-final tool and call it. Do not jump to the final answer on the first turn.
- Once tool results are present (or only a "final answer" / "format response" style tool remains sensible), finalize: if such a structured-output tool exists, call it; otherwise return a short final answer.

Rules:
- kind="tool_call": set toolName to one of the available tools and toolArguments to an object matching THAT tool's input schema EXACTLY (same keys, nesting, and types). Use the SMALLEST valid value for every field — a one-line string, a single-element array — never a long document.
- kind="final": set content to a short final answer string. Two structured-output cases override this:
  - If a structured-output / "format final response" style tool is available, NEVER finalize with plain content — call that tool with schema-valid arguments instead.
  - Only when NO such tool exists but the conversation carries structured-output format instructions (a JSON schema the reply must match): content MUST be exactly JSON that satisfies THAT schema — every declared field present, exact key names, correct types (a numeric field gets a number like 42, never a descriptive string like "about 42" or "below the 42 threshold"). Do NOT add fields the schema does not declare, and do NOT wrap the object in an extra key unless the schema itself declares that wrapper (some parsers require a specific top-level key such as "__structured__output" — include it only when the schema shows it). Reproduce a \`\`\`json code block only if the instructions show one. Keep-it-minimal applies to field VALUES only — never drop declared fields.
- content is ONLY the assistant's answer (plain text, or the structured JSON). NEVER wrap it in a provider API envelope — no chat.completion/response object, no "choices"/"output"/"id"/"object" keys. The harness adds the wire envelope.
- Call exactly ONE tool per step. Never fabricate a whole multi-step result in a single turn.
- If the scenario, node hint, or data context states a specific value, reproduce it; otherwise keep values minimal.`;
const submitStepSchema = zod_1.z.object({
    kind: zod_1.z
        .enum(['tool_call', 'final'])
        .describe('"tool_call" to advance the agent loop; "final" to give the agent\'s final answer.'),
    toolName: zod_1.z
        .string()
        .optional()
        .describe('Required for kind="tool_call": the exact name of the tool to call.'),
    toolArguments: zod_1.z
        .record(zod_1.z.unknown())
        .optional()
        .describe('Required for kind="tool_call": an object matching the named tool\'s input schema exactly. Use minimal valid values.'),
    content: zod_1.z
        .string()
        .optional()
        .describe('Required for kind="final": a short final answer string.'),
});
function asString(value) {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}
const TRANSCRIPT_ITEM_MAX = 500;
function truncate(text) {
    return text.length > TRANSCRIPT_ITEM_MAX ? `${text.slice(0, TRANSCRIPT_ITEM_MAX)}…` : text;
}
function contentToString(content) {
    if (typeof content === 'string')
        return content;
    if (Array.isArray(content)) {
        const parts = [];
        for (const part of content) {
            if (typeof part === 'string')
                parts.push(part);
            else if ((0, is_record_1.isRecord)(part) && typeof part.text === 'string')
                parts.push(part.text);
        }
        return parts.join(' ');
    }
    if (content === undefined || content === null)
        return '';
    return JSON.stringify(content);
}
function extractTools(body) {
    if (!(0, is_record_1.isRecord)(body) || !Array.isArray(body.tools))
        return [];
    const out = [];
    for (const entry of body.tools) {
        if (!(0, is_record_1.isRecord)(entry))
            continue;
        const fn = (0, is_record_1.isRecord)(entry.function) ? entry.function : entry;
        const name = asString(fn.name);
        if (!name)
            continue;
        out.push({ name, description: asString(fn.description), schema: fn.parameters });
    }
    return out;
}
function summarizeConversation(body) {
    if (!(0, is_record_1.isRecord)(body))
        return { transcript: '', hasToolResults: false };
    const items = Array.isArray(body.messages)
        ? body.messages
        : Array.isArray(body.input)
            ? body.input
            : [];
    const lines = [];
    let hasToolResults = false;
    for (const item of items) {
        if (!(0, is_record_1.isRecord)(item))
            continue;
        const type = asString(item.type);
        const role = asString(item.role);
        if (type === 'function_call_output' || role === 'tool') {
            hasToolResults = true;
            const payload = type === 'function_call_output' ? item.output : item.content;
            lines.push(`tool_result: ${truncate(contentToString(payload))}`);
        }
        else if (type === 'function_call') {
            lines.push(`assistant called tool: ${asString(item.name) ?? '?'}`);
        }
        else if (role) {
            lines.push(`${role}: ${truncate(contentToString(item.content))}`);
        }
    }
    return { transcript: lines.join('\n'), hasToolResults };
}
function buildUserPrompt(tools, summary, options, nodeHint, outputSchema) {
    const toolList = tools
        .map((t) => `- ${t.name}${t.description ? `: ${t.description}` : ''}\n  input schema: ${JSON.stringify(t.schema)}`)
        .join('\n') || '(no tools — return a final answer)';
    const sections = [
        '## Conversation so far',
        summary.transcript || '(empty — this is the first turn)',
        '',
        '## Tools the agent may call',
        toolList,
        '',
        '## State',
        summary.hasToolResults
            ? 'Tool results ARE present — you likely have enough to finalize.'
            : 'No tool results yet — advance the loop by calling a non-final tool unless none exist.',
    ];
    if (outputSchema) {
        sections.push('', '## Required structured output', 'Your final `content` MUST be JSON matching this schema EXACTLY — include every declared property with the correct type, add no extra keys, and do not wrap it in another object unless the schema itself declares that wrapper:', JSON.stringify(outputSchema));
    }
    if (options?.globalContext)
        sections.push('', '## Data context', options.globalContext);
    if (nodeHint)
        sections.push('', '## Node hint', nodeHint);
    if (options?.scenarioHints)
        sections.push('', '## Scenario', options.scenarioHints);
    return sections.join('\n');
}
function unwrapProviderEnvelope(text) {
    const trimmed = text.trim();
    if (!trimmed.startsWith('{'))
        return text;
    let parsed;
    try {
        parsed = JSON.parse(trimmed);
    }
    catch {
        return text;
    }
    if (!(0, is_record_1.isRecord)(parsed))
        return text;
    if (parsed.object === 'chat.completion' && (0, is_unknown_array_1.isUnknownArray)(parsed.choices)) {
        const first = parsed.choices[0];
        if ((0, is_record_1.isRecord)(first) && (0, is_record_1.isRecord)(first.message) && typeof first.message.content === 'string') {
            return first.message.content;
        }
    }
    if (parsed.object === 'response') {
        if (typeof parsed.output_text === 'string')
            return parsed.output_text;
        if ((0, is_unknown_array_1.isUnknownArray)(parsed.output)) {
            for (const item of parsed.output) {
                if (!(0, is_record_1.isRecord)(item) || !(0, is_unknown_array_1.isUnknownArray)(item.content))
                    continue;
                const firstPart = item.content[0];
                if ((0, is_record_1.isRecord)(firstPart) && typeof firstPart.text === 'string')
                    return firstPart.text;
            }
        }
    }
    return text;
}
function jsonResponse(body) {
    return { body, headers: { 'content-type': 'application/json' }, statusCode: 200 };
}
function createLlmCompletionMockHandler(options) {
    return async (requestOptions, node) => {
        const body = requestOptions.body;
        const tools = extractTools(body);
        const summary = summarizeConversation(body);
        const outputSchema = (0, structured_output_conformance_1.discoverStructuredOutputSchema)(body);
        const userPrompt = buildUserPrompt(tools, summary, options, options?.nodeHints?.[node.name], outputSchema);
        const capture = {};
        const agent = (0, instance_ai_1.createEvalAgent)('eval-llm-completion-mock', {
            instructions: COMPLETION_MOCK_PROMPT,
            cache: true,
        }).tool(new tool_1.Tool('submit_agent_step')
            .description("Submit the agent's next step: one tool call, or a final answer.")
            .input(submitStepSchema)
            .handler(async (input) => {
            if (input.toolName) {
                capture.kind = 'tool_call';
                capture.toolName = input.toolName;
                capture.toolArguments = input.toolArguments ?? {};
                return 'Accepted.';
            }
            if (input.kind === 'tool_call') {
                return 'Invalid: kind="tool_call" requires toolName. Call submit_agent_step again.';
            }
            capture.kind = 'final';
            capture.content = input.content ?? '';
            return 'Accepted.';
        })
            .build());
        const result = await agent.generate(userPrompt, {
            abortSignal: AbortSignal.timeout(120_000),
        });
        let responseBody;
        if (capture.toolName) {
            responseBody = {
                tool_calls: [{ name: capture.toolName, arguments: capture.toolArguments ?? {} }],
            };
        }
        else if (capture.kind === 'final') {
            responseBody = {
                content: (0, structured_output_conformance_1.conformContentToSchema)(unwrapProviderEnvelope(capture.content ?? ''), outputSchema),
            };
        }
        else {
            const fallback = (0, instance_ai_1.extractText)(result).trim();
            di_1.Container.get(backend_common_1.Logger).warn(`[EvalMock] llm-completion-mock produced no submit_agent_step for "${node.name}"; using raw text fallback`);
            responseBody = {
                content: (0, structured_output_conformance_1.conformContentToSchema)(unwrapProviderEnvelope(fallback), outputSchema) ||
                    '[eval completion-mock: empty response]',
            };
        }
        return jsonResponse(responseBody);
    };
}
//# sourceMappingURL=llm-completion-mock.js.map