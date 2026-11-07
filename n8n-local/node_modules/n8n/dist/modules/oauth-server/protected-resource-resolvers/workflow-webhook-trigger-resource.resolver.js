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
exports.WorkflowWebhookTriggerResourceResolver = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const backend_services_1 = require("@n8n/backend-services");
const webhook_service_1 = require("../../../webhooks/webhook.service");
const workflow_finder_service_1 = require("../../../workflows/workflow-finder.service");
const resource_gate_1 = require("../resource-gate");
const utils_1 = require("./utils");
let WorkflowWebhookTriggerResourceResolver = class WorkflowWebhookTriggerResourceResolver {
    constructor(config, webhookService, workflowRepository, urlService, logger, workflowFinderService) {
        this.config = config;
        this.webhookService = webhookService;
        this.workflowRepository = workflowRepository;
        this.urlService = urlService;
        this.logger = logger;
        this.workflowFinderService = workflowFinderService;
        this.id = 'workflow-webhook-trigger';
        this.scopes = utils_1.WEBHOOK_TRIGGER_SCOPES;
    }
    async resolveByUrl(resourceUrl) {
        const pathname = (0, utils_1.webhookPathFromResourceUrl)(resourceUrl, this.urlService.getWebhookBaseUrl(), this.logger);
        if (pathname === undefined)
            return undefined;
        return await this.resolveByPath(pathname, new URL(resourceUrl).search);
    }
    async resolveByPath(pathname, search) {
        if (!pathname.startsWith(`/${this.config.endpoints.webhook}/`)) {
            return undefined;
        }
        const requestedMethod = (0, utils_1.parseMethodParam)(new URLSearchParams(search).get('method'));
        const path = (0, utils_1.trimSlashes)(pathname.slice(this.config.endpoints.webhook.length + 1));
        this.logger.debug(`Resolving workflow webhook trigger resource for path: ${path}`);
        const webhooks = await this.webhookService.findTriggerWebhooksByPath(path, requestedMethod);
        const row = requestedMethod
            ? webhooks.find((webhook) => webhook.method === requestedMethod)
            : webhooks.length === 1
                ? webhooks[0]
                : undefined;
        if (!row) {
            this.logger.debug(`No webhook at path ${path} for method ${requestedMethod ?? '(unspecified)'}`);
            return undefined;
        }
        const triggerMethods = webhooks.map((webhook) => webhook.method);
        return await this.resolveWebhookNode(row.workflowId, row.node, (0, utils_1.webhookResourcePath)(row.webhookPath, row.webhookId), row.method, triggerMethods);
    }
    async resolveWebhookNode(workflowId, nodeName, resourcePath, requestedMethod, triggerMethods) {
        const workflow = await this.workflowRepository.findOne({
            where: { id: workflowId },
            relations: { activeVersion: true },
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
        if (node.type === n8n_workflow_1.WEBHOOK_NODE_TYPE &&
            !node.disabled &&
            node.parameters.authentication === 'n8nOAuth2') {
            const baseUrl = `${(0, utils_1.trimTrailingSlash)(this.urlService.getWebhookBaseUrl())}/${this.config.endpoints.webhook}/${resourcePath}`;
            const urlFor = (method) => `${baseUrl}${(0, utils_1.methodQueryString)(method)}`;
            const methods = [...new Set(triggerMethods.map((method) => method.toUpperCase()))].sort();
            const requireExecute = node.parameters.requireExecuteAccess !== false;
            const audiences = methods.map(urlFor);
            return {
                id: `workflow-webhook:${workflow.id}:${resourcePath}`,
                surface: 'trigger',
                getResourceUrl: () => urlFor(requestedMethod),
                getAudiences: () => audiences,
                scopes: utils_1.WEBHOOK_TRIGGER_SCOPES,
                displayName: workflow.name,
                ...((0, utils_1.webhookAllowsBrowserFlow)(node, requestedMethod) && { isFirstParty: true }),
                ...(0, resource_gate_1.triggerResourceGate)(this.workflowFinderService, {
                    audiences,
                    executeAccessWorkflowId: requireExecute ? workflow.id : undefined,
                }),
            };
        }
        this.logger.debug(`Node with name ${nodeName} in active version of workflow with ID: ${workflowId} is not an enabled webhook trigger with n8nOAuth2 authentication`);
        return undefined;
    }
};
exports.WorkflowWebhookTriggerResourceResolver = WorkflowWebhookTriggerResourceResolver;
exports.WorkflowWebhookTriggerResourceResolver = WorkflowWebhookTriggerResourceResolver = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, webhook_service_1.WebhookService, db_1.WorkflowRepository, backend_services_1.UrlService, backend_common_1.Logger, workflow_finder_service_1.WorkflowFinderService])
], WorkflowWebhookTriggerResourceResolver);
//# sourceMappingURL=workflow-webhook-trigger-resource.resolver.js.map