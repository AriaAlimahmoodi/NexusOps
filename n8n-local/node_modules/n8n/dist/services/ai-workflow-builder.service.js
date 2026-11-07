"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowBuilderService = void 0;
const ai_workflow_builder_1 = require("@n8n/ai-workflow-builder");
const backend_common_1 = require("@n8n/backend-common");
const backend_module_workflow_builder_1 = require("@n8n/backend-module-workflow-builder");
const backend_network_1 = require("@n8n/backend-network");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const ai_assistant_sdk_1 = require("@n8n_io/ai-assistant-sdk");
const fs = __importStar(require("fs"));
const n8n_core_1 = require("n8n-core");
const path = __importStar(require("path"));
const constants_2 = require("../constants");
const license_1 = require("../license");
const load_nodes_and_credentials_1 = require("../load-nodes-and-credentials");
const push_1 = require("../push");
const dynamic_node_parameters_service_1 = require("../services/dynamic-node-parameters.service");
const backend_services_1 = require("@n8n/backend-services");
const telemetry_1 = require("../telemetry");
const ai_proxy_fetch_1 = require("../utils/ai-proxy-fetch");
const workflow_execute_additional_data_1 = require("../workflow-execute-additional-data");
let WorkflowBuilderService = class WorkflowBuilderService {
    constructor(loadNodesAndCredentials, license, config, logger, urlService, push, telemetry, instanceSettings, dynamicNodeParametersService, sessionRepository, ssrfConfig, ssrfProtectionService, outboundHttp) {
        this.loadNodesAndCredentials = loadNodesAndCredentials;
        this.license = license;
        this.config = config;
        this.logger = logger;
        this.urlService = urlService;
        this.push = push;
        this.telemetry = telemetry;
        this.instanceSettings = instanceSettings;
        this.dynamicNodeParametersService = dynamicNodeParametersService;
        this.sessionRepository = sessionRepository;
        this.ssrfConfig = ssrfConfig;
        this.ssrfProtectionService = ssrfProtectionService;
        this.outboundHttp = outboundHttp;
        this.loadNodesAndCredentials.addPostProcessor(async () => await this.refreshNodeTypes());
    }
    async refreshNodeTypes() {
        if (this.service) {
            const { nodes: nodeTypeDescriptions } = await this.loadNodesAndCredentials.collectTypes();
            this.service.updateNodeTypes(nodeTypeDescriptions);
        }
    }
    async getService() {
        if (this.service)
            return this.service;
        this.initPromise ??= this.initializeService();
        return await this.initPromise;
    }
    async initializeService() {
        const baseUrl = this.config.aiAssistant.baseUrl;
        if (baseUrl) {
            const licenseCert = await this.license.loadCertStr();
            const consumerId = this.license.getConsumerId();
            this.client = new ai_assistant_sdk_1.AiAssistantClient({
                licenseCert,
                consumerId,
                baseUrl,
                n8nVersion: constants_2.N8N_VERSION,
                instanceId: this.instanceSettings.instanceId,
            });
            this.license.onCertRefresh((cert) => {
                this.client?.updateLicenseCert(cert);
            });
        }
        const onCreditsUpdated = (userId, creditsQuota, creditsClaimed) => {
            this.push.sendToUsers({
                type: 'updateBuilderCredits',
                data: {
                    creditsQuota,
                    creditsClaimed,
                },
            }, [userId]);
        };
        const onTelemetryEvent = (event, properties) => {
            this.telemetry.track(event, properties);
        };
        const resourceLocatorCallbackFactory = (userId) => {
            return async (methodName, path, nodeTypeAndVersion, currentNodeParameters, credentials, filter, paginationToken) => {
                const additionalData = await (0, workflow_execute_additional_data_1.getBase)({
                    userId,
                    currentNodeParameters,
                });
                return await this.dynamicNodeParametersService.getResourceLocatorResults(methodName, path, additionalData, nodeTypeAndVersion, currentNodeParameters, credentials, filter, paginationToken);
            };
        };
        await this.loadNodesAndCredentials.postProcessLoaders();
        const { nodes: nodeTypeDescriptions } = await this.loadNodesAndCredentials.collectTypes();
        const webFetchSsrfGuard = this.ssrfConfig.enabled
            ? this.ssrfProtectionService
            : (0, ai_workflow_builder_1.createPassthroughSsrfGuard)();
        const modelFetch = (0, ai_proxy_fetch_1.createAiProxyFetch)(this.outboundHttp);
        this.service = new ai_workflow_builder_1.AiWorkflowBuilderService(nodeTypeDescriptions, this.sessionRepository, this.client, this.logger, this.instanceSettings.instanceId, this.urlService.getInstanceBaseUrl(), constants_2.N8N_VERSION, onCreditsUpdated, onTelemetryEvent, this.resolveBuiltinNodeDefinitionDirs(), resourceLocatorCallbackFactory, webFetchSsrfGuard, modelFetch);
        return this.service;
    }
    resolveBuiltinNodeDefinitionDirs() {
        const dirs = [];
        for (const packageId of constants_1.BUILTIN_NODES_PACKAGES) {
            try {
                const packageJsonPath = require.resolve(`${packageId}/package.json`);
                const distDir = path.dirname(packageJsonPath);
                const nodeDefsDir = path.join(distDir, 'dist', 'node-definitions');
                if (fs.existsSync(nodeDefsDir)) {
                    dirs.push(nodeDefsDir);
                }
            }
            catch {
            }
        }
        return dirs;
    }
    async *chat(payload, user, abortSignal) {
        const service = await this.getService();
        yield* service.chat(payload, user, abortSignal);
    }
    async getSessions(workflowId, user, isCodeBuilder) {
        const service = await this.getService();
        const sessions = await service.getSessions(workflowId, user, isCodeBuilder);
        return sessions;
    }
    async getBuilderInstanceCredits(user) {
        const service = await this.getService();
        return await service.getBuilderInstanceCredits(user);
    }
    async clearSession(workflowId, user) {
        const service = await this.getService();
        await service.clearSession(workflowId, user);
    }
    async truncateMessagesAfter(workflowId, user, messageId, versionCardId) {
        const service = await this.getService();
        return await service.truncateMessagesAfter(workflowId, user, messageId, versionCardId);
    }
};
exports.WorkflowBuilderService = WorkflowBuilderService;
exports.WorkflowBuilderService = WorkflowBuilderService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [load_nodes_and_credentials_1.LoadNodesAndCredentials, license_1.License, config_1.GlobalConfig, backend_common_1.Logger, backend_services_1.UrlService, push_1.Push, telemetry_1.Telemetry, n8n_core_1.InstanceSettings, dynamic_node_parameters_service_1.DynamicNodeParametersService, backend_module_workflow_builder_1.WorkflowBuilderSessionRepository, config_1.SsrfProtectionConfig, backend_network_1.SsrfProtectionService, backend_network_1.OutboundHttp])
], WorkflowBuilderService);
//# sourceMappingURL=ai-workflow-builder.service.js.map