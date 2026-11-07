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
exports.WorkflowMcpTriggerResourceResolver = void 0;
const constants_1 = require("../../../constants");
const backend_services_1 = require("@n8n/backend-services");
const webhook_service_1 = require("../../../webhooks/webhook.service");
const workflow_finder_service_1 = require("../../../workflows/workflow-finder.service");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const resource_gate_1 = require("../resource-gate");
const utils_1 = require("./utils");
let WorkflowMcpTriggerResourceResolver = class WorkflowMcpTriggerResourceResolver {
    constructor(config, webhookService, workflowRepository, urlService, logger, workflowFinderService) {
        this.config = config;
        this.webhookService = webhookService;
        this.workflowRepository = workflowRepository;
        this.urlService = urlService;
        this.logger = logger;
        this.workflowFinderService = workflowFinderService;
        this.id = 'workflow-mcp-trigger';
        this.scopes = utils_1.WORKFLOW_MCP_TRIGGER_SCOPES;
    }
    async resolveByUrl(resourceUrl) {
        const pathname = (0, utils_1.webhookPathFromResourceUrl)(resourceUrl, this.urlService.getWebhookBaseUrl(), this.logger);
        if (pathname === undefined)
            return undefined;
        return await this.resolveByPath(pathname);
    }
    async resolveByPath(pathname) {
        if (!pathname.startsWith(`/${this.config.endpoints.mcp}/`)) {
            return undefined;
        }
        const path = (0, utils_1.trimSlashes)(pathname.slice(this.config.endpoints.mcp.length + 1));
        this.logger.debug(`Resolving workflow MCP trigger resource for path: ${path}`);
        const webhook = await this.webhookService.findStaticWebhook('POST', path);
        if (!webhook) {
            this.logger.debug(`No webhook found for path: ${path}`);
            return undefined;
        }
        if (webhook.isDynamic) {
            this.logger.debug(`Webhook for path ${path} is dynamic, skipping protected resource resolution`);
            return undefined;
        }
        const { workflowId, node: nodeName } = webhook;
        const workflow = await this.workflowRepository.findOne({
            where: { id: workflowId },
            relations: {
                activeVersion: true,
            },
        });
        if (!workflow?.activeVersion) {
            this.logger.debug(`No active version found for workflow with ID: ${workflowId}`);
            return undefined;
        }
        const node = workflow.activeVersion.nodes.find((n) => n.name === nodeName);
        if (!node) {
            this.logger.debug(`No node found with name ${nodeName} in active version of workflow with ID: ${workflowId}`);
            return undefined;
        }
        if (node.type === constants_1.MCP_TRIGGER_NODE_TYPE &&
            !node.disabled &&
            node.parameters.authentication === 'n8nOAuth2') {
            const resourceUrl = `${(0, utils_1.trimTrailingSlash)(this.urlService.getWebhookBaseUrl())}/${this.config.endpoints.mcp}/${path}`;
            const requireExecute = node.parameters.requireExecuteAccess !== false;
            const audiences = [resourceUrl];
            return {
                id: 'workflow-mcp:' + workflow.id,
                surface: 'trigger',
                getResourceUrl: () => resourceUrl,
                getAudiences: () => audiences,
                scopes: utils_1.WORKFLOW_MCP_TRIGGER_SCOPES,
                displayName: workflow.name,
                ...(0, resource_gate_1.triggerResourceGate)(this.workflowFinderService, {
                    audiences,
                    executeAccessWorkflowId: requireExecute ? workflow.id : undefined,
                }),
            };
        }
        this.logger.debug(`Node with name ${nodeName} in active version of workflow with ID: ${workflowId} is not an enabled MCP trigger with n8nOAuth2 authentication`);
        return undefined;
    }
};
exports.WorkflowMcpTriggerResourceResolver = WorkflowMcpTriggerResourceResolver;
exports.WorkflowMcpTriggerResourceResolver = WorkflowMcpTriggerResourceResolver = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, webhook_service_1.WebhookService, db_1.WorkflowRepository, backend_services_1.UrlService, backend_common_1.Logger, workflow_finder_service_1.WorkflowFinderService])
], WorkflowMcpTriggerResourceResolver);
//# sourceMappingURL=workflow-mcp-trigger-resource.resolver.js.map