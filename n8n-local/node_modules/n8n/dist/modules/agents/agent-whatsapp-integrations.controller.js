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
exports.AgentWhatsAppIntegrationsController = void 0;
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const whatsapp_credential_check_service_1 = require("./integrations/platforms/whatsapp/whatsapp-credential-check.service");
const whatsapp_webhook_verification_store_1 = require("./integrations/platforms/whatsapp/whatsapp-webhook-verification.store");
const agent_repository_1 = require("./repositories/agent.repository");
let AgentWhatsAppIntegrationsController = class AgentWhatsAppIntegrationsController {
    constructor(credentialCheckService, webhookVerification, agentRepository) {
        this.credentialCheckService = credentialCheckService;
        this.webhookVerification = webhookVerification;
        this.agentRepository = agentRepository;
    }
    async checkCredential(req, _res, credentialId) {
        return await this.credentialCheckService.check(req.user, req.params.projectId, credentialId);
    }
    async webhookStatus(req, _res, agentId) {
        await this.assertAgentExists(req.params.projectId, agentId);
        return { verified: await this.webhookVerification.isVerified(agentId) };
    }
    async resetWebhookStatus(req, _res, agentId) {
        await this.assertAgentExists(req.params.projectId, agentId);
        await this.webhookVerification.reset(agentId);
        return { verified: false };
    }
    async assertAgentExists(projectId, agentId) {
        const exists = await this.agentRepository.existsBy({ id: agentId, projectId });
        if (!exists)
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
    }
};
exports.AgentWhatsAppIntegrationsController = AgentWhatsAppIntegrationsController;
__decorate([
    (0, decorators_1.Post)('/:agentId/integrations/whatsapp/check/:credentialId'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('credentialId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentWhatsAppIntegrationsController.prototype, "checkCredential", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/integrations/whatsapp/webhook-status'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentWhatsAppIntegrationsController.prototype, "webhookStatus", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/integrations/whatsapp/webhook-status'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentWhatsAppIntegrationsController.prototype, "resetWebhookStatus", null);
exports.AgentWhatsAppIntegrationsController = AgentWhatsAppIntegrationsController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/agents/v2'),
    __metadata("design:paramtypes", [whatsapp_credential_check_service_1.WhatsAppCredentialCheckService, whatsapp_webhook_verification_store_1.WhatsAppWebhookVerificationStore, agent_repository_1.AgentRepository])
], AgentWhatsAppIntegrationsController);
//# sourceMappingURL=agent-whatsapp-integrations.controller.js.map