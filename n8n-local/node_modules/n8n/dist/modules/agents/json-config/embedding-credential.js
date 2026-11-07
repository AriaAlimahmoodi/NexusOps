"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEmbeddingProviderOptionsFromCredential = resolveEmbeddingProviderOptionsFromCredential;
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const credential_field_mapping_1 = require("./credential-field-mapping");
const EMBEDDING_PROVIDER_OPTION_KEYS = [
    'apiKey',
    'baseURL',
    'region',
    'accessKeyId',
    'secretAccessKey',
    'sessionToken',
];
async function resolveEmbeddingProviderOptionsFromCredential(credential, embeddingModel, credentialProvider) {
    const raw = await credentialProvider.resolve(credential);
    const mapped = (0, credential_field_mapping_1.mapCredentialForProvider)((0, agent_config_1.getProviderPrefix)(embeddingModel), raw);
    const options = {};
    for (const key of EMBEDDING_PROVIDER_OPTION_KEYS) {
        const value = mapped[key];
        if (typeof value === 'string')
            options[key] = value;
    }
    return options;
}
//# sourceMappingURL=embedding-credential.js.map