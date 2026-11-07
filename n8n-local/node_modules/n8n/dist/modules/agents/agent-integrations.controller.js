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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentIntegrationsController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const n8n_core_1 = require("n8n-core");
const agent_integration_management_service_1 = require("./agent-integration-management.service");
const agent_channel_status_reporter_1 = require("./integrations/agent-channel-status-reporter");
const agent_chat_integration_1 = require("./integrations/agent-chat-integration");
const channel_status_report_1 = require("./integrations/channel-status-report");
const chat_integration_service_1 = require("./integrations/chat-integration.service");
const integration_helpers_1 = require("./integrations/integration-helpers");
const channel_integration_recorder_1 = require("./integrations/recording/channel-integration-recorder");
const agent_channel_status_repository_1 = require("./repositories/agent-channel-status.repository");
const agent_repository_1 = require("./repositories/agent.repository");
const collaboration_service_1 = require("../../collaboration/collaboration.service");
const errors_1 = require("@n8n/errors");
let AgentIntegrationsController = class AgentIntegrationsController {
    constructor(integrationManagementService, chatIntegrationService, agentRepository, chatIntegrationRegistry, channelStatusRepository, statusReporter, instanceSettings, collaborationService) {
        this.integrationManagementService = integrationManagementService;
        this.chatIntegrationService = chatIntegrationService;
        this.agentRepository = agentRepository;
        this.chatIntegrationRegistry = chatIntegrationRegistry;
        this.channelStatusRepository = channelStatusRepository;
        this.statusReporter = statusReporter;
        this.instanceSettings = instanceSettings;
        this.collaborationService = collaborationService;
    }
    async connectIntegration(req, _res, agentId, payload) {
        await this.integrationManagementService.validateConfig(req.body);
        const agent = await this.agentRepository.findByIdAndProjectId(agentId, req.params.projectId);
        if (!agent)
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
        const clientId = req.headers?.['push-ref'];
        await this.collaborationService.validateAgentWriteLock(req.user.id, clientId, req.params.projectId, agentId, 'connect integration for');
        const { savedAgent } = await this.integrationManagementService.connect({
            agent,
            user: req.user,
            integration: req.body,
            ...(payload.replaces
                ? { replaces: { type: payload.type, credentialId: payload.replaces.credentialId } }
                : {}),
            pushRef: req.headers?.['push-ref'],
        });
        return { status: savedAgent.activeVersionId === null ? 'configured' : 'connected' };
    }
    async disconnectIntegration(req, _res, agentId, payload) {
        const { type, credentialId, deleteExternalResource } = payload;
        const agent = await this.agentRepository.findByIdAndProjectId(agentId, req.params.projectId);
        if (!agent)
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
        const clientId = req.headers?.['push-ref'];
        await this.collaborationService.validateAgentWriteLock(req.user.id, clientId, req.params.projectId, agentId, 'disconnect integration for');
        const { warning } = await this.integrationManagementService.disconnect({
            agent,
            user: req.user,
            type,
            credentialId,
            deleteExternalResource,
            pushRef: req.headers?.['push-ref'],
        });
        return { status: 'disconnected', ...(warning ? { warning } : {}) };
    }
    async integrationStatus(req, _res, agentId) {
        const agent = await this.agentRepository.findByIdAndProjectId(agentId, req.params.projectId);
        if (!agent)
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
        const statuses = await this.channelStatusRepository.findByAgentId(agentId);
        const now = new Date();
        return {
            ...(0, channel_status_report_1.buildChannelStatusReport)(agent.integrations, agent.activeVersionId, statuses, (row) => this.statusReporter.isLive(row, now), agent.activeVersion?.schema?.integrations ?? []),
            n8nChat: {
                draftEnabled: agent.integrations?.some((integration) => integration.type === 'n8n_chat') ?? false,
                publishedEnabled: agent.activeVersionId !== null &&
                    (agent.activeVersion?.schema?.integrations?.some((integration) => integration.type === 'n8n_chat') ??
                        false),
            },
        };
    }
    async whatsAppVerifyToken(req, _res, agentId) {
        const agent = await this.agentRepository.findByIdAndProjectId(agentId, req.params.projectId);
        if (!agent)
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
        return {
            verifyToken: (0, integration_helpers_1.deriveWhatsAppVerifyToken)(this.instanceSettings.hmacSignatureSecret, agentId),
        };
    }
    async handleWebhookVerification(req, res) {
        const { agentId, platform } = req.params;
        if (platform !== 'whatsapp') {
            res.status(404).json({ error: `No active ${platform} integration for agent "${agentId}"` });
            return;
        }
        return await this.handleWebhook(req, res);
    }
    async handleWebhook(req, res) {
        const { agentId, platform } = req.params;
        const integration = this.chatIntegrationRegistry.get(platform);
        const resolution = integration?.resolveWebhookRequest?.({
            headers: req.headers,
            body: req.body,
        });
        if (resolution?.type === 'reject') {
            res.status(resolution.response.status).json(resolution.response.body);
            return;
        }
        const webhookHandler = resolution?.type === 'no_match'
            ? undefined
            : this.chatIntegrationService.getWebhookHandler(agentId, platform, resolution?.type === 'select' ? resolution.connectionSelector : undefined);
        if (!webhookHandler) {
            const earlyResponse = integration?.handleUnauthenticatedWebhook?.({
                agentId,
                method: req.method,
                query: req.query,
                headers: req.headers,
                body: req.body,
            });
            if (earlyResponse) {
                res.status(earlyResponse.status);
                if (earlyResponse.raw) {
                    res.type('text/plain').send(String(earlyResponse.body));
                }
                else {
                    res.json(earlyResponse.body);
                }
                return;
            }
            res.status(404).json({ error: `No active ${platform} integration for agent "${agentId}"` });
            return;
        }
        const forwardedProto = req.headers['x-forwarded-proto'];
        const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) ?? req.protocol;
        const forwardedHost = req.headers['x-forwarded-host'];
        const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) ??
            req.headers.host ??
            'localhost';
        const url = `${protocol}://${host}${req.originalUrl}`;
        let requestBody;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            const rawBody = req.rawBody;
            if (rawBody) {
                requestBody = rawBody.toString('utf-8');
            }
            else if (req.headers['content-type']?.includes('application/json')) {
                requestBody = JSON.stringify(req.body);
            }
            else if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
                requestBody = new URLSearchParams(req.body).toString();
            }
            else {
                requestBody = JSON.stringify(req.body);
            }
        }
        const sanitizedHeaders = {};
        for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === 'string') {
                sanitizedHeaders[key] = value;
            }
            else if (Array.isArray(value)) {
                sanitizedHeaders[key] = value.join(', ');
            }
        }
        const webRequest = new globalThis.Request(url, {
            method: req.method,
            headers: sanitizedHeaders,
            body: requestBody,
        });
        await channel_integration_recorder_1.channelIntegrationRecorder.recordWebhook(platform, webRequest.clone());
        const backgroundTasks = [];
        const waitUntil = (task) => {
            backgroundTasks.push(task.catch((error) => {
                console.warn('[AgentIntegrationsController] Background task failed:', error instanceof Error ? error.message : String(error));
            }));
        };
        const webResponse = await webhookHandler(webRequest, { waitUntil });
        res.status(webResponse.status);
        webResponse.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });
        const body = await webResponse.text();
        res.send(body);
    }
};
exports.AgentIntegrationsController = AgentIntegrationsController;
__decorate([
    (0, decorators_1.Post)('/:agentId/integrations/connect'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.AgentConnectIntegrationDto]),
    __metadata("design:returntype", Promise)
], AgentIntegrationsController.prototype, "connectIntegration", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/integrations/disconnect'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.AgentDisconnectIntegrationDto]),
    __metadata("design:returntype", Promise)
], AgentIntegrationsController.prototype, "disconnectIntegration", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/integrations/status'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentIntegrationsController.prototype, "integrationStatus", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/integrations/whatsapp/verify-token'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentIntegrationsController.prototype, "whatsAppVerifyToken", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/webhooks/:platform', { skipAuth: true, allowBots: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AgentIntegrationsController.prototype, "handleWebhookVerification", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/webhooks/:platform', { skipAuth: true, allowBots: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AgentIntegrationsController.prototype, "handleWebhook", null);
exports.AgentIntegrationsController = AgentIntegrationsController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/agents/v2'),
    __metadata("design:paramtypes", [agent_integration_management_service_1.AgentIntegrationManagementService, chat_integration_service_1.ChatIntegrationService, agent_repository_1.AgentRepository, agent_chat_integration_1.ChatIntegrationRegistry, agent_channel_status_repository_1.AgentChannelStatusRepository, agent_channel_status_reporter_1.AgentChannelStatusReporter, n8n_core_1.InstanceSettings, collaboration_service_1.CollaborationService])
], AgentIntegrationsController);
//# sourceMappingURL=agent-integrations.controller.js.map