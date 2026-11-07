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
exports.ChatTriggerResourceResolver = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
const webhook_service_1 = require("../../../webhooks/webhook.service");
const workflow_finder_service_1 = require("../../../workflows/workflow-finder.service");
const chat_trigger_resource_base_1 = require("./chat-trigger-resource.base");
let ChatTriggerResourceResolver = class ChatTriggerResourceResolver extends chat_trigger_resource_base_1.ChatTriggerResourceResolverBase {
    constructor(config, webhookService, workflowRepository, urlService, logger, workflowFinderService) {
        super();
        this.config = config;
        this.webhookService = webhookService;
        this.workflowRepository = workflowRepository;
        this.urlService = urlService;
        this.logger = logger;
        this.workflowFinderService = workflowFinderService;
        this.id = 'chat-trigger';
    }
    get endpoint() {
        return this.config.endpoints.webhook;
    }
    get baseUrl() {
        return this.urlService.getWebhookBaseUrl();
    }
    async findChatTrigger(path) {
        const webhook = await this.webhookService.findStaticWebhook('GET', path);
        if (!webhook || webhook.isDynamic) {
            return undefined;
        }
        const workflow = await this.workflowRepository.findOne({
            where: { id: webhook.workflowId },
            relations: { activeVersion: true },
        });
        if (!workflow?.activeVersion) {
            return undefined;
        }
        const node = workflow.activeVersion.nodes.find((n) => n.name === webhook.node);
        if (!node) {
            return undefined;
        }
        return { node, workflowId: workflow.id, workflowName: workflow.name };
    }
};
exports.ChatTriggerResourceResolver = ChatTriggerResourceResolver;
exports.ChatTriggerResourceResolver = ChatTriggerResourceResolver = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, webhook_service_1.WebhookService, db_1.WorkflowRepository, backend_services_1.UrlService, backend_common_1.Logger, workflow_finder_service_1.WorkflowFinderService])
], ChatTriggerResourceResolver);
//# sourceMappingURL=chat-trigger-resource.resolver.js.map