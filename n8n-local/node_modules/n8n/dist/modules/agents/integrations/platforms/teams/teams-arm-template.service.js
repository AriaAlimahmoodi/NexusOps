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
exports.TeamsArmTemplateService = void 0;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const node_crypto_1 = require("node:crypto");
const backend_services_1 = require("@n8n/backend-services");
const integration_helpers_1 = require("../../integration-helpers");
const TOKEN_TTL = '15m';
const BOT_API_VERSION = '2022-09-15';
const BOT_DISPLAY_NAME_MAX = 42;
const DEFAULT_BOT_DISPLAY_NAME = 'n8n Agent';
let TeamsArmTemplateService = class TeamsArmTemplateService {
    constructor(jwtService, urlService) {
        this.jwtService = jwtService;
        this.urlService = urlService;
    }
    buildTemplate(options) {
        if (!options.messagingEndpoint.startsWith('https://')) {
            throw new n8n_workflow_1.UserError("The Teams bot needs an HTTPS messaging endpoint. Set N8N_WEBHOOK_URL to this instance's public HTTPS URL.");
        }
        return {
            $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
            contentVersion: '1.0.0.0',
            parameters: {
                botName: {
                    type: 'string',
                    defaultValue: this.botNameFor(options.agentName, options.agentId),
                    metadata: { description: 'Name of the Azure Bot resource. Must be globally unique.' },
                },
                msaAppId: {
                    type: 'string',
                    ...(options.msaAppId ? { defaultValue: options.msaAppId } : {}),
                    metadata: {
                        description: 'Application (client) ID of your Microsoft Entra app registration. Copy it from the app registration overview page.',
                    },
                },
                msaAppTenantId: {
                    type: 'string',
                    ...(options.msaAppTenantId ? { defaultValue: options.msaAppTenantId } : {}),
                    metadata: {
                        description: 'Directory (tenant) ID of your Microsoft Entra app registration, on the same overview page.',
                    },
                },
                messagingEndpoint: {
                    type: 'string',
                    defaultValue: options.messagingEndpoint,
                    metadata: { description: 'Where Teams delivers messages. Filled in by n8n.' },
                },
                location: { type: 'string', defaultValue: 'global' },
                sku: { type: 'string', defaultValue: 'F0', allowedValues: ['F0', 'S1'] },
            },
            resources: [
                {
                    type: 'Microsoft.BotService/botServices',
                    apiVersion: BOT_API_VERSION,
                    name: "[parameters('botName')]",
                    location: "[parameters('location')]",
                    sku: { name: "[parameters('sku')]" },
                    kind: 'azurebot',
                    properties: {
                        displayName: (0, integration_helpers_1.sanitiseAppName)(options.displayName ?? options.agentName, BOT_DISPLAY_NAME_MAX, DEFAULT_BOT_DISPLAY_NAME),
                        endpoint: "[parameters('messagingEndpoint')]",
                        msaAppId: "[parameters('msaAppId')]",
                        msaAppType: 'SingleTenant',
                        msaAppTenantId: "[parameters('msaAppTenantId')]",
                    },
                },
                {
                    type: 'Microsoft.BotService/botServices/channels',
                    apiVersion: BOT_API_VERSION,
                    name: "[concat(parameters('botName'), '/MsTeamsChannel')]",
                    location: "[parameters('location')]",
                    dependsOn: ["[resourceId('Microsoft.BotService/botServices', parameters('botName'))]"],
                    properties: {
                        channelName: 'MsTeamsChannel',
                        properties: { isEnabled: true },
                    },
                },
            ],
            outputs: {
                botName: { type: 'string', value: "[parameters('botName')]" },
            },
        };
    }
    buildDeployUrl(projectId, agentId, credentialId) {
        return `https://portal.azure.com/#create/Microsoft.Template/uri/${encodeURIComponent(this.buildTemplateUrl(projectId, agentId, credentialId))}`;
    }
    buildTemplateUrl(projectId, agentId, credentialId) {
        const token = this.signToken(projectId, agentId, credentialId);
        const query = new URLSearchParams({ token, credentialId });
        return `${this.urlService.getWebhookBaseUrl()}rest/projects/${projectId}/agents/v2/${agentId}/integrations/teams/arm-template?${query.toString()}`;
    }
    verifyToken(projectId, agentId, credentialId, token) {
        try {
            const claims = this.jwtService.verify('teamsArmTemplate', token);
            return (claims.projectId === projectId &&
                claims.agentId === agentId &&
                claims.credentialId === credentialId);
        }
        catch {
            return false;
        }
    }
    signToken(projectId, agentId, credentialId) {
        return this.jwtService.sign('teamsArmTemplate', { projectId, agentId, credentialId }, { expiresIn: TOKEN_TTL });
    }
    botNameFor(agentName, agentId) {
        const suffix = (0, node_crypto_1.createHmac)('sha256', 'teams-bot-name').update(agentId).digest('hex').slice(0, 8);
        const slug = agentName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 40)
            .replace(/-+$/, '');
        return /^[a-z]/.test(slug) ? `${slug}-${suffix}` : `n8n-agent-${suffix}`;
    }
};
exports.TeamsArmTemplateService = TeamsArmTemplateService;
exports.TeamsArmTemplateService = TeamsArmTemplateService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.JwtService, backend_services_1.UrlService])
], TeamsArmTemplateService);
//# sourceMappingURL=teams-arm-template.service.js.map