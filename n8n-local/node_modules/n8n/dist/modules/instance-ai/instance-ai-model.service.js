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
exports.InstanceAiModelService = void 0;
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const get_error_message_1 = require("@n8n/utils/errors/get-error-message");
const nanoid_1 = require("nanoid");
const constants_1 = require("../../constants");
const ai_service_1 = require("../../services/ai.service");
const proxy_token_manager_1 = require("../../services/proxy-token-manager");
const ai_proxy_fetch_1 = require("../../utils/ai-proxy-fetch");
const ai_proxy_language_model_1 = require("../../utils/ai-proxy-language-model");
const ai_service_retry_1 = require("../../utils/ai-service-retry");
const instance_ai_settings_service_1 = require("./instance-ai-settings.service");
const model_config_name_1 = require("./model-config-name");
let InstanceAiModelService = class InstanceAiModelService {
    constructor(settingsService, aiService, outboundHttp, logger) {
        this.settingsService = settingsService;
        this.aiService = aiService;
        this.outboundHttp = outboundHttp;
        this.logger = logger;
    }
    isProxyEnabled() {
        return this.aiService.isProxyEnabled();
    }
    async resolveAgentModelConfig(user, proxyContext) {
        if (this.aiService.isProxyEnabled()) {
            const client = await this.aiService.getClient();
            const proxyBaseUrl = client.getApiProxyBaseUrl();
            const tokenManager = new proxy_token_manager_1.ProxyTokenManager(async () => {
                return await client.getInstanceAiApiProxyToken({ id: user.id }, { userMessageId: (0, nanoid_1.nanoid)() });
            });
            return await this.resolveProxyModel(user, proxyBaseUrl, tokenManager, proxyContext);
        }
        const httpProxyModel = await this.resolveHttpProxyModel(user);
        if (httpProxyModel)
            return httpProxyModel;
        return await this.settingsService.resolveModelConfig(user);
    }
    async resolveMemoryModelConfig(user, mainModel, run) {
        const modelName = this.settingsService.getConfiguredMemoryModelName();
        if (!modelName)
            return undefined;
        try {
            if (run.proxyBaseUrl && run.tokenManager) {
                return await this.resolveProxyModel(user, run.proxyBaseUrl, run.tokenManager, run.proxyContext, modelName);
            }
            return ((0, model_config_name_1.withModelName)(mainModel, modelName, { dropMainProviderPrefix: true }) ??
                (await this.resolveHttpProxyModel(user, modelName)));
        }
        catch (error) {
            this.logger.warn('Failed to resolve the Instance AI memory model, using the main model', {
                modelName,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
            return undefined;
        }
    }
    async resolveProxyModel(user, proxyBaseUrl, tokenManager, proxyContext, modelName) {
        const configuredModelId = this.settingsService.getConfiguredModelId();
        const isExactKimi = (0, api_types_1.isMoonshotaiKimiK3ModelId)(configuredModelId);
        const modelId = modelName
            ? (0, api_types_1.isMoonshotaiKimiK3ModelId)(modelName)
                ? modelName
                : (0, model_config_name_1.modelNameForProvider)(modelName, (0, agent_config_1.splitModelId)(configuredModelId).provider)
            : isExactKimi
                ? configuredModelId
                : this.settingsService.resolveModelName(user);
        return await (0, ai_proxy_language_model_1.createProxyLanguageModel)({
            proxyBaseUrl,
            modelId,
            tokenManager,
            feature: 'instance-ai',
            n8nVersion: constants_1.N8N_VERSION,
            outboundHttp: this.outboundHttp,
            ...proxyContext,
        });
    }
    async resolveHttpProxyModel(user, modelNameOverride) {
        const hasHttpProxy = Boolean(process.env.HTTPS_PROXY || process.env.HTTP_PROXY);
        if (!hasHttpProxy)
            return undefined;
        const config = await this.settingsService.resolveModelConfig(user);
        const modelId = typeof config === 'string' ? config : 'id' in config ? config.id : null;
        if (!modelId)
            return undefined;
        const { provider, model: modelName } = (0, agent_config_1.splitModelId)(modelId);
        const apiKey = typeof config === 'object' && 'apiKey' in config ? config.apiKey : undefined;
        const baseURL = typeof config === 'object' && 'url' in config ? config.url : undefined;
        if (provider !== 'anthropic')
            return undefined;
        const { createAnthropic } = await import('@ai-sdk/anthropic');
        return createAnthropic({
            apiKey,
            baseURL: baseURL || undefined,
            fetch: (0, ai_proxy_fetch_1.createAiProxyFetch)(this.outboundHttp),
        })(modelNameOverride ? (0, model_config_name_1.modelNameForProvider)(modelNameOverride, provider) : modelName);
    }
    async getCredits(user) {
        if (!this.aiService.isProxyEnabled()) {
            return { creditsQuota: api_types_1.UNLIMITED_CREDITS, creditsClaimed: 0 };
        }
        const client = await this.aiService.getClient();
        return await (0, ai_service_retry_1.callAiServiceWithRetry)('Instance AI credits fetch', async () => await client.getInstanceAiCredits({ id: user.id }));
    }
};
exports.InstanceAiModelService = InstanceAiModelService;
exports.InstanceAiModelService = InstanceAiModelService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [instance_ai_settings_service_1.InstanceAiSettingsService, ai_service_1.AiService, backend_network_1.OutboundHttp, backend_common_1.Logger])
], InstanceAiModelService);
//# sourceMappingURL=instance-ai-model.service.js.map