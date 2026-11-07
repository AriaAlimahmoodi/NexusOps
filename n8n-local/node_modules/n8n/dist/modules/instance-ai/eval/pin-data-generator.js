"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repairStructuredOutput = exports.findOutputParserTargets = void 0;
exports.generatePinData = generatePinData;
const llm_output_1 = require("@n8n/ai-utilities/llm-output");
const instance_ai_1 = require("@n8n/instance-ai");
const workflow_sdk_1 = require("@n8n/workflow-sdk");
const n8n_workflow_1 = require("n8n-workflow");
var workflow_sdk_2 = require("@n8n/workflow-sdk");
Object.defineProperty(exports, "findOutputParserTargets", { enumerable: true, get: function () { return workflow_sdk_2.findOutputParserTargets; } });
Object.defineProperty(exports, "repairStructuredOutput", { enumerable: true, get: function () { return workflow_sdk_2.repairStructuredOutput; } });
const PIN_DATA_LLM_TIMEOUT_MS = 180_000;
async function generatePinData(options) {
    const { workflow, nodeNames, instructions, outputSchemaLookup, dataTableColumns } = options;
    if (nodeNames.length === 0)
        return {};
    const targetNodes = workflow.nodes.filter((n) => n.name && nodeNames.includes(n.name));
    if (targetNodes.length === 0)
        return {};
    const outputParserTargets = (0, workflow_sdk_1.findOutputParserTargets)(workflow);
    const contexts = (0, workflow_sdk_1.buildSchemaContexts)(targetNodes, outputSchemaLookup, outputParserTargets, dataTableColumns);
    const userPrompt = (0, workflow_sdk_1.buildPinDataUserPrompt)(workflow, contexts, {
        instructions,
        dateAnchors: (0, workflow_sdk_1.buildDateAnchors)(new Date()),
    });
    const expectedNodeNames = contexts.map((c) => c.nodeName);
    const agent = (0, instance_ai_1.createEvalAgent)('eval-pin-data-generator', {
        instructions: workflow_sdk_1.PIN_DATA_SYSTEM_PROMPT,
        cache: true,
    });
    const generateOnce = async (prompt) => {
        const result = await agent.generate(prompt, {
            providerOptions: { anthropic: { maxTokens: 16_384 } },
            abortSignal: AbortSignal.timeout(PIN_DATA_LLM_TIMEOUT_MS),
        });
        const responseText = (0, llm_output_1.extractJsonCandidate)((0, instance_ai_1.extractText)(result));
        const pinData = (0, workflow_sdk_1.parsePinDataResponse)(responseText, expectedNodeNames);
        const missing = expectedNodeNames.filter((name) => !(name in pinData));
        if (missing.length > 0) {
            throw new n8n_workflow_1.OperationalError(`Pin data generation returned no data for node(s): ${missing.join(', ')}`);
        }
        return (0, workflow_sdk_1.repairStructuredOutput)(pinData, workflow, contexts);
    };
    const pinData = await generateOnce(userPrompt);
    const violations = (0, workflow_sdk_1.collectPinFieldViolations)(pinData, contexts);
    if (violations.length === 0)
        return pinData;
    const retryPrompt = `${userPrompt}\n\n## Correction required\n\n${(0, workflow_sdk_1.buildFieldViolationRetryMessage)(violations)}`;
    const retried = await generateOnce(retryPrompt);
    const remaining = (0, workflow_sdk_1.collectPinFieldViolations)(retried, contexts);
    if (remaining.length > 0) {
        const summary = remaining
            .map((v) => `${v.nodeName} (unknown: ${v.unknownKeys.join(', ') || '-'}; missing: ${v.missingKeys.join(', ') || '-'}; declared: ${v.declaredKeys.join(', ')})`)
            .join('; ');
        throw new n8n_workflow_1.OperationalError(`Pin data generation drifted from declared field names after retry: ${summary}`);
    }
    return retried;
}
//# sourceMappingURL=pin-data-generator.js.map