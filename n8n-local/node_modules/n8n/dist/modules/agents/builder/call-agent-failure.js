"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.describeCallAgentFailure = describeCallAgentFailure;
const model_discovery_1 = require("@n8n/ai-utilities/model-discovery");
const UNATTRIBUTED_NOT_FOUND = /\b404\b|\bnot found\b/i;
const DO_NOT_BLAME_THE_KEY = 'Do not ask the user to check, revoke, or regenerate their API key. ' +
    'Call agent_builder_resolve_llm again for this provider to get a model the credential can ' +
    'actually reach, write it to the config, and retry.';
function describeCallAgentFailure(message) {
    if ((0, model_discovery_1.classifyChatModelFailure)(message) === 'invalid_model') {
        return {
            code: 'invalid_model',
            message: `The model provider rejected the configured model: ${message} ` +
                `This is the model id, not the credential. ${DO_NOT_BLAME_THE_KEY}`,
        };
    }
    if (UNATTRIBUTED_NOT_FOUND.test(message)) {
        return {
            code: 'execution_failed',
            message: `${message} If this came from the model provider rather than one of the ` +
                "agent's tools, the configured model is the likely cause — a provider " +
                'returns 404 for a model it does not serve. Re-check the model id with ' +
                'agent_builder_resolve_llm before suggesting anything about the credential or API key.',
        };
    }
    return { code: 'execution_failed', message };
}
//# sourceMappingURL=call-agent-failure.js.map