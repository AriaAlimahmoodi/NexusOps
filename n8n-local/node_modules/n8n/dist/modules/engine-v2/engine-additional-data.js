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
exports.EngineAdditionalDataBuilder = void 0;
const backend_network_1 = require("@n8n/backend-network");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const engine_1 = require("@n8n/engine");
const n8n_core_1 = require("n8n-core");
function unimplemented(feature) {
    return async () => {
        throw new engine_1.UnimplementedError(`${feature} is not supported on Engine v2 yet`);
    };
}
const unimplementedVariablesAccess = () => {
    throw new engine_1.UnimplementedError('Variables ($vars) are not supported on Engine v2 yet');
};
const unimplementedVariables = new Proxy({}, {
    get: unimplementedVariablesAccess,
    ownKeys: unimplementedVariablesAccess,
    has: unimplementedVariablesAccess,
    getOwnPropertyDescriptor: unimplementedVariablesAccess,
});
class UnimplementedExternalSecretsProxy extends n8n_core_1.ExternalSecretsProxy {
    unavailable() {
        throw new engine_1.UnimplementedError('External secrets ($secrets) are not supported on Engine v2 yet');
    }
    getSecret() {
        return this.unavailable();
    }
    hasSecret() {
        return this.unavailable();
    }
    hasProvider() {
        return this.unavailable();
    }
    listProviders() {
        return this.unavailable();
    }
    listSecrets() {
        return this.unavailable();
    }
}
const unimplementedExternalSecretsProxy = new UnimplementedExternalSecretsProxy();
let EngineAdditionalDataBuilder = class EngineAdditionalDataBuilder {
    constructor(urlService, globalConfig, eventService, ssrfProtectionConfig, ssrfProtectionService) {
        this.urlService = urlService;
        this.globalConfig = globalConfig;
        this.eventService = eventService;
        this.ssrfProtectionConfig = ssrfProtectionConfig;
        this.ssrfProtectionService = ssrfProtectionService;
    }
    build(context, credentialsHelper) {
        const webhookBase = this.urlService.getWebhookBaseUrl();
        const testWebhookBase = this.urlService.getTestWebhookBaseUrl();
        const { endpoints } = this.globalConfig;
        const { eventService } = this;
        const additionalData = {
            currentNodeExecutionIndex: 0,
            credentialsHelper,
            executionId: context.executionId,
            workflowId: context.workflowId,
            userId: context.userId,
            projectId: context.projectId,
            restApiUrl: webhookBase + endpoints.rest,
            instanceBaseUrl: `${this.urlService.getInstanceBaseUrl()}/`,
            formBaseUrl: webhookBase + endpoints.form,
            formWaitingBaseUrl: webhookBase + endpoints.formWaiting,
            formTestBaseUrl: testWebhookBase + endpoints.formTest,
            webhookBaseUrl: webhookBase + endpoints.webhook,
            webhookWaitingBaseUrl: webhookBase + endpoints.webhookWaiting,
            webhookTestBaseUrl: testWebhookBase + endpoints.webhookTest,
            mcpBaseUrl: webhookBase + endpoints.mcp,
            mcpTestBaseUrl: testWebhookBase + endpoints.mcpTest,
            variables: unimplementedVariables,
            externalSecretsProxy: unimplementedExternalSecretsProxy,
            logAiEvent: (eventName, payload) => {
                eventService.emit(eventName, payload);
            },
            logHitlResponse: (payload) => {
                eventService.emit('hitl-response-actioned', payload);
            },
            getRunnerStatus: () => ({ available: false }),
            startRunnerTask: unimplemented('Task runners (Code node)'),
            executeWorkflow: unimplemented('Sub-workflows (executeWorkflow)'),
            executeAgent: unimplemented('Agents (executeAgent)'),
            listAgents: unimplemented('Agents (listAgents)'),
            getRunExecutionData: unimplemented('Reading another execution (getRunExecutionData)'),
            getRuntimeCredential: unimplemented('Runtime credentials (getRuntimeCredential)'),
            setExecutionStatus: () => {
                throw new engine_1.UnimplementedError('Setting the execution status from a node (setExecutionStatus) is not supported on Engine v2 yet');
            },
        };
        if (this.ssrfProtectionConfig.enabled) {
            additionalData.ssrfBridge = this.ssrfProtectionService;
        }
        return additionalData;
    }
};
exports.EngineAdditionalDataBuilder = EngineAdditionalDataBuilder;
exports.EngineAdditionalDataBuilder = EngineAdditionalDataBuilder = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.UrlService, config_1.GlobalConfig, backend_services_1.EventService, config_1.SsrfProtectionConfig, backend_network_1.SsrfProtectionService])
], EngineAdditionalDataBuilder);
//# sourceMappingURL=engine-additional-data.js.map