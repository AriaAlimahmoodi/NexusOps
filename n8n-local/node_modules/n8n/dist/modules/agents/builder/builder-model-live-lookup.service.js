"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuilderModelLiveLookupService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const credentials_service_1 = require("../../../credentials/credentials.service");
const credentials_helper_1 = require("../../../credentials-helper");
const ai_gateway_service_1 = require("../../../services/ai-gateway.service");
const ai_proxy_fetch_1 = require("../../../utils/ai-proxy-fetch");
const credential_field_mapping_1 = require("../json-config/credential-field-mapping");
const llm_provider_defaults_1 = require("../llm-provider-defaults");
const decrypt_agent_credential_1 = require("../utils/decrypt-agent-credential");
let BuilderModelLiveLookupService = class BuilderModelLiveLookupService {
    constructor(credentialsService, credentialsHelper, outboundHttp, aiGatewayService) {
        this.credentialsService = credentialsService;
        this.credentialsHelper = credentialsHelper;
        this.outboundHttp = outboundHttp;
        this.aiGatewayService = aiGatewayService;
    }
    async list(user, projectId, credentialId, credentialType, provider, options) {
        const result = await this.lookup(user, projectId, credentialId, credentialType, provider, options);
        if (result.status === 'unavailable')
            throw result.error;
        return result.models;
    }
    async lookup(user, projectId, credentialId, credentialType, provider, options) {
        if (credentialId === api_types_1.AI_GATEWAY_MANAGED_TAG) {
            if (options?.useEvalModelCatalog) {
                return this.getEvalModelCatalog(credentialType, provider, 'managed');
            }
            return await this.lookupAiGatewayManagedModels(projectId, provider, user);
        }
        const usableCredentials = await this.credentialsService.getCredentialsAUserCanUseInAWorkflow(user, { projectId, excludePersonalRoute: true });
        const usable = usableCredentials.find((c) => c.id === credentialId);
        if (!usable || usable.type !== credentialType) {
            throw new Error(`Credential ${credentialId} not found or not accessible`);
        }
        if (options?.useEvalModelCatalog) {
            return this.getEvalModelCatalog(credentialType, provider, 'curated');
        }
        const credentialData = await (0, decrypt_agent_credential_1.decryptAgentCredential)(this.credentialsHelper, usable, {
            projectId,
            userId: user.id,
        });
        return await this.discoverModels(provider, credentialData);
    }
    getEvalModelCatalog(credentialType, provider, policy) {
        const configuredDefault = llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS[credentialType];
        const model = configuredDefault?.provider === provider
            ? configuredDefault.defaultModel
            : `eval-${provider}-model`;
        return {
            status: 'success',
            models: [{ name: model, value: model }],
            policy,
        };
    }
    async lookupAiGatewayManagedModels(projectId, provider, user) {
        try {
            const credentialType = await this.aiGatewayService.getCredentialTypeForProvider(provider);
            if (!credentialType) {
                throw new Error(`Gateway credits do not support the "${provider}" model provider`);
            }
            const raw = await this.aiGatewayService.getSyntheticCredential({
                credentialType,
                userId: user?.id,
                projectId,
            });
            return await this.discoverModels(provider, raw, 'managed');
        }
        catch (error) {
            return { status: 'unavailable', error, policy: 'managed' };
        }
    }
    async discoverModels(provider, rawData, policyOverride) {
        const { isOpenAiCustomEndpoint, listModelsForProvider } = await import('@n8n/ai-utilities/model-discovery');
        const credentialData = { apiKey: '', ...rawData };
        const mapped = (0, credential_field_mapping_1.mapCredentialForProvider)(provider, credentialData);
        const apiKey = typeof mapped.apiKey === 'string' ? mapped.apiKey : '';
        const baseURL = typeof mapped.baseURL === 'string' && mapped.baseURL ? mapped.baseURL : undefined;
        const policy = policyOverride ??
            (provider === 'openai' && isOpenAiCustomEndpoint(baseURL) ? 'endpoint-only' : 'curated');
        const headers = this.getOpenAiHeaders(provider, credentialData);
        try {
            const models = await listModelsForProvider(provider, {
                apiKey,
                baseURL,
                fetch: (0, ai_proxy_fetch_1.createAiProxyFetch)(this.outboundHttp),
                ...(headers ? { headers } : {}),
            });
            if (models.length === 0) {
                throw new Error(`Provider ${provider} returned no models`);
            }
            return {
                status: 'success',
                models: models.map((model) => ({
                    name: model.name,
                    value: model.id,
                    ...(model.priority !== undefined ? { priority: model.priority } : {}),
                })),
                policy,
            };
        }
        catch (error) {
            return { status: 'unavailable', error, policy };
        }
    }
    getOpenAiHeaders(provider, credentialData) {
        if (provider !== 'openai')
            return undefined;
        const headers = {};
        if (typeof credentialData.organizationId === 'string' &&
            credentialData.organizationId.length > 0) {
            headers['OpenAI-Organization'] = credentialData.organizationId;
        }
        if (credentialData.header === true &&
            typeof credentialData.headerName === 'string' &&
            credentialData.headerName.length > 0 &&
            typeof credentialData.headerValue === 'string') {
            const normalizedName = credentialData.headerName.toLowerCase();
            let headerName = credentialData.headerName;
            if (normalizedName === 'authorization') {
                headerName = 'Authorization';
            }
            else if (normalizedName === 'openai-organization') {
                headerName = 'OpenAI-Organization';
            }
            headers[headerName] = credentialData.headerValue;
        }
        return Object.keys(headers).length > 0 ? headers : undefined;
    }
};
exports.BuilderModelLiveLookupService = BuilderModelLiveLookupService;
exports.BuilderModelLiveLookupService = BuilderModelLiveLookupService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credentials_service_1.CredentialsService, credentials_helper_1.CredentialsHelper, backend_network_1.OutboundHttp, ai_gateway_service_1.AiGatewayService])
], BuilderModelLiveLookupService);
//# sourceMappingURL=builder-model-live-lookup.service.js.map