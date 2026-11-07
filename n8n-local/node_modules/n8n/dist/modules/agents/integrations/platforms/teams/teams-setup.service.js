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
exports.TeamsSetupService = void 0;
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const backend_services_1 = require("@n8n/backend-services");
const teams_admin_consent_1 = require("./teams-admin-consent");
const teams_app_icons_1 = require("./teams-app-icons");
const teams_arm_template_service_1 = require("./teams-arm-template.service");
const teams_bot_provisioning_service_1 = require("./teams-bot-provisioning.service");
const teams_manifest_service_1 = require("./teams-manifest.service");
const agent_repository_1 = require("../../../repositories/agent.repository");
const agent_credential_lookup_service_1 = require("../../agent-credential-lookup.service");
const integration_helpers_1 = require("../../integration-helpers");
const TEAMS_CREDENTIAL_TYPE = 'microsoftEntraServicePrincipalApi';
const GUID = /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/;
let TeamsSetupService = class TeamsSetupService {
    constructor(agentRepository, credentialLookup, manifestService, armTemplateService, urlService) {
        this.agentRepository = agentRepository;
        this.credentialLookup = credentialLookup;
        this.manifestService = manifestService;
        this.armTemplateService = armTemplateService;
        this.urlService = urlService;
    }
    async getSetupState(user, scope, selectedCredentialId) {
        const agent = await this.getAgent(scope);
        const credentialId = selectedCredentialId ?? this.connectedCredentialId(agent);
        const [identity, claimedBy] = await Promise.all([
            credentialId ? this.readIdentity(agent.projectId, credentialId, user) : null,
            credentialId ? this.credentialClaimedBy(agent.id, credentialId) : null,
        ]);
        const provisionedByN8n = identity?.provisionedForAgentId === agent.id;
        return {
            messagingEndpointUrl: this.messagingEndpointUrl(scope),
            botId: identity?.clientId ?? null,
            deployToAzureUrl: credentialId && identity && !claimedBy
                ? this.armTemplateService.buildDeployUrl(scope.projectId, scope.agentId, credentialId)
                : null,
            credentialClaimedBy: claimedBy,
            provisionedByN8n,
            fileAccessConsentUrl: provisionedByN8n ? this.fileAccessConsentUrl(scope, identity) : null,
            azureBot: provisionedByN8n ? this.azureBot(identity) : null,
            appOutdated: this.appOutdated(agent, identity),
            ...this.defaultIdentity(agent.name),
        };
    }
    async buildPackage(user, scope, selectedCredentialId, selectedSettings) {
        const agent = await this.getAgent(scope);
        const credentialId = selectedCredentialId ?? this.connectedCredentialId(agent);
        const identity = credentialId
            ? await this.readIdentity(agent.projectId, credentialId, user)
            : null;
        if (!credentialId || !identity) {
            throw new errors_1.BadRequestError('Add the credential before downloading the app package.');
        }
        if (!GUID.test(identity.clientId)) {
            throw new errors_1.BadRequestError("This credential's Application (client) ID is not a GUID, which Teams requires.");
        }
        const claimedBy = await this.credentialClaimedBy(agent.id, credentialId);
        if (claimedBy) {
            throw new errors_1.BadRequestError(`This credential already backs the Teams channel of "${claimedBy}". Pick a different one.`);
        }
        const options = {
            agentName: agent.name,
            agentId: agent.id,
            botId: identity.clientId,
            versionAt: selectedSettings
                ? new Date(Math.max(Date.now(), agent.updatedAt.getTime()))
                : agent.updatedAt,
            settings: selectedSettings ?? this.teamsSettingsOf(agent),
        };
        return {
            archive: await this.manifestService.buildPackage({
                ...options,
                icons: await (0, teams_app_icons_1.renderTeamsAppIcons)(agent.schema?.personalisation),
            }),
            fingerprint: this.manifestService.fingerprint(this.manifestService.buildManifest(options), agent.schema?.personalisation),
            credentialId,
        };
    }
    async buildArmTemplate(scope) {
        if (!this.armTemplateService.verifyToken(scope.projectId, scope.agentId, scope.credentialId, scope.token)) {
            throw new errors_1.NotFoundError('This deployment link has expired. Open the setup steps again.');
        }
        const agent = await this.getAgent(scope);
        const identity = await this.readIdentity(agent.projectId, scope.credentialId);
        if (!identity) {
            throw new errors_1.BadRequestError('This credential is missing its tenant or client ID.');
        }
        return this.armTemplateService.buildTemplate({
            agentName: agent.name,
            agentId: agent.id,
            displayName: this.teamsSettingsOf(agent)?.displayName,
            msaAppId: identity.clientId,
            msaAppTenantId: identity.tenantId,
            messagingEndpoint: this.messagingEndpointUrl(scope),
        });
    }
    async credentialClaimedBy(agentId, credentialId) {
        const others = await this.agentRepository.findByIntegrationCredentialAnyProject('teams', credentialId, agentId);
        return others[0]?.name ?? null;
    }
    teamsSettingsOf(agent) {
        return agent.integrations?.find((item) => item.type === 'teams')?.settings;
    }
    defaultIdentity(agentName) {
        const { displayName, description } = this.manifestService.defaultIdentity(agentName);
        return { defaultDisplayName: displayName, defaultDescription: description };
    }
    async agentNameFor(projectId, agentId) {
        const agent = await this.getAgent({ projectId, agentId });
        return agent.name;
    }
    async botIdentityFor(user, scope, credentialId) {
        const agent = await this.getAgent(scope);
        const identity = await this.readIdentity(agent.projectId, credentialId, user);
        if (!identity) {
            throw new errors_1.BadRequestError('Create the Teams app before deploying the bot.');
        }
        const claimedBy = await this.credentialClaimedBy(agent.id, credentialId);
        if (claimedBy) {
            throw new errors_1.BadRequestError(`This credential already backs the Teams channel of "${claimedBy}". Pick a different one.`);
        }
        return {
            ...identity,
            messagingEndpoint: this.messagingEndpointUrl(scope),
            agentName: agent.name,
        };
    }
    async getAgent(scope) {
        const agent = await this.agentRepository.findByIdAndProjectId(scope.agentId, scope.projectId);
        if (!agent)
            throw new errors_1.NotFoundError(`Agent "${scope.agentId}" not found`);
        return agent;
    }
    connectedCredentialId(agent) {
        return agent.integrations?.find((item) => item.type === 'teams')?.credentialId;
    }
    async readIdentity(projectId, credentialId, user) {
        const data = user
            ? await this.credentialLookup.decryptForUser(user, projectId, credentialId, TEAMS_CREDENTIAL_TYPE)
            : await this.credentialLookup.decryptForProject(projectId, credentialId, TEAMS_CREDENTIAL_TYPE);
        const clientId = (0, integration_helpers_1.stringProperty)(data, 'clientId');
        const tenantId = (0, integration_helpers_1.stringProperty)(data, 'tenantId');
        const provisionedForAgentId = (0, integration_helpers_1.stringProperty)(data, 'provisionedForAgentId');
        return clientId && tenantId
            ? {
                clientId,
                tenantId,
                provisionedForAgentId,
                azureBotName: (0, integration_helpers_1.stringProperty)(data, 'azureBotName'),
                azureSubscriptionId: (0, integration_helpers_1.stringProperty)(data, 'azureSubscriptionId'),
                teamsAppFingerprint: (0, integration_helpers_1.stringProperty)(data, 'teamsAppFingerprint'),
            }
            : null;
    }
    appOutdated(agent, identity) {
        if (!identity?.teamsAppFingerprint)
            return false;
        const current = this.manifestService.buildManifest({
            agentName: agent.name,
            agentId: agent.id,
            botId: identity.clientId,
            versionAt: agent.updatedAt,
            settings: this.teamsSettingsOf(agent),
        });
        return (this.manifestService.fingerprint(current, agent.schema?.personalisation) !==
            identity.teamsAppFingerprint);
    }
    azureBot(identity) {
        if (!identity?.azureBotName || !identity.azureSubscriptionId)
            return null;
        const resource = (0, teams_bot_provisioning_service_1.botResourceId)(identity.azureSubscriptionId, identity.azureBotName);
        return {
            name: identity.azureBotName,
            portalUrl: `https://portal.azure.com/#@${identity.tenantId}/resource${resource}/overview`,
        };
    }
    fileAccessConsentUrl(scope, identity) {
        const redirectUri = (0, teams_admin_consent_1.adminConsentRedirectUri)(this.urlService.getInstanceBaseUrl(), scope);
        return identity && redirectUri
            ? (0, teams_admin_consent_1.adminConsentUrl)(identity.tenantId, identity.clientId, redirectUri)
            : null;
    }
    messagingEndpointUrl(scope) {
        return `${this.urlService.getWebhookBaseUrl()}rest/projects/${scope.projectId}/agents/v2/${scope.agentId}/webhooks/teams`;
    }
};
exports.TeamsSetupService = TeamsSetupService;
exports.TeamsSetupService = TeamsSetupService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_repository_1.AgentRepository, agent_credential_lookup_service_1.AgentCredentialLookupService, teams_manifest_service_1.TeamsManifestService, teams_arm_template_service_1.TeamsArmTemplateService, backend_services_1.UrlService])
], TeamsSetupService);
//# sourceMappingURL=teams-setup.service.js.map