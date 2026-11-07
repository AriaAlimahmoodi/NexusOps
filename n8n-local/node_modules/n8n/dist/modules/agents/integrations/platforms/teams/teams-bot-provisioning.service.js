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
exports.TeamsBotProvisioningService = void 0;
exports.botResourceId = botResourceId;
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const teams_setup_telemetry_service_1 = require("./teams-setup-telemetry.service");
const backend_services_1 = require("@n8n/backend-services");
const errors_1 = require("@n8n/errors");
const teams_arm_service_1 = require("./teams-arm.service");
const teams_graph_service_1 = require("./teams-graph.service");
const teams_arm_template_service_1 = require("./teams-arm-template.service");
const teams_credential_notes_service_1 = require("./teams-credential-notes.service");
const teams_managed_setup_service_1 = require("./teams-managed-setup.service");
const teams_manager_token_service_1 = require("./teams-manager-token.service");
const integration_helpers_1 = require("../../integration-helpers");
const SUBSCRIPTIONS_API = '2022-12-01';
const RESOURCE_GROUP_API = '2021-04-01';
const PROVIDER_API = '2021-04-01';
const BOT_API = '2022-09-15';
const MAX_PAGES = 50;
const RESOURCE_GROUP = 'n8n-agents';
const RESOURCE_GROUP_LOCATION = 'westeurope';
function botResourceId(subscriptionId, botName) {
    return `/subscriptions/${subscriptionId}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.BotService/botServices/${botName}`;
}
function botAppIdOf(body) {
    if (!(0, is_record_1.isRecord)(body))
        return undefined;
    const properties = body.properties;
    return (0, is_record_1.isRecord)(properties) ? (0, integration_helpers_1.stringProperty)(properties, 'msaAppId') : undefined;
}
let TeamsBotProvisioningService = class TeamsBotProvisioningService {
    constructor(arm, tokens, armTemplateService, credentialsFinderService, notes) {
        this.arm = arm;
        this.tokens = tokens;
        this.armTemplateService = armTemplateService;
        this.credentialsFinderService = credentialsFinderService;
        this.notes = notes;
    }
    async listSubscriptions(options) {
        const token = await this.azureToken(options);
        const response = await this.arm.request(token, 'GET', `/subscriptions?api-version=${SUBSCRIPTIONS_API}`);
        if (!response.ok) {
            throw this.subscriptionsError(response.statusCode, (0, teams_graph_service_1.graphErrorCode)(response.body));
        }
        const subscriptions = [];
        let page = response;
        for (let read = 0; page && read < MAX_PAGES; read++) {
            const value = (0, is_record_1.isRecord)(page.body) ? page.body.value : undefined;
            if (Array.isArray(value)) {
                for (const entry of value) {
                    const id = (0, integration_helpers_1.stringProperty)(entry, 'subscriptionId');
                    if (!id || (0, integration_helpers_1.stringProperty)(entry, 'state') !== 'Enabled')
                        continue;
                    subscriptions.push({ id, name: (0, integration_helpers_1.stringProperty)(entry, 'displayName') ?? id });
                }
            }
            const next = (0, is_record_1.isRecord)(page.body)
                ? (0, integration_helpers_1.stringProperty)(page.body, 'nextLink')
                : undefined;
            const nextPath = next ? (0, teams_arm_service_1.armNextLinkPath)(next) : undefined;
            page = nextPath ? await this.arm.request(token, 'GET', nextPath) : undefined;
            if (page && !page.ok) {
                throw this.subscriptionsError(page.statusCode, (0, teams_graph_service_1.graphErrorCode)(page.body));
            }
        }
        return subscriptions;
    }
    async provisionBot(options) {
        if (!options.messagingEndpoint.startsWith('https://')) {
            throw (0, teams_setup_telemetry_service_1.withTeamsFailure)(new n8n_workflow_1.UserError("The Teams bot needs an HTTPS messaging endpoint. Set N8N_WEBHOOK_URL to this instance's public HTTPS URL."), 'endpoint_not_https');
        }
        const token = await this.azureToken(options);
        await this.registerProvider(token, options.subscriptionId);
        await this.ensureResourceGroup(token, options.subscriptionId);
        const botName = (await this.findBotByAppId(token, options.subscriptionId, options.msaAppId)) ??
            this.armTemplateService.botNameFor(options.agentName, options.agentId);
        const scope = botResourceId(options.subscriptionId, botName);
        const existing = await this.arm.request(token, 'GET', `${scope}?api-version=${BOT_API}`);
        if (existing.ok) {
            const boundAppId = botAppIdOf(existing.body);
            if (boundAppId && boundAppId.toLowerCase() !== options.msaAppId.toLowerCase()) {
                throw new n8n_workflow_1.UserError(`An Azure bot named ${botName} already exists and is tied to a different app registration. Azure fixes that at creation, so delete the bot or rename the agent, then try again.`);
            }
        }
        const bot = await this.arm.request(token, 'PUT', `${scope}?api-version=${BOT_API}`, {
            location: 'global',
            kind: 'azurebot',
            sku: { name: 'F0' },
            properties: {
                displayName: botName,
                endpoint: options.messagingEndpoint,
                msaAppId: options.msaAppId,
                msaAppType: 'SingleTenant',
                msaAppTenantId: options.msaAppTenantId,
            },
        });
        if (!bot.ok)
            throw this.botError(bot.statusCode, (0, teams_graph_service_1.graphErrorCode)(bot.body));
        const channel = await this.arm.request(token, 'PUT', `${scope}/channels/MsTeamsChannel?api-version=${BOT_API}`, {
            location: 'global',
            properties: { channelName: 'MsTeamsChannel', properties: { isEnabled: true } },
        });
        if (!channel.ok) {
            throw (0, teams_setup_telemetry_service_1.withTeamsFailure)(new n8n_workflow_1.OperationalError('The bot was created but its Microsoft Teams channel could not be turned on.'), 'teams_channel_failed');
        }
        await this.notes.write(options.user, options.credentialId, {
            azureBotName: botName,
            azureSubscriptionId: options.subscriptionId,
        });
        return { botName, resourceGroup: RESOURCE_GROUP, subscriptionId: options.subscriptionId };
    }
    async findBotByAppId(token, subscriptionId, msaAppId) {
        let page = await this.arm.request(token, 'GET', `/subscriptions/${subscriptionId}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.BotService/botServices?api-version=${BOT_API}`);
        if (page.statusCode === 404)
            return undefined;
        if (!page.ok) {
            throw this.botError(page.statusCode, (0, teams_graph_service_1.graphErrorCode)(page.body));
        }
        for (let read = 0; read < MAX_PAGES; read++) {
            const value = (0, is_record_1.isRecord)(page.body) ? page.body.value : undefined;
            if (Array.isArray(value)) {
                const match = value.find((bot) => botAppIdOf(bot)?.toLowerCase() === msaAppId.toLowerCase());
                if (match)
                    return (0, integration_helpers_1.stringProperty)(match, 'name');
            }
            const next = (0, is_record_1.isRecord)(page.body)
                ? (0, integration_helpers_1.stringProperty)(page.body, 'nextLink')
                : undefined;
            const nextPath = next ? (0, teams_arm_service_1.armNextLinkPath)(next) : undefined;
            if (!nextPath)
                return undefined;
            page = await this.arm.request(token, 'GET', nextPath);
            if (!page.ok) {
                throw this.botError(page.statusCode, (0, teams_graph_service_1.graphErrorCode)(page.body));
            }
        }
        return undefined;
    }
    async registerProvider(token, subscriptionId) {
        await this.arm.request(token, 'POST', `/subscriptions/${subscriptionId}/providers/Microsoft.BotService/register?api-version=${PROVIDER_API}`);
    }
    async ensureResourceGroup(token, subscriptionId) {
        const path = `/subscriptions/${subscriptionId}/resourcegroups/${RESOURCE_GROUP}?api-version=${RESOURCE_GROUP_API}`;
        const existing = await this.arm.request(token, 'GET', path);
        if (existing.ok)
            return;
        const code = (0, teams_graph_service_1.graphErrorCode)(existing.body);
        if (existing.statusCode === 403 || code === 'AuthorizationFailed') {
            throw this.botError(existing.statusCode, code);
        }
        const response = await this.arm.request(token, 'PUT', path, {
            location: RESOURCE_GROUP_LOCATION,
        });
        if (!response.ok) {
            throw this.botError(response.statusCode, (0, teams_graph_service_1.graphErrorCode)(response.body));
        }
    }
    subscriptionsError(statusCode, code) {
        if (statusCode === 403 || code === 'AuthorizationFailed') {
            return (0, teams_setup_telemetry_service_1.withTeamsFailure)(new n8n_workflow_1.UserError('This account cannot read the Azure subscriptions in this tenant.'), 'no_contributor_role');
        }
        return new n8n_workflow_1.OperationalError('Azure did not answer with the subscriptions. Try again.');
    }
    botError(statusCode, code) {
        if (statusCode === 403 || code === 'AuthorizationFailed') {
            return (0, teams_setup_telemetry_service_1.withTeamsFailure)(new n8n_workflow_1.UserError('This account cannot create resources in that Azure subscription. It needs the Contributor role.'), 'no_contributor_role');
        }
        if (code === 'MissingSubscriptionRegistration') {
            return (0, teams_setup_telemetry_service_1.withTeamsFailure)(new n8n_workflow_1.OperationalError('Azure is still enabling Bot Service on this subscription. Try again in a minute.'), 'provider_registering');
        }
        return new n8n_workflow_1.OperationalError('Azure refused to create the bot. Try again.');
    }
    async azureToken(options) {
        const credential = await this.managerCredential(options);
        return await this.tokens.acquire(credential, teams_manager_token_service_1.AZURE_RESOURCE);
    }
    async managerCredential(options) {
        const credential = await this.credentialsFinderService.findCredentialForUser(options.managerCredentialId, options.user, ['credential:use']);
        if (!credential || credential.type !== teams_managed_setup_service_1.TEAMS_MANAGER_CREDENTIAL_TYPE) {
            throw (0, teams_setup_telemetry_service_1.withTeamsFailure)(new errors_1.BadRequestError('Sign in with Microsoft before creating the bot.'), 'not_signed_in');
        }
        return credential;
    }
};
exports.TeamsBotProvisioningService = TeamsBotProvisioningService;
exports.TeamsBotProvisioningService = TeamsBotProvisioningService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [teams_arm_service_1.TeamsArmService, teams_manager_token_service_1.TeamsManagerTokenService, teams_arm_template_service_1.TeamsArmTemplateService, backend_services_1.CredentialsFinderService, teams_credential_notes_service_1.TeamsCredentialNotesService])
], TeamsBotProvisioningService);
//# sourceMappingURL=teams-bot-provisioning.service.js.map