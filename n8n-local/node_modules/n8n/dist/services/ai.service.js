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
exports.AiService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const ai_assistant_sdk_1 = require("@n8n_io/ai-assistant-sdk");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../constants");
const license_1 = require("../license");
const ai_service_retry_1 = require("../utils/ai-service-retry");
let AiService = class AiService {
    constructor(licenseService, globalConfig, instanceSettings, logger, errorReporter) {
        this.licenseService = licenseService;
        this.globalConfig = globalConfig;
        this.instanceSettings = instanceSettings;
        this.logger = logger;
        this.errorReporter = errorReporter;
    }
    async init() {
        const aiAssistantEnabled = this.licenseService.isAiAssistantEnabled();
        if (!aiAssistantEnabled) {
            return;
        }
        const licenseCert = await this.licenseService.loadCertStr();
        const consumerId = this.licenseService.getConsumerId();
        const baseUrl = this.globalConfig.aiAssistant.baseUrl;
        const logLevel = this.globalConfig.logging.level;
        this.client = new ai_assistant_sdk_1.AiAssistantClient({
            licenseCert,
            consumerId,
            n8nVersion: constants_1.N8N_VERSION,
            baseUrl,
            logLevel,
            instanceId: this.instanceSettings.instanceId,
        });
        this.licenseService.onCertRefresh((cert) => {
            this.client?.updateLicenseCert(cert);
        });
    }
    async chat(payload, user) {
        const client = await this.getClient();
        return await client.chat(payload, { id: user.id });
    }
    async applySuggestion(payload, user) {
        const client = await this.getClient();
        return await client.applySuggestion(payload, { id: user.id });
    }
    async askAi(payload, user) {
        const client = await this.getClient();
        return await client.askAi(payload, { id: user.id });
    }
    isProxyEnabled() {
        return this.licenseService.isAiAssistantEnabled() && !!this.globalConfig.aiAssistant.baseUrl;
    }
    async getClient() {
        if (!this.client) {
            this.initPromise ??= this.init();
            await this.initPromise;
            if (!this.client) {
                this.initPromise = undefined;
            }
        }
        (0, n8n_workflow_1.assert)(this.client, 'AI Assistant client not initialized');
        return this.client;
    }
    async createFreeAiCredits(user) {
        const client = await this.getClient();
        return await (0, ai_service_retry_1.callAiServiceWithRetry)('AI credits credential generation', async () => await client.generateAiCreditsCredentials(user), this.logger, this.errorReporter, { retryOnTimeout: false });
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [license_1.License, config_1.GlobalConfig, n8n_core_1.InstanceSettings, backend_common_1.Logger, n8n_core_1.ErrorReporter])
], AiService);
//# sourceMappingURL=ai.service.js.map