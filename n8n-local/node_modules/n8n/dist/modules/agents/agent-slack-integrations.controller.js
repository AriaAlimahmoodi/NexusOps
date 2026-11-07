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
exports.AgentSlackIntegrationsController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const slack_managed_setup_service_1 = require("./integrations/platforms/slack/slack-managed-setup.service");
const slack_manual_setup_service_1 = require("./integrations/platforms/slack/slack-manual-setup.service");
let AgentSlackIntegrationsController = class AgentSlackIntegrationsController {
    constructor(manualSetup, managedSetup) {
        this.manualSetup = manualSetup;
        this.managedSetup = managedSetup;
    }
    async createSlackApp(req, _res, agentId, payload) {
        return await this.manualSetup.createApp({
            projectId: req.params.projectId,
            agentId,
            appConfigurationToken: payload.appConfigurationToken,
            user: req.user,
        });
    }
    async getSlackAppManifest(req, _res, agentId) {
        return await this.manualSetup.getManifest({ projectId: req.params.projectId, agentId });
    }
    async getManagedSlackSetup(req, _res, agentId) {
        return await this.managedSetup.getSetupState({
            projectId: req.params.projectId,
            agentId,
            user: req.user,
        });
    }
    async createManagedSlackCredential(req, _res, agentId) {
        return await this.managedSetup.createManagerCredential({
            projectId: req.params.projectId,
            agentId,
            user: req.user,
        });
    }
    async finalizeManagedSlackCredential(req, _res, agentId, credentialId) {
        await this.managedSetup.finalizeManagerCredential({
            projectId: req.params.projectId,
            agentId,
            credentialId,
            user: req.user,
        });
    }
    async installManagedSlackApp(req, _res, agentId, payload) {
        return await this.managedSetup.installApp({
            projectId: req.params.projectId,
            agentId,
            user: req.user,
            managerCredentialId: payload.managerCredentialId,
            workspaceId: payload.workspaceId,
        });
    }
    async getManagedSlackAppSettings(req, _res, agentId, credentialId) {
        return await this.managedSetup.getAppSettings({
            projectId: req.params.projectId,
            agentId,
            credentialId,
            user: req.user,
        });
    }
    async updateManagedSlackAppSettings(req, _res, agentId, payload) {
        return await this.managedSetup.updateAppSettings({
            projectId: req.params.projectId,
            agentId,
            user: req.user,
            credentialId: payload.credentialId,
            name: payload.name,
            description: payload.description,
            alwaysOnline: payload.alwaysOnline,
        });
    }
    async handleSlackAppOAuthCallback(req, res, agentId) {
        const { code, state, error, error_description: errorDescription } = req.query;
        if (error) {
            return res.render('oauth-error-callback', {
                error: { message: error, ...(errorDescription ? { reason: errorDescription } : {}) },
            });
        }
        if (!code || !state) {
            return res.render('oauth-error-callback', {
                error: { message: 'Insufficient parameters for Slack app setup callback.' },
            });
        }
        try {
            await this.manualSetup.completeInstall({
                projectId: req.params.projectId,
                agentId,
                code,
                state,
            });
            return res.render('oauth-callback');
        }
        catch (callbackError) {
            return res.render('oauth-error-callback', {
                error: {
                    message: callbackError instanceof Error ? callbackError.message : 'Slack app setup failed',
                },
            });
        }
    }
};
exports.AgentSlackIntegrationsController = AgentSlackIntegrationsController;
__decorate([
    (0, decorators_1.Post)('/:agentId/integrations/slack/app'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.CreateSlackAgentAppDto]),
    __metadata("design:returntype", Promise)
], AgentSlackIntegrationsController.prototype, "createSlackApp", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/integrations/slack/manifest'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentSlackIntegrationsController.prototype, "getSlackAppManifest", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/integrations/slack/managed/setup'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentSlackIntegrationsController.prototype, "getManagedSlackSetup", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/integrations/slack/managed/credentials'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentSlackIntegrationsController.prototype, "createManagedSlackCredential", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/integrations/slack/managed/credentials/:credentialId/finalize'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, (0, decorators_1.Param)('credentialId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentSlackIntegrationsController.prototype, "finalizeManagedSlackCredential", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/integrations/slack/managed/install'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.InstallSlackManagedAppDto]),
    __metadata("design:returntype", Promise)
], AgentSlackIntegrationsController.prototype, "installManagedSlackApp", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/integrations/slack/managed/settings/:credentialId'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, (0, decorators_1.Param)('credentialId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentSlackIntegrationsController.prototype, "getManagedSlackAppSettings", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/integrations/slack/managed/settings'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateSlackManagedAppSettingsDto]),
    __metadata("design:returntype", Promise)
], AgentSlackIntegrationsController.prototype, "updateManagedSlackAppSettings", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/integrations/slack/oauth/callback', { skipAuth: true, usesTemplates: true }),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentSlackIntegrationsController.prototype, "handleSlackAppOAuthCallback", null);
exports.AgentSlackIntegrationsController = AgentSlackIntegrationsController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/agents/v2'),
    __metadata("design:paramtypes", [slack_manual_setup_service_1.SlackManualSetupService, slack_managed_setup_service_1.SlackManagedSetupService])
], AgentSlackIntegrationsController);
//# sourceMappingURL=agent-slack-integrations.controller.js.map