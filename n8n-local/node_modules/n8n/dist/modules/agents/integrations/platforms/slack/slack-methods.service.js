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
exports.SlackMethodsService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const credentials_service_1 = require("../../../../../credentials/credentials.service");
const errors_1 = require("@n8n/errors");
const backend_services_1 = require("@n8n/backend-services");
const get_agent_or_throw_1 = require("../../../utils/get-agent-or-throw");
const slack_setup_types_1 = require("./slack-setup.types");
const agent_integration_management_service_1 = require("../../../agent-integration-management.service");
const agent_repository_1 = require("../../../repositories/agent.repository");
const integration_helpers_1 = require("../../integration-helpers");
const DEFAULT_SLACK_APP_NAME = 'n8n Agent';
const REQUIRED_BOT_EVENTS = [
    'app_mention',
    'app_context_changed',
    'app_home_opened',
    'message.channels',
    'message.groups',
    'message.im',
    'message.mpim',
];
const isLocalhost = (hostname) => hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
class SlackApiError extends errors_1.BadRequestError {
    constructor(action, code) {
        super(`Slack could not ${action}: ${code}`);
        this.meta = { integrationType: 'slack', code };
    }
}
let SlackMethodsService = class SlackMethodsService {
    constructor(credentialsService, agentRepository, integrationManagementService, urlService, outboundHttp, cacheService, cipher, logger) {
        this.credentialsService = credentialsService;
        this.agentRepository = agentRepository;
        this.integrationManagementService = integrationManagementService;
        this.urlService = urlService;
        this.outboundHttp = outboundHttp;
        this.cacheService = cacheService;
        this.cipher = cipher;
        this.logger = logger;
    }
    async callSlackApi(method, params, headers = {}) {
        try {
            const requestHeaders = { ...headers };
            if (!(params instanceof FormData)) {
                requestHeaders['content-type'] = 'application/x-www-form-urlencoded';
            }
            const response = await this.outboundHttp
                .requests({
                useDefaultSsrfPolicy: 'unsafe',
            })
                .request({
                method: 'POST',
                url: `https://slack.com/api/${method}`,
                headers: requestHeaders,
                body: params,
                returnFullResponse: true,
                ignoreHttpStatusErrors: true,
            });
            const data = response.body;
            return (0, is_record_1.isRecord)(data)
                ? data
                : { ok: false, error: 'invalid_response' };
        }
        catch {
            return { ok: false, error: 'slack_request_failed' };
        }
    }
    slackError(action, response) {
        return new SlackApiError(action, (0, integration_helpers_1.stringProperty)(response, 'error') ?? 'unknown_error');
    }
    async getAgent(agentId, projectId) {
        return await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
    }
    buildManifest(agentName, projectId, agentId, options = {}) {
        const slackAppName = this.sanitiseSlackAppName(agentName);
        const webhookUrl = this.webhookUrl(projectId, agentId);
        return {
            display_information: {
                name: slackAppName,
                ...(options.managed
                    ? { description: `Work with ${slackAppName}, your n8n AI agent, in Slack.` }
                    : {}),
            },
            features: {
                agent_view: {
                    agent_description: `Chat with ${slackAppName}, an agent powered by n8n.`,
                },
                app_home: {
                    home_tab_enabled: false,
                    messages_tab_enabled: true,
                    messages_tab_read_only_enabled: false,
                },
                bot_user: {
                    display_name: slackAppName,
                    always_online: true,
                },
            },
            oauth_config: {
                ...(options.redirectUrl ? { redirect_urls: [options.redirectUrl] } : {}),
                scopes: { bot: [...slack_setup_types_1.SLACK_BOT_SCOPES] },
            },
            settings: {
                event_subscriptions: {
                    request_url: webhookUrl,
                    bot_events: [...REQUIRED_BOT_EVENTS],
                },
                interactivity: {
                    is_enabled: true,
                    request_url: webhookUrl,
                },
                org_deploy_enabled: false,
                socket_mode_enabled: false,
                token_rotation_enabled: false,
                ...(options.managed
                    ? {
                        managed_app_settings: {
                            is_install_from_slack_disabled: true,
                            external_app_management_url: this.managedAppUrl(projectId, agentId),
                        },
                    }
                    : {}),
            },
        };
    }
    callbackUrl(projectId, agentId) {
        return `${this.urlService.getWebhookBaseUrl()}rest/projects/${projectId}/agents/v2/${agentId}/integrations/slack/oauth/callback`;
    }
    installUrl(oauthAuthorizeUrl, state, redirectUrl) {
        try {
            const url = new URL(oauthAuthorizeUrl);
            url.searchParams.set('state', state);
            url.searchParams.set('redirect_uri', redirectUrl);
            return url.toString();
        }
        catch {
            throw new errors_1.BadRequestError('Slack returned an invalid installation URL');
        }
    }
    async storeSession(state, session) {
        await this.cacheService.set((0, slack_setup_types_1.slackSetupCacheKey)(state), await this.cipher.encryptV2(JSON.stringify(session)), slack_setup_types_1.SLACK_APP_SETUP_TTL_MS);
    }
    async decodeSession(value) {
        try {
            const decrypted = await this.cipher.decryptV2(value);
            const session = (0, n8n_workflow_1.jsonParse)(decrypted, { fallbackValue: null });
            if ((0, slack_setup_types_1.hasSessionShape)(session))
                return session;
        }
        catch {
        }
        return undefined;
    }
    async connectBotCredential(agent, user, accessToken, session, modifiedBy) {
        const credentialData = {
            name: this.credentialName(session.teamName, agent.name),
            type: slack_setup_types_1.SLACK_CREDENTIAL_TYPE,
            data: {
                accessToken,
                signatureSecret: session.signingSecret,
                agentId: session.agentId,
                ...(session.managerCredentialId
                    ? {
                        managedAppId: session.appId,
                        teamId: session.teamId,
                        managerCredentialId: session.managerCredentialId,
                    }
                    : {}),
            },
            projectId: session.projectId,
        };
        const credential = session.managerCredentialId
            ? await this.credentialsService.createManagedCredential(credentialData, user)
            : await this.credentialsService.createUnmanagedCredential(credentialData, user);
        const integration = {
            type: 'slack',
            credentialId: credential.id,
            settings: { messagingExperience: 'agent' },
        };
        try {
            await this.integrationManagementService.connect({
                agent,
                user,
                integration,
                ...(modifiedBy ? { modifiedBy } : {}),
            });
        }
        catch (error) {
            await this.deleteUnreferencedCredential(agent.id, credential.id, user);
            throw error;
        }
        await this.clearManagedAppSession(session);
        return credential.id;
    }
    async deleteUnreferencedCredential(agentId, credentialId, user) {
        try {
            const state = await this.agentRepository.findIntegrationState(agentId);
            const referenced = (state?.integrations ?? []).some((entry) => entry.credentialId === credentialId);
            if (referenced)
                return;
            await this.credentialsService.delete(user, credentialId);
        }
        catch (error) {
            this.logger.warn('[SlackMethodsService] Could not clean up the Slack credential', {
                agentId,
                credentialId,
                error,
            });
        }
    }
    async clearManagedAppSession(session) {
        if (session.managerCredentialId && session.teamId) {
            await this.cacheService.delete((0, slack_setup_types_1.managedSlackAppCacheKey)({
                projectId: session.projectId,
                agentId: session.agentId,
                managerCredentialId: session.managerCredentialId,
                workspaceId: session.teamId,
                userId: session.userId,
            }));
        }
    }
    webhookUrl(projectId, agentId) {
        return `${this.urlService.getWebhookBaseUrl()}rest/projects/${projectId}/agents/v2/${agentId}/webhooks/slack`;
    }
    managedAppUrl(projectId, agentId) {
        const url = new URL(`/projects/${projectId}/agents/${agentId}`, `${this.urlService.getInstanceBaseUrl()}/`);
        if (process.env.NODE_ENV === 'development' && isLocalhost(url.hostname)) {
            url.protocol = 'https:';
        }
        return url.toString();
    }
    credentialName(workspaceName, agentName) {
        return [workspaceName ?? 'Slack', agentName || DEFAULT_SLACK_APP_NAME]
            .filter(Boolean)
            .join(' - ')
            .slice(0, 128);
    }
    sanitiseSlackAppName(raw) {
        const cleaned = raw
            .replace(/[^a-zA-Z0-9 ._-]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 35);
        return cleaned.length > 0 ? cleaned : DEFAULT_SLACK_APP_NAME;
    }
};
exports.SlackMethodsService = SlackMethodsService;
exports.SlackMethodsService = SlackMethodsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credentials_service_1.CredentialsService, agent_repository_1.AgentRepository, agent_integration_management_service_1.AgentIntegrationManagementService, backend_services_1.UrlService, backend_network_1.OutboundHttp, backend_services_1.CacheService, n8n_core_1.Cipher, backend_common_1.Logger])
], SlackMethodsService);
//# sourceMappingURL=slack-methods.service.js.map