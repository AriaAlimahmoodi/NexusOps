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
exports.ChatTriggerTestResourceResolver = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
const test_webhook_registrations_service_1 = require("../../../webhooks/test-webhook-registrations.service");
const workflow_finder_service_1 = require("../../../workflows/workflow-finder.service");
const chat_trigger_resource_base_1 = require("./chat-trigger-resource.base");
let ChatTriggerTestResourceResolver = class ChatTriggerTestResourceResolver extends chat_trigger_resource_base_1.ChatTriggerResourceResolverBase {
    constructor(config, registrations, urlService, logger, workflowFinderService) {
        super();
        this.config = config;
        this.registrations = registrations;
        this.urlService = urlService;
        this.logger = logger;
        this.workflowFinderService = workflowFinderService;
        this.id = 'chat-trigger-test';
    }
    get endpoint() {
        return this.config.endpoints.webhookTest;
    }
    get baseUrl() {
        return this.urlService.getTestWebhookBaseUrl();
    }
    async findChatTrigger(path) {
        const registration = await this.registrations.get(this.registrations.toKey({ httpMethod: 'GET', path }));
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
        return { node, workflowId: workflowEntity.id, workflowName: workflowEntity.name };
    }
};
exports.ChatTriggerTestResourceResolver = ChatTriggerTestResourceResolver;
exports.ChatTriggerTestResourceResolver = ChatTriggerTestResourceResolver = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, test_webhook_registrations_service_1.TestWebhookRegistrationsService, backend_services_1.UrlService, backend_common_1.Logger, workflow_finder_service_1.WorkflowFinderService])
], ChatTriggerTestResourceResolver);
//# sourceMappingURL=chat-trigger-test-resource.resolver.js.map