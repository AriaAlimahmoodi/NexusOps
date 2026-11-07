"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withModelName = withModelName;
exports.modelNameForProvider = modelNameForProvider;
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
function withModelName(config, modelName, { dropMainProviderPrefix = false } = {}) {
    const nameFor = (provider) => dropMainProviderPrefix ? modelNameForProvider(modelName, provider) : modelName;
    if (typeof config === 'string') {
        const provider = (0, agent_config_1.splitModelId)(config).provider || 'custom';
        return `${provider}/${nameFor(provider)}`;
    }
    if ('project' in config) {
        return { ...config, id: `google-vertex-anthropic/${nameFor('google-vertex-anthropic')}` };
    }
    if ('url' in config) {
        const provider = (0, agent_config_1.splitModelId)(config.id).provider || 'custom';
        return { ...config, id: `${provider}/${nameFor(provider)}` };
    }
    return undefined;
}
function modelNameForProvider(value, mainProvider) {
    const { provider, model } = (0, agent_config_1.splitModelId)(value);
    return provider && provider === mainProvider ? model : value;
}
//# sourceMappingURL=model-config-name.js.map