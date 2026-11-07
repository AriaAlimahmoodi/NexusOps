"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIntegrationLLM = setupIntegrationLLM;
exports.shouldRunIntegrationTests = shouldRunIntegrationTests;
const llm_config_1 = require("../../../llm-config");
async function setupIntegrationLLM() {
    const apiKey = process.env.N8N_AI_ANTHROPIC_KEY;
    if (!apiKey) {
        throw new Error('N8N_AI_ANTHROPIC_KEY environment variable is required for integration tests');
    }
    return await (0, llm_config_1.anthropicClaudeSonnet45)({ apiKey });
}
function shouldRunIntegrationTests() {
    return process.env.ENABLE_INTEGRATION_TESTS === 'true';
}
//# sourceMappingURL=test-helpers.js.map