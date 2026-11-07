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
exports.AgentDefaultModelResolverService = void 0;
const api_types_1 = require("@n8n/api-types");
const model_discovery_1 = require("@n8n/ai-utilities/model-discovery");
const di_1 = require("@n8n/di");
const credentials_service_1 = require("../../credentials/credentials.service");
const ai_gateway_service_1 = require("../../services/ai-gateway.service");
const builder_model_live_lookup_service_1 = require("./builder/builder-model-live-lookup.service");
const llm_provider_defaults_1 = require("./llm-provider-defaults");
const agent_credential_provider_1 = require("./utils/agent-credential-provider");
const provider_model_id_1 = require("./utils/provider-model-id");
let AgentDefaultModelResolverService = class AgentDefaultModelResolverService {
    constructor(credentialsService, modelLookupService, aiGatewayService) {
        this.credentialsService = credentialsService;
        this.modelLookupService = modelLookupService;
        this.aiGatewayService = aiGatewayService;
    }
    async resolve(user, projectId) {
        const credentials = await (0, agent_credential_provider_1.createAgentCredentialProvider)(this.credentialsService, projectId, user).list();
        const supportedCredentials = credentials.filter((credential) => Object.hasOwn(llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS, credential.type));
        if (supportedCredentials.length === 0) {
            return await this.resolveManagedOpenAi(user, projectId);
        }
        const credentialsByProvider = new Map();
        for (const credential of supportedCredentials) {
            const provider = llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS[credential.type].provider;
            credentialsByProvider.set(provider, [
                ...(credentialsByProvider.get(provider) ?? []),
                credential,
            ]);
        }
        const provider = llm_provider_defaults_1.LLM_PROVIDER_PRIORITY.find((candidate) => credentialsByProvider.get(candidate)?.length === 1);
        if (!provider)
            return null;
        return await this.resolveCredential(user, projectId, credentialsByProvider.get(provider)?.[0]);
    }
    resolveFromVerifiedModelIds(provider, credentialId, verifiedModelIds) {
        const defaults = this.findProviderDefault(provider);
        if (!defaults)
            return null;
        const match = (0, provider_model_id_1.findVerifiedModelId)(provider, defaults.defaultModel, verifiedModelIds);
        return match ? { model: `${provider}/${match}`, credential: credentialId } : null;
    }
    findProviderDefault(provider) {
        const entry = Object.entries(llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS).find(([, defaults]) => defaults.provider === provider);
        return entry
            ? {
                provider: entry[1].provider,
                defaultModel: entry[1].defaultModel,
                credentialType: entry[0],
            }
            : undefined;
    }
    async resolveManagedOpenAi(user, projectId) {
        const defaults = llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS.openAiApi;
        let credentialType;
        try {
            credentialType = await this.aiGatewayService.getCredentialTypeForProvider(defaults.provider);
        }
        catch {
            return null;
        }
        if (credentialType !== 'openAiApi')
            return null;
        return await this.resolveCredential(user, projectId, {
            id: api_types_1.AI_GATEWAY_MANAGED_TAG,
            name: 'Gateway credits',
            type: credentialType,
        });
    }
    async resolveCredential(user, projectId, credential) {
        if (!credential)
            return null;
        const defaults = llm_provider_defaults_1.LLM_PROVIDER_DEFAULTS[credential.type];
        if (!defaults)
            return null;
        if (!(0, model_discovery_1.isModelDiscoveryProvider)(defaults.provider)) {
            return { model: `${defaults.provider}/${defaults.defaultModel}`, credential: credential.id };
        }
        try {
            const availableModels = await this.modelLookupService.list(user, projectId, credential.id, credential.type, defaults.provider);
            return this.resolveFromVerifiedModelIds(defaults.provider, credential.id, availableModels.map(({ value }) => value));
        }
        catch {
            return null;
        }
    }
};
exports.AgentDefaultModelResolverService = AgentDefaultModelResolverService;
exports.AgentDefaultModelResolverService = AgentDefaultModelResolverService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credentials_service_1.CredentialsService, builder_model_live_lookup_service_1.BuilderModelLiveLookupService, ai_gateway_service_1.AiGatewayService])
], AgentDefaultModelResolverService);
//# sourceMappingURL=agent-default-model-resolver.service.js.map