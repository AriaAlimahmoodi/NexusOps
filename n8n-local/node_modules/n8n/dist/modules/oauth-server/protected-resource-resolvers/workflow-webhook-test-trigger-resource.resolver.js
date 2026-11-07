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
exports.WorkflowWebhookTestTriggerResourceResolver = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const backend_services_1 = require("@n8n/backend-services");
const resource_gate_1 = require("../resource-gate");
const test_webhooks_1 = require("../../../webhooks/test-webhooks");
const workflow_finder_service_1 = require("../../../workflows/workflow-finder.service");
const utils_1 = require("./utils");
let WorkflowWebhookTestTriggerResourceResolver = class WorkflowWebhookTestTriggerResourceResolver {
    constructor(config, testWebhooks, urlService, logger, workflowFinderService) {
        this.config = config;
        this.testWebhooks = testWebhooks;
        this.urlService = urlService;
        this.logger = logger;
        this.workflowFinderService = workflowFinderService;
        this.id = 'workflow-webhook-test-trigger';
        this.scopes = utils_1.WEBHOOK_TRIGGER_SCOPES;
    }
    async resolveByUrl(resourceUrl) {
        const pathname = (0, utils_1.webhookPathFromResourceUrl)(resourceUrl, this.urlService.getTestWebhookBaseUrl(), this.logger);
        if (pathname === undefined)
            return undefined;
        return await this.resolveByPath(pathname, new URL(resourceUrl).search);
    }
    async resolveByPath(pathname, search) {
        if (!pathname.startsWith(`/${this.config.endpoints.webhookTest}/`)) {
            return undefined;
        }
        const requestedMethod = (0, utils_1.parseMethodParam)(new URLSearchParams(search).get('method'));
        const path = (0, utils_1.trimSlashes)(pathname.slice(this.config.endpoints.webhookTest.length + 1));
        this.logger.debug(`Resolving workflow webhook test trigger resource for path: ${path}`);
        const registrations = await this.testWebhooks.getRegistrationsFromPath(path);
        if (registrations.length === 0) {
            this.logger.debug(`No test webhook registration found for path: ${path}`);
            return undefined;
        }
        const winner = requestedMethod
            ? registrations.find((r) => r.webhook.httpMethod === requestedMethod)
            : registrations.length === 1
                ? registrations[0]
                : undefined;
        if (!winner) {
            this.logger.debug(`No test webhook at path ${path} for method ${requestedMethod ?? '(unspecified)'}`);
            return undefined;
        }
        const triggerMethods = registrations
            .filter((r) => r.webhook.workflowId === winner.webhook.workflowId &&
            r.webhook.node === winner.webhook.node)
            .map((r) => r.webhook.httpMethod);
        const resourcePath = (0, utils_1.webhookResourcePath)(winner.webhook.path, winner.webhook.webhookId);
        return this.resolveWebhookNode(winner, resourcePath, winner.webhook.httpMethod, triggerMethods);
    }
    resolveWebhookNode({ workflowEntity, webhook }, resourcePath, requestedMethod, triggerMethods) {
        const node = workflowEntity.nodes.find((n) => n.name === webhook.node);
        if (!node) {
            this.logger.debug(`No node found with name ${webhook.node} in test registration for workflow with ID: ${workflowEntity.id}`);
            return undefined;
        }
        if (node.type === n8n_workflow_1.WEBHOOK_NODE_TYPE &&
            !node.disabled &&
            node.parameters.authentication === 'n8nOAuth2') {
            const baseUrl = `${(0, utils_1.trimTrailingSlash)(this.urlService.getTestWebhookBaseUrl())}/${this.config.endpoints.webhookTest}/${resourcePath}`;
            const urlFor = (method) => `${baseUrl}${(0, utils_1.methodQueryString)(method)}`;
            const methods = [...new Set(triggerMethods.map((method) => method.toUpperCase()))].sort();
            const requireExecute = node.parameters.requireExecuteAccess !== false;
            const audiences = methods.map(urlFor);
            return {
                id: `workflow-webhook-test:${workflowEntity.id}:${resourcePath}`,
                surface: 'trigger',
                getResourceUrl: () => urlFor(requestedMethod),
                getAudiences: () => audiences,
                scopes: utils_1.WEBHOOK_TRIGGER_SCOPES,
                displayName: workflowEntity.name,
                ...((0, utils_1.webhookAllowsBrowserFlow)(node, requestedMethod) && { isFirstParty: true }),
                ...(0, resource_gate_1.triggerResourceGate)(this.workflowFinderService, {
                    audiences,
                    executeAccessWorkflowId: requireExecute ? workflowEntity.id : undefined,
                }),
            };
        }
        this.logger.debug(`Node with name ${webhook.node} in test registration for workflow with ID: ${workflowEntity.id} is not an enabled webhook trigger with n8nOAuth2 authentication`);
        return undefined;
    }
};
exports.WorkflowWebhookTestTriggerResourceResolver = WorkflowWebhookTestTriggerResourceResolver;
exports.WorkflowWebhookTestTriggerResourceResolver = WorkflowWebhookTestTriggerResourceResolver = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, test_webhooks_1.TestWebhooks, backend_services_1.UrlService, backend_common_1.Logger, workflow_finder_service_1.WorkflowFinderService])
], WorkflowWebhookTestTriggerResourceResolver);
//# sourceMappingURL=workflow-webhook-test-trigger-resource.resolver.js.map