"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJson = generateJson;
exports.resolveUrl = resolveUrl;
const llm_output_1 = require("@n8n/ai-utilities/llm-output");
const instance_ai_1 = require("@n8n/instance-ai");
const n8n_workflow_1 = require("n8n-workflow");
const GENERATOR_TIMEOUT_MS = 120_000;
const MAX_GENERATOR_ATTEMPTS = 2;
async function generateJson(agentName, instructions, userPrompt, validate, logger) {
    for (let attempt = 1; attempt <= MAX_GENERATOR_ATTEMPTS; attempt++) {
        try {
            const agent = (0, instance_ai_1.createEvalAgent)(agentName, { instructions });
            const result = await agent.generate(userPrompt, {
                providerOptions: { anthropic: { maxTokens: 4096 } },
                abortSignal: AbortSignal.timeout(GENERATOR_TIMEOUT_MS),
            });
            const parsed = (0, n8n_workflow_1.jsonParse)((0, llm_output_1.extractJsonCandidate)((0, instance_ai_1.extractText)(result)), {
                fallbackValue: undefined,
            });
            const validated = validate(parsed);
            if (validated !== undefined)
                return validated;
            logger.warn(`[EvalMock] ${agentName} attempt ${attempt} returned an unusable shape`);
        }
        catch (error) {
            logger.warn(`[EvalMock] ${agentName} attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`);
            if (!(0, instance_ai_1.isRetryableEvalError)(error))
                break;
        }
    }
    return undefined;
}
function resolveUrl(input) {
    if (typeof input === 'string')
        return input;
    if (input instanceof URL)
        return input.toString();
    return input.url;
}
//# sourceMappingURL=mock-utils.js.map