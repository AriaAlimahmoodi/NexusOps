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
exports.AgentModelCatalogService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const model_discovery_1 = require("@n8n/ai-utilities/model-discovery");
const builder_model_live_lookup_service_1 = require("./builder/builder-model-live-lookup.service");
const agent_default_model_resolver_service_1 = require("./agent-default-model-resolver.service");
const model_snapshot_alias_1 = require("./utils/model-snapshot-alias");
const provider_model_id_1 = require("./utils/provider-model-id");
function getProviderCredentialType(provider) {
    if (!(0, model_discovery_1.isModelDiscoveryProvider)(provider))
        return undefined;
    return (0, api_types_1.getAgentModelProviderCredentialTypes)(provider)[0];
}
function liveModelIdVariants(id) {
    const alias = (0, model_snapshot_alias_1.stripSnapshotSuffix)(id);
    return alias === id ? [id] : [id, alias];
}
let AgentModelCatalogService = class AgentModelCatalogService {
    constructor(logger, builderModelLiveLookupService, agentDefaultModelResolverService) {
        this.logger = logger;
        this.builderModelLiveLookupService = builderModelLiveLookupService;
        this.agentDefaultModelResolverService = agentDefaultModelResolverService;
    }
    async getProviderModels(user, projectId, provider, credentialId) {
        const credentialType = getProviderCredentialType(provider);
        if (!credentialId || !credentialType)
            return await this.unverifiedCatalog(provider);
        let lookup;
        try {
            lookup = await this.builderModelLiveLookupService.lookup(user, projectId, credentialId, credentialType, provider);
        }
        catch (error) {
            return await this.unavailableModels(provider, credentialId, error);
        }
        return await this.modelsFromLookup(provider, credentialId, lookup);
    }
    async unverifiedCatalog(provider) {
        const models = await this.getCatalogModels(provider);
        return { provider, verified: false, models: Object.values(models) };
    }
    async unavailableModels(provider, credentialId, error, policy) {
        this.logLiveLookupFailure(provider, error);
        if (policy === 'managed' ||
            policy === 'endpoint-only' ||
            credentialId === api_types_1.AI_GATEWAY_MANAGED_TAG) {
            return { provider, verified: true, unavailable: true, models: [] };
        }
        return await this.unverifiedCatalog(provider);
    }
    async modelsFromLookup(provider, credentialId, lookup) {
        if (lookup.status === 'unavailable') {
            return await this.unavailableModels(provider, credentialId, lookup.error, lookup.policy);
        }
        if (lookup.policy === 'endpoint-only') {
            return this.withDefaultModel(provider, credentialId, {
                provider,
                verified: true,
                models: lookup.models.map((live) => ({
                    id: live.value,
                    name: live.name || live.value,
                    toolCall: true,
                })),
            });
        }
        const catalogModels = await this.getCatalogModels(provider);
        const models = lookup.policy === 'managed'
            ? this.enrichManagedModels(provider, lookup.models, catalogModels)
            : this.verifyCuratedModels(provider, lookup.models, catalogModels);
        return this.withDefaultModel(provider, credentialId, { provider, verified: true, models });
    }
    enrichManagedModels(provider, liveModels, catalogModels) {
        return liveModels.map((live) => {
            const id = (0, provider_model_id_1.normalizeProviderModelId)(provider, live.value);
            const catalogMatch = catalogModels[id] ?? catalogModels[(0, model_snapshot_alias_1.stripSnapshotSuffix)(id)];
            const liveName = (0, provider_model_id_1.normalizeProviderModelId)(provider, live.name);
            const gatewayName = liveName && liveName !== id ? liveName : undefined;
            const priority = live.priority !== undefined ? { priority: live.priority } : {};
            return catalogMatch
                ? { ...catalogMatch, id, ...(gatewayName ? { name: gatewayName } : {}), ...priority }
                : { id, name: gatewayName ?? id, toolCall: true, ...priority };
        });
    }
    verifyCuratedModels(provider, liveModels, catalogModels) {
        const liveModelIds = new Set(liveModels.flatMap((live) => liveModelIdVariants((0, provider_model_id_1.normalizeProviderModelId)(provider, live.value))));
        const catalogList = Object.values(catalogModels);
        if (catalogList.length > 0)
            return catalogList.filter((model) => liveModelIds.has(model.id));
        return liveModels.map((live) => {
            const id = (0, provider_model_id_1.normalizeProviderModelId)(provider, live.value);
            return {
                id,
                name: (0, provider_model_id_1.normalizeProviderModelId)(provider, live.name) || id,
                toolCall: true,
            };
        });
    }
    withDefaultModel(provider, credentialId, result) {
        const resolved = this.agentDefaultModelResolverService.resolveFromVerifiedModelIds(provider, credentialId, result.models.map((model) => model.id));
        if (!resolved)
            return result;
        const modelId = resolved.model.slice(`${provider}/`.length);
        return result.models.some((model) => model.id === modelId)
            ? { ...result, defaultModelId: modelId }
            : result;
    }
    logLiveLookupFailure(provider, error) {
        this.logger.warn('Live model list failed', {
            provider,
            error: error instanceof Error ? error.message : String(error),
        });
    }
    async getCatalogModels(provider) {
        try {
            const { fetchProviderCatalog } = await import('@n8n/agents');
            const catalog = await fetchProviderCatalog();
            return catalog[provider]?.models ?? {};
        }
        catch (error) {
            this.logger.warn('Model catalog fetch failed', {
                provider,
                error: error instanceof Error ? error.message : String(error),
            });
            return {};
        }
    }
};
exports.AgentModelCatalogService = AgentModelCatalogService;
exports.AgentModelCatalogService = AgentModelCatalogService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, builder_model_live_lookup_service_1.BuilderModelLiveLookupService, agent_default_model_resolver_service_1.AgentDefaultModelResolverService])
], AgentModelCatalogService);
//# sourceMappingURL=agent-model-catalog.service.js.map