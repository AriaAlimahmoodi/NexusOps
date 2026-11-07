"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_AGENT_PROVIDERS = void 0;
exports.mapCredentialForProvider = mapCredentialForProvider;
exports.isSupportedAgentProvider = isSupportedAgentProvider;
const agents_1 = require("@n8n/agents");
function customCredentialHeaders(c) {
    if (c.header === true &&
        typeof c.headerName === 'string' &&
        c.headerName &&
        typeof c.headerValue === 'string') {
        return { [c.headerName]: c.headerValue };
    }
    return undefined;
}
const PROVIDER_CREDENTIAL_MAPPERS = {
    openai: (c) => ({ apiKey: c.apiKey, baseURL: c.url, headers: customCredentialHeaders(c) }),
    anthropic: (c) => ({ apiKey: c.apiKey, baseURL: c.url, headers: customCredentialHeaders(c) }),
    google: (c) => ({ apiKey: c.apiKey, baseURL: c.host }),
    'google-vertex': (c) => ({
        project: (c.project ?? '__custom__') === '__custom__' ? c.projectId : c.project,
        clientEmail: c.email,
        privateKey: c.privateKey,
        location: c.region,
    }),
    xai: (c) => ({ apiKey: c.apiKey, baseURL: c.url }),
    groq: (c) => ({ apiKey: c.apiKey }),
    deepseek: (c) => ({ apiKey: c.apiKey, baseURL: c.url }),
    cohere: (c) => ({ apiKey: c.apiKey, baseURL: c.url }),
    mistral: (c) => ({ apiKey: c.apiKey }),
    vercel: (c) => ({
        apiKey: c.apiKey,
        baseURL: typeof c.url === 'string' && /^https:\/\/ai-gateway\.vercel\.sh\/v1\/?$/i.test(c.url)
            ? undefined
            : c.url,
    }),
    openrouter: (c) => ({ apiKey: c.apiKey, baseURL: c.url }),
    nvidia: (c) => ({ apiKey: c.apiKey, baseURL: c.url }),
    moonshotai: (c) => ({ apiKey: c.apiKey, baseURL: c.url }),
    minimax: (c) => ({ apiKey: c.apiKey, baseURL: c.url }),
    alibaba: (c) => ({ apiKey: c.apiKey, baseURL: c.url }),
    'azure-openai': (c) => {
        const isEntra = (0, agents_1.isAzureEntraCredential)(c);
        return {
            ...((0, agents_1.hasAzureApiKey)(c) ? { apiKey: c.apiKey } : {}),
            resourceName: c.resourceName,
            apiVersion: c.apiVersion,
            baseURL: c.endpointType === 'foundry' ? c.foundryEndpoint : c.endpoint,
            endpointType: c.endpointType,
            ...(isEntra
                ? {
                    oauthClientId: c.clientId,
                    oauthClientSecret: c.clientSecret,
                    oauthAccessTokenUrl: c.accessTokenUrl,
                    oauthScope: c.scope,
                    oauthAuthentication: c.authentication,
                    oauthTokenData: c.oauthTokenData,
                }
                : {}),
        };
    },
    'aws-bedrock': (c) => ({
        region: c.region,
        accessKeyId: c.accessKeyId,
        secretAccessKey: c.secretAccessKey,
        sessionToken: c.sessionToken,
    }),
};
function mapCredentialForProvider(provider, raw) {
    const mapper = PROVIDER_CREDENTIAL_MAPPERS[provider];
    if (!mapper)
        return raw;
    const mapped = mapper(raw);
    return Object.fromEntries(Object.entries(mapped).filter(([, v]) => v !== undefined));
}
exports.SUPPORTED_AGENT_PROVIDERS = Object.keys(PROVIDER_CREDENTIAL_MAPPERS);
function isSupportedAgentProvider(provider) {
    return provider in PROVIDER_CREDENTIAL_MAPPERS;
}
//# sourceMappingURL=credential-field-mapping.js.map