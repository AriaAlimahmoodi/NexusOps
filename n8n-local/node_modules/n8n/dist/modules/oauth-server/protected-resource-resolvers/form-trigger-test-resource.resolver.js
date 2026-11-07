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
exports.FormTriggerTestResourceResolver = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const backend_services_1 = require("@n8n/backend-services");
const test_webhook_registrations_service_1 = require("../../../webhooks/test-webhook-registrations.service");
const workflow_finder_service_1 = require("../../../workflows/workflow-finder.service");
const resource_gate_1 = require("../resource-gate");
const utils_1 = require("./utils");
let FormTriggerTestResourceResolver = class FormTriggerTestResourceResolver {
    constructor(config, registrations, urlService, logger, workflowFinderService) {
        this.config = config;
        this.registrations = registrations;
        this.urlService = urlService;
        this.logger = logger;
        this.workflowFinderService = workflowFinderService;
        this.id = 'form-trigger-test';
        this.scopes = utils_1.FORM_TRIGGER_SCOPES;
    }
    async resolveByUrl(resourceUrl) {
        const pathname = (0, utils_1.webhookPathFromResourceUrl)(resourceUrl, this.urlService.getTestWebhookBaseUrl(), this.logger);
        if (pathname === undefined)
            return undefined;
        return await this.resolveByPath(pathname);
    }
    async resolveByPath(pathname) {
        if (!pathname.startsWith(`/${this.config.endpoints.formTest}/`)) {
            return undefined;
        }
        const path = (0, utils_1.trimSlashes)(pathname.slice(this.config.endpoints.formTest.length + 1));
        const registration = await this.registrations.get(this.registrations.toKey({ httpMethod: 'POST', path }));
        if (!registration) {
            this.logger.debug(`No test webhook registration found for path: ${path}`);
            return undefined;
        }
        const { workflowEntity, webhook } = registration;
        const node = workflowEntity.nodes.find((n) => n.name === webhook.node);
        if (!node) {
            this.logger.debug(`No node found with name ${webhook.node} in test registration for workflow with ID: ${workflowEntity.id}`);
            return undefined;
        }
        if (node.type === n8n_workflow_1.FORM_TRIGGER_NODE_TYPE &&
            !node.disabled &&
            node.parameters.authentication === 'n8nUserAuth') {
            const resourceUrl = `${(0, utils_1.trimTrailingSlash)(this.urlService.getTestWebhookBaseUrl())}/${this.config.endpoints.formTest}/${path}`;
            const requireExecute = node.parameters.requireExecuteAccess === true;
            const audiences = [resourceUrl];
            return {
                id: 'workflow-form:' + workflowEntity.id,
                isFirstParty: true,
                surface: 'trigger',
                getResourceUrl: () => resourceUrl,
                getAudiences: () => audiences,
                getAllowedRedirectUris: async () => [resourceUrl],
                getAcceptedSourceIds: () => (0, utils_1.acceptedTrustedSourceIds)(node),
                scopes: utils_1.FORM_TRIGGER_SCOPES,
                displayName: workflowEntity.name,
                uiHints: utils_1.FORM_TRIGGER_CONSENT_HINTS,
                ...(0, resource_gate_1.triggerResourceGate)(this.workflowFinderService, {
                    audiences,
                    executeAccessWorkflowId: requireExecute ? workflowEntity.id : undefined,
                }),
            };
        }
        return undefined;
    }
};
exports.FormTriggerTestResourceResolver = FormTriggerTestResourceResolver;
exports.FormTriggerTestResourceResolver = FormTriggerTestResourceResolver = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, test_webhook_registrations_service_1.TestWebhookRegistrationsService, backend_services_1.UrlService, backend_common_1.Logger, workflow_finder_service_1.WorkflowFinderService])
], FormTriggerTestResourceResolver);
//# sourceMappingURL=form-trigger-test-resource.resolver.js.map