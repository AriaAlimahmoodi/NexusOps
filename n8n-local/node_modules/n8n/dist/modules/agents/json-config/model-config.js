"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCredentialAwareModelConfig = resolveCredentialAwareModelConfig;
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const api_types_1 = require("@n8n/api-types");
const n8n_workflow_1 = require("n8n-workflow");
const credential_field_mapping_1 = require("./credential-field-mapping");
async function resolveCredentialAwareModelConfig(model, credential, credentialProvider, deploymentName) {
    const { provider, model: modelName } = (0, agent_config_1.splitModelId)(model);
    if (provider === 'google-vertex') {
        const selected = (await credentialProvider.list()).find((entry) => entry.id === credential);
        if (selected?.type !== 'googleVertexAiApi') {
            throw new n8n_workflow_1.UserError('This model requires a Google Vertex AI credential. Select a compatible credential.');
        }
    }
    if (credential === api_types_1.AI_GATEWAY_MANAGED_TAG) {
        if (!credentialProvider.resolveAiGatewayModelCredential) {
            throw new n8n_workflow_1.UserError('This credential provider cannot resolve Gateway credits model credentials.');
        }
        const raw = await credentialProvider.resolveAiGatewayModelCredential(provider);
        return {
            id: model,
            ...(0, credential_field_mapping_1.mapCredentialForProvider)(provider, raw),
            ...(provider === 'openai' ? { apiStyle: 'responses' } : {}),
        };
    }
    const raw = await credentialProvider.resolve(credential);
    const mapped = (0, credential_field_mapping_1.mapCredentialForProvider)(provider, raw);
    if (provider === 'google-vertex') {
        const { getCachedCatalog } = await import('@n8n/agents/catalog');
        const catalog = await getCachedCatalog();
        const sdk = catalog?.[provider]?.models[modelName]?.sdk;
        return { id: model, ...mapped, ...(sdk !== undefined && { sdk }) };
    }
    return {
        id: model,
        ...mapped,
        ...(provider === 'azure-openai' && deploymentName ? { deploymentName } : {}),
    };
}
//# sourceMappingURL=model-config.js.map