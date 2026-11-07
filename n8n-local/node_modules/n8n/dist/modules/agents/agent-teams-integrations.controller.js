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
exports.AgentTeamsIntegrationsController = void 0;
const api_types_1 = require("@n8n/api-types");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const teams_credential_check_service_1 = require("./integrations/platforms/teams/teams-credential-check.service");
const teams_bot_provisioning_service_1 = require("./integrations/platforms/teams/teams-bot-provisioning.service");
const teams_catalog_service_1 = require("./integrations/platforms/teams/teams-catalog.service");
const teams_credential_notes_service_1 = require("./integrations/platforms/teams/teams-credential-notes.service");
const teams_entra_provisioning_service_1 = require("./integrations/platforms/teams/teams-entra-provisioning.service");
const teams_setup_telemetry_service_1 = require("./integrations/platforms/teams/teams-setup-telemetry.service");
const teams_managed_setup_service_1 = require("./integrations/platforms/teams/teams-managed-setup.service");
const teams_setup_service_1 = require("./integrations/platforms/teams/teams-setup.service");
const TEMPLATE_CORS = {
    allowedOrigins: ['*'],
    allowedMethods: ['get', 'options'],
    allowedHeaders: ['Content-Type'],
};
let AgentTeamsIntegrationsController = class AgentTeamsIntegrationsController {
    constructor(setupService, credentialCheckService, managedSetupService, entraProvisioningService, botProvisioningService, catalogService, setupTelemetry, credentialNotes) {
        this.setupService = setupService;
        this.credentialCheckService = credentialCheckService;
        this.managedSetupService = managedSetupService;
        this.entraProvisioningService = entraProvisioningService;
        this.botProvisioningService = botProvisioningService;
        this.catalogService = catalogService;
        this.setupTelemetry = setupTelemetry;
        this.credentialNotes = credentialNotes;
    }
    async publishApp(req, _res, agentId, payload) {
        const report = {
            agentId,
            projectId: req.params.projectId,
            userId: req.user.id,
            step: 'install',
        };
        try {
            const state = await this.catalogService.publish({
                user: req.user,
                projectId: req.params.projectId,
                agentId,
                managerCredentialId: payload.managerCredentialId,
                credentialId: payload.credentialId,
                settings: payload.settings,
            });
            this.setupTelemetry.succeeded({
                ...report,
                ...(state.status === 'published' || state.status === 'submitted'
                    ? { installRoute: state.status }
                    : {}),
            });
            return state;
        }
        catch (error) {
            this.setupTelemetry.failed(report, error);
            throw error;
        }
    }
    async getCatalogState(req, _res, agentId) {
        const managerCredentialId = req.query.managerCredentialId;
        if (typeof managerCredentialId !== 'string' || managerCredentialId.length === 0) {
            return { status: 'unknown', teamsAppId: null };
        }
        const credentialId = req.query.credentialId;
        return await this.catalogService.getState({
            user: req.user,
            projectId: req.params.projectId,
            agentId,
            managerCredentialId,
            ...(typeof credentialId === 'string' && credentialId.length > 0 ? { credentialId } : {}),
        });
    }
    async listAzureSubscriptions(req, _res, _agentId) {
        const managerCredentialId = req.query.managerCredentialId;
        if (typeof managerCredentialId !== 'string' || managerCredentialId.length === 0) {
            throw new errors_1.BadRequestError('Sign in with Microsoft before looking for a subscription.');
        }
        return await this.botProvisioningService.listSubscriptions({
            user: req.user,
            managerCredentialId,
        });
    }
    reportManualBotRoute(req, _res, agentId) {
        this.setupTelemetry.succeeded({
            agentId,
            projectId: req.params.projectId,
            userId: req.user.id,
            step: 'create_bot',
            botRoute: 'manual',
        });
    }
    async provisionBot(req, _res, agentId, payload) {
        const projectId = req.params.projectId;
        const report = {
            agentId,
            projectId,
            userId: req.user.id,
            step: 'create_bot',
            botRoute: 'provisioned',
        };
        try {
            const identity = await this.setupService.botIdentityFor(req.user, { projectId, agentId }, payload.credentialId);
            const summary = await this.botProvisioningService.provisionBot({
                user: req.user,
                projectId,
                agentId,
                agentName: identity.agentName,
                credentialId: payload.credentialId,
                managerCredentialId: payload.managerCredentialId,
                subscriptionId: payload.subscriptionId,
                msaAppId: identity.clientId,
                msaAppTenantId: identity.tenantId,
                messagingEndpoint: identity.messagingEndpoint,
            });
            this.setupTelemetry.succeeded(report);
            return summary;
        }
        catch (error) {
            this.setupTelemetry.failed(report, error);
            throw error;
        }
    }
    async provisionApp(req, _res, agentId, payload) {
        const report = {
            agentId,
            projectId: req.params.projectId,
            userId: req.user.id,
            step: 'create_app',
        };
        try {
            const summary = await this.entraProvisioningService.provision({
                user: req.user,
                projectId: req.params.projectId,
                agentId,
                agentName: await this.setupService.agentNameFor(req.params.projectId, agentId),
                managerCredentialId: payload.managerCredentialId,
            });
            this.setupTelemetry.succeeded(report);
            return summary;
        }
        catch (error) {
            this.setupTelemetry.failed(report, error);
            throw error;
        }
    }
    async getManagedSetupState(req, _res, agentId) {
        return await this.managedSetupService.getSetupState({
            projectId: req.params.projectId,
            agentId,
            user: req.user,
        });
    }
    async createManagerCredential(req, _res, agentId) {
        return await this.managedSetupService.createManagerCredential({
            projectId: req.params.projectId,
            agentId,
            user: req.user,
        });
    }
    async checkCredential(req, _res, credentialId) {
        return await this.credentialCheckService.check(req.user, req.params.projectId, credentialId);
    }
    async checkFileAccess(req, _res, credentialId) {
        return await this.credentialCheckService.checkFileAccess(req.user, req.params.projectId, credentialId);
    }
    async getSetupState(req, _res, agentId) {
        const credentialId = req.query.credentialId;
        return await this.setupService.getSetupState(req.user, { projectId: req.params.projectId, agentId }, typeof credentialId === 'string' ? credentialId : undefined);
    }
    async downloadPackage(req, res, agentId, payload) {
        const { archive, fingerprint, credentialId } = await this.setupService.buildPackage(req.user, { projectId: req.params.projectId, agentId }, payload.credentialId, payload.settings);
        await this.credentialNotes.write(req.user, credentialId, { teamsAppFingerprint: fingerprint });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="n8n-agent-teams-app.zip"');
        res.send(archive);
    }
    armTemplatePreflight(_req, res) {
        res.status(204).send();
    }
    async getArmTemplate(req, res, agentId) {
        const { token, credentialId } = req.query;
        const template = await this.setupService.buildArmTemplate({
            projectId: req.params.projectId,
            agentId,
            token: typeof token === 'string' ? token : '',
            credentialId: typeof credentialId === 'string' ? credentialId : '',
        });
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(template));
    }
};
exports.AgentTeamsIntegrationsController = AgentTeamsIntegrationsController;
__decorate([
    (0, decorators_1.Post)('/:agentId/integrations/teams/publish'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.AgentTeamsPublishDto]),
    __metadata("design:returntype", Promise)
], AgentTeamsIntegrationsController.prototype, "publishApp", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/integrations/teams/catalog'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentTeamsIntegrationsController.prototype, "getCatalogState", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/integrations/teams/azure-subscriptions'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentTeamsIntegrationsController.prototype, "listAzureSubscriptions", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/integrations/teams/manual-bot-route'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], AgentTeamsIntegrationsController.prototype, "reportManualBotRoute", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/integrations/teams/provision-bot'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.AgentTeamsProvisionBotDto]),
    __metadata("design:returntype", Promise)
], AgentTeamsIntegrationsController.prototype, "provisionBot", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/integrations/teams/provision-app'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.AgentTeamsProvisionAppDto]),
    __metadata("design:returntype", Promise)
], AgentTeamsIntegrationsController.prototype, "provisionApp", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/integrations/teams/managed-setup'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentTeamsIntegrationsController.prototype, "getManagedSetupState", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/integrations/teams/manager-credential'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentTeamsIntegrationsController.prototype, "createManagerCredential", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/integrations/teams/check/:credentialId'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('credentialId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentTeamsIntegrationsController.prototype, "checkCredential", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/integrations/teams/file-access/:credentialId'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('credentialId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentTeamsIntegrationsController.prototype, "checkFileAccess", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/integrations/teams/setup'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentTeamsIntegrationsController.prototype, "getSetupState", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/integrations/teams/package'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.AgentTeamsPackageDto]),
    __metadata("design:returntype", Promise)
], AgentTeamsIntegrationsController.prototype, "downloadPackage", null);
__decorate([
    (0, decorators_1.Options)('/:agentId/integrations/teams/arm-template', { skipAuth: true, cors: TEMPLATE_CORS }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AgentTeamsIntegrationsController.prototype, "armTemplatePreflight", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/integrations/teams/arm-template', {
        skipAuth: true,
        cors: TEMPLATE_CORS,
        ipRateLimit: { limit: 60, windowMs: constants_1.Time.minutes.toMilliseconds },
    }),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentTeamsIntegrationsController.prototype, "getArmTemplate", null);
exports.AgentTeamsIntegrationsController = AgentTeamsIntegrationsController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/agents/v2'),
    __metadata("design:paramtypes", [teams_setup_service_1.TeamsSetupService, teams_credential_check_service_1.TeamsCredentialCheckService, teams_managed_setup_service_1.TeamsManagedSetupService, teams_entra_provisioning_service_1.TeamsEntraProvisioningService, teams_bot_provisioning_service_1.TeamsBotProvisioningService, teams_catalog_service_1.TeamsCatalogService, teams_setup_telemetry_service_1.TeamsSetupTelemetryService, teams_credential_notes_service_1.TeamsCredentialNotesService])
], AgentTeamsIntegrationsController);
//# sourceMappingURL=agent-teams-integrations.controller.js.map