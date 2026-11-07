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
exports.SlackManagedSetupService = void 0;
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_core_1 = require("n8n-core");
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const backend_services_1 = require("@n8n/backend-services");
const credentials_service_1 = require("../../../../../credentials/credentials.service");
const credentials_overwrites_1 = require("../../../../../credentials-overwrites");
const errors_1 = require("@n8n/errors");
const slack_methods_service_1 = require("./slack-methods.service");
const slack_setup_types_1 = require("./slack-setup.types");
const agent_repository_1 = require("../../../repositories/agent.repository");
const integration_helpers_1 = require("../../integration-helpers");
const SLACK_MANAGER_CREDENTIAL_TYPE = 'slackManagerOAuth2Api';
const DEFAULT_SLACK_MANAGER_CREDENTIAL_NAME = 'Workspace credentials';
const REQUIRED_MANAGER_SCOPES = [
    'app_configurations:read',
    'app_configurations:write',
    'managed_apps:install',
];
const MANAGED_INSTALL_FALLBACK_ERRORS = new Set([
    'installation_denied',
    'app_approval_request_eligible',
    'manager_app_not_eligible',
]);
const MANAGED_INSTALL_APPROVAL_ERRORS = new Set([
    'app_approval_request_pending',
    'app_approval_request_denied',
]);
function stringsFromScope(value) {
    if (typeof value !== 'string')
        return new Set();
    return new Set(value.split(/[\s,]+/).filter(Boolean));
}
function hasManagedSessionShape(value) {
    return ((0, is_record_1.isRecord)(value) &&
        typeof value.managerCredentialId === 'string' &&
        typeof value.teamId === 'string' &&
        typeof value.oauthAuthorizeUrl === 'string');
}
let SlackManagedSetupService = class SlackManagedSetupService {
    constructor(methods, cacheService, cipher, credentialsService, credentialsFinderService, credentialsOverwrites, agentRepository) {
        this.methods = methods;
        this.cacheService = cacheService;
        this.cipher = cipher;
        this.credentialsService = credentialsService;
        this.credentialsFinderService = credentialsFinderService;
        this.credentialsOverwrites = credentialsOverwrites;
        this.agentRepository = agentRepository;
    }
    isSetupAvailable() {
        const overwrite = this.credentialsOverwrites.getOverwrites(SLACK_MANAGER_CREDENTIAL_TYPE);
        if (typeof overwrite?.clientId !== 'string' ||
            overwrite.clientId.trim().length === 0 ||
            typeof overwrite.clientSecret !== 'string' ||
            overwrite.clientSecret.trim().length === 0) {
            return false;
        }
        return true;
    }
    async getSetupState(options) {
        if (!this.isSetupAvailable()) {
            return { managedSetupAvailable: false, managerCredentials: [] };
        }
        const agent = await this.agentRepository.findByIdAndProjectId(options.agentId, options.projectId);
        const integrations = agent?.integrations ?? [];
        const usableCredentials = await this.credentialsService.getCredentialsAUserCanUseInAWorkflow(options.user, { projectId: options.projectId, excludePersonalRoute: true });
        const managerCredentials = [];
        for (const usableCredential of usableCredentials) {
            if (usableCredential.type !== SLACK_MANAGER_CREDENTIAL_TYPE)
                continue;
            const summary = await this.getManagerCredentialSummary(usableCredential.id, integrations, options.user);
            if (summary)
                managerCredentials.push(summary);
        }
        return { managedSetupAvailable: true, managerCredentials };
    }
    async createManagerCredential(options) {
        this.assertSetupAvailable();
        await this.methods.getAgent(options.agentId, options.projectId);
        const credential = await this.credentialsService.createUnmanagedCredential({
            name: DEFAULT_SLACK_MANAGER_CREDENTIAL_NAME,
            type: SLACK_MANAGER_CREDENTIAL_TYPE,
            data: {},
            projectId: options.projectId,
        }, options.user);
        return {
            id: credential.id,
            name: credential.name,
            type: SLACK_MANAGER_CREDENTIAL_TYPE,
            isResolvable: false,
        };
    }
    async finalizeManagerCredential(options) {
        await this.methods.getAgent(options.agentId, options.projectId);
        const manager = await this.getManagerCredentialContext(options.credentialId, options.projectId, options.user);
        if (manager.credential.name !== DEFAULT_SLACK_MANAGER_CREDENTIAL_NAME)
            return;
        const response = await this.callManagerSlackApi(manager, 'auth.test', {});
        if (!response.ok)
            return;
        const userName = (0, integration_helpers_1.stringProperty)(response, 'user');
        if (!userName)
            return;
        const teamName = (0, integration_helpers_1.stringProperty)(response, 'team');
        const name = [
            DEFAULT_SLACK_MANAGER_CREDENTIAL_NAME,
            teamName ? `${userName} @ ${teamName}` : userName,
        ]
            .join(' - ')
            .slice(0, 128);
        const encrypted = await this.credentialsService.createEncryptedData({
            id: manager.credential.id,
            name,
            type: manager.credential.type,
            data: manager.rawData,
        });
        await this.credentialsService.update(options.credentialId, encrypted, { kind: 'user', user: options.user }, manager.rawData);
    }
    async installApp(options) {
        this.assertSetupAvailable();
        const agent = await this.methods.getAgent(options.agentId, options.projectId);
        const existing = await this.findManagedBotCredential(agent.integrations ?? [], options.workspaceId, options.managerCredentialId, options.user);
        if (existing) {
            return { status: 'connected', appId: existing.appId, credentialId: existing.credentialId };
        }
        const { manager, workspace } = await this.getInstallWorkspace(options, agent);
        const { session, created } = await this.getOrCreateManagedAppSession(options, agent, manager, workspace.name);
        const response = await this.callManagerSlackApi(manager, 'apps.managedInstall', {
            app_id: session.appId,
            team_id: options.workspaceId,
            bot_scopes: slack_setup_types_1.SLACK_BOT_SCOPES.join(','),
        });
        if (response.ok)
            return await this.connectManagedInstallation(options, agent, session, response);
        const error = (0, integration_helpers_1.stringProperty)(response, 'error') ?? 'unknown_error';
        if (MANAGED_INSTALL_APPROVAL_ERRORS.has(error)) {
            throw this.methods.slackError('install the Slack app', response);
        }
        const responseOauthAuthorizeUrl = (0, integration_helpers_1.stringProperty)(response, 'oauth_authorize_url');
        if (responseOauthAuthorizeUrl || MANAGED_INSTALL_FALLBACK_ERRORS.has(error)) {
            return await this.prepareManualInstall(session, response, responseOauthAuthorizeUrl);
        }
        if (created) {
            const cleanupResponse = await this.callManagerSlackApi(manager, 'apps.manifest.delete', {
                app_id: session.appId,
            });
            if (cleanupResponse.ok) {
                await this.cacheService.delete((0, slack_setup_types_1.managedSlackAppCacheKey)({ ...options, userId: options.user.id }));
            }
        }
        throw this.methods.slackError('install the Slack app', response);
    }
    async getAppSettings(options) {
        this.assertSetupAvailable();
        const bot = await this.getManagedBotCredentialContext(options);
        const manager = await this.getManagerCredentialContext(bot.managerCredentialId, options.projectId, options.user);
        const manifest = await this.exportManagedAppManifest(manager, bot.managedAppId);
        return this.managedAppSettingsFromManifest(options.credentialId, bot.managedAppId, manifest);
    }
    async updateAppSettings(options) {
        this.assertSetupAvailable();
        const bot = await this.getManagedBotCredentialContext(options);
        const manager = await this.getManagerCredentialContext(bot.managerCredentialId, options.projectId, options.user);
        const manifest = await this.exportManagedAppManifest(manager, bot.managedAppId);
        const displayInformation = (0, slack_setup_types_1.childRecord)(manifest, 'display_information') ?? {};
        const features = (0, slack_setup_types_1.childRecord)(manifest, 'features') ?? {};
        const appHome = (0, slack_setup_types_1.childRecord)(features, 'app_home') ?? {};
        const botUser = (0, slack_setup_types_1.childRecord)(features, 'bot_user') ?? {};
        const updatedManifest = {
            ...manifest,
            display_information: { ...displayInformation, description: options.description },
            features: {
                ...features,
                app_home: { ...appHome, home_tab_enabled: false },
                bot_user: {
                    ...botUser,
                    display_name: options.name,
                    always_online: options.alwaysOnline,
                },
            },
        };
        const updateResponse = await this.callManagerSlackApi(manager, 'apps.manifest.update', {
            app_id: bot.managedAppId,
            manifest: JSON.stringify(updatedManifest),
        });
        if (!updateResponse.ok) {
            throw this.methods.slackError('update the Slack app', updateResponse);
        }
        return this.managedAppSettingsFromManifest(options.credentialId, bot.managedAppId, updatedManifest);
    }
    async isAppConfiguredForAgent(credentialId, agent, user) {
        const credential = await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:read']);
        if (!credential || credential.type !== slack_setup_types_1.SLACK_CREDENTIAL_TYPE)
            return false;
        const data = await this.credentialsService.decrypt(credential, true);
        const agentId = (0, integration_helpers_1.stringProperty)(data, 'agentId');
        if (agentId)
            return agentId === agent.id;
        return await this.managedAppSendsEventsTo(data, agent, user);
    }
    async managedAppSendsEventsTo(data, agent, user) {
        const managedAppId = (0, integration_helpers_1.stringProperty)(data, 'managedAppId');
        const managerCredentialId = (0, integration_helpers_1.stringProperty)(data, 'managerCredentialId');
        if (!managedAppId || !managerCredentialId)
            return false;
        try {
            const manager = await this.getManagerCredentialContext(managerCredentialId, agent.projectId, user);
            const manifest = await this.exportManagedAppManifest(manager, managedAppId);
            const settings = (0, slack_setup_types_1.childRecord)(manifest, 'settings');
            const eventSubscriptions = settings
                ? (0, slack_setup_types_1.childRecord)(settings, 'event_subscriptions')
                : undefined;
            return ((0, integration_helpers_1.stringProperty)(eventSubscriptions, 'request_url') ===
                this.methods.webhookUrl(agent.projectId, agent.id));
        }
        catch {
            return false;
        }
    }
    async deleteAppForCredential(options) {
        const credential = await this.credentialsFinderService.findCredentialForUser(options.credentialId, options.user, ['credential:read']);
        if (!credential || credential.type !== slack_setup_types_1.SLACK_CREDENTIAL_TYPE)
            return;
        const data = await this.credentialsService.decrypt(credential, true);
        const managedAppId = (0, integration_helpers_1.stringProperty)(data, 'managedAppId');
        const managerCredentialId = (0, integration_helpers_1.stringProperty)(data, 'managerCredentialId');
        const shouldDeleteExternalResource = options.deleteExternalResource === true;
        if (managedAppId && !managerCredentialId && shouldDeleteExternalResource) {
            throw new errors_1.BadRequestError('The managed Slack app is missing its manager credential');
        }
        let warning;
        if (managedAppId && managerCredentialId && shouldDeleteExternalResource) {
            warning = await this.deleteManagedExternalApp(options, managedAppId, managerCredentialId);
        }
        if (managerCredentialId && typeof data.teamId === 'string') {
            await this.cacheService.delete((0, slack_setup_types_1.managedSlackAppCacheKey)({
                projectId: options.projectId,
                agentId: options.agentId,
                managerCredentialId,
                workspaceId: data.teamId,
                userId: options.user.id,
            }));
        }
        if (credential.isManaged || managedAppId) {
            await this.credentialsService.delete(options.user, credential.id);
        }
        return warning;
    }
    assertSetupAvailable() {
        if (!this.isSetupAvailable()) {
            throw new errors_1.NotFoundError('Managed Slack setup is not available');
        }
    }
    async getManagedBotCredentialContext(options) {
        const agent = await this.methods.getAgent(options.agentId, options.projectId);
        const integration = agent.integrations?.find((item) => item.type === 'slack' && item.credentialId === options.credentialId);
        if (!integration)
            throw new errors_1.NotFoundError('Managed Slack connection not found');
        const credential = await this.credentialsFinderService.findCredentialForUser(options.credentialId, options.user, ['credential:read']);
        if (!credential || credential.type !== slack_setup_types_1.SLACK_CREDENTIAL_TYPE) {
            throw new errors_1.NotFoundError(`Credential "${options.credentialId}" not found`);
        }
        const rawData = await this.credentialsService.decrypt(credential, true);
        const managedAppId = (0, integration_helpers_1.stringProperty)(rawData, 'managedAppId');
        const managerCredentialId = (0, integration_helpers_1.stringProperty)(rawData, 'managerCredentialId');
        const teamId = (0, integration_helpers_1.stringProperty)(rawData, 'teamId');
        if (!managedAppId || !managerCredentialId || !teamId) {
            throw new errors_1.BadRequestError('The Slack connection is not managed by n8n');
        }
        return { credential, rawData, managedAppId, managerCredentialId, teamId };
    }
    async exportManagedAppManifest(manager, managedAppId) {
        const response = await this.callManagerSlackApi(manager, 'apps.manifest.export', {
            app_id: managedAppId,
        });
        if (!response.ok) {
            throw this.methods.slackError('load the Slack app settings', response);
        }
        const manifest = (0, slack_setup_types_1.childRecord)(response, 'manifest');
        if (!manifest)
            throw new errors_1.BadRequestError('Slack returned an incomplete app manifest');
        return manifest;
    }
    managedAppSettingsFromManifest(credentialId, appId, manifest) {
        const displayInformation = (0, slack_setup_types_1.childRecord)(manifest, 'display_information');
        const features = (0, slack_setup_types_1.childRecord)(manifest, 'features');
        const botUser = features ? (0, slack_setup_types_1.childRecord)(features, 'bot_user') : undefined;
        const name = (0, integration_helpers_1.stringProperty)(botUser, 'display_name');
        const description = (0, integration_helpers_1.stringProperty)(displayInformation, 'description');
        if (!name || !description || typeof botUser?.always_online !== 'boolean') {
            throw new errors_1.BadRequestError('Slack returned incomplete managed app settings');
        }
        return {
            credentialId,
            appId,
            name,
            description,
            alwaysOnline: botUser.always_online,
            appHomeUrl: `https://api.slack.com/apps/${encodeURIComponent(appId)}/app-home`,
        };
    }
    async getManagerCredentialContext(credentialId, projectId, user) {
        const usableCredentials = await this.credentialsService.getCredentialsAUserCanUseInAWorkflow(user, { projectId, excludePersonalRoute: true });
        if (!usableCredentials.some((credential) => credential.id === credentialId && credential.type === SLACK_MANAGER_CREDENTIAL_TYPE)) {
            throw new errors_1.NotFoundError(`Credential "${credentialId}" not found`);
        }
        const credential = await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:read']);
        if (!credential)
            throw new errors_1.NotFoundError(`Credential "${credentialId}" not found`);
        const rawData = await this.credentialsService.decrypt(credential, true);
        if (!this.usesManagedSlackAuth(rawData)) {
            throw new errors_1.BadRequestError('The selected Slack credential does not use managed OAuth');
        }
        const oauthTokenData = (0, slack_setup_types_1.childRecord)(rawData, 'oauthTokenData');
        const authedUser = oauthTokenData ? (0, slack_setup_types_1.childRecord)(oauthTokenData, 'authed_user') : undefined;
        const accessToken = (0, integration_helpers_1.stringProperty)(authedUser, 'access_token');
        if (!oauthTokenData || !accessToken) {
            throw new errors_1.BadRequestError('The selected Slack credential is not connected');
        }
        const grantedScopes = stringsFromScope((0, integration_helpers_1.stringProperty)(authedUser, 'scope') ?? (0, integration_helpers_1.stringProperty)(oauthTokenData, 'scope'));
        if (REQUIRED_MANAGER_SCOPES.some((scope) => !grantedScopes.has(scope))) {
            throw new errors_1.BadRequestError('Reconnect the Slack credential to grant managed app access');
        }
        return { credential, rawData, oauthTokenData, accessToken };
    }
    usesManagedSlackAuth(data) {
        const hasCustomClient = (typeof data.clientId === 'string' && data.clientId.trim().length > 0) ||
            (typeof data.clientSecret === 'string' && data.clientSecret.trim().length > 0);
        return (!hasCustomClient &&
            this.credentialsOverwrites.usesManagedAuth(SLACK_MANAGER_CREDENTIAL_TYPE, data));
    }
    async getWorkspacesFromContext(manager, integrations, user, allowRefresh = true) {
        const enterprise = (0, slack_setup_types_1.childRecord)(manager.oauthTokenData, 'enterprise');
        const workspaceRecords = await this.listWorkspaceRecords(manager, allowRefresh);
        const enterpriseId = (0, integration_helpers_1.stringProperty)(enterprise, 'id');
        const result = [];
        for (const workspace of workspaceRecords) {
            const id = (0, integration_helpers_1.stringProperty)(workspace, 'id');
            if (!id)
                continue;
            const existing = await this.findManagedBotCredential(integrations, id, manager.credential.id, user);
            result.push({
                id,
                name: (0, integration_helpers_1.stringProperty)(workspace, 'name') ?? (0, integration_helpers_1.stringProperty)(workspace, 'domain') ?? id,
                ...(enterpriseId ? { enterpriseId } : {}),
                ...(existing
                    ? {
                        managedAppId: existing.appId,
                        botCredentialId: existing.credentialId,
                        connected: true,
                    }
                    : { connected: false }),
            });
        }
        return result;
    }
    async findManagedBotCredential(integrations, workspaceId, managerCredentialId, user) {
        for (const integration of integrations) {
            if (integration.type !== 'slack' || !integration.credentialId)
                continue;
            const credential = await this.credentialsFinderService.findCredentialForUser(integration.credentialId, user, ['credential:read']);
            if (!credential || credential.type !== slack_setup_types_1.SLACK_CREDENTIAL_TYPE)
                continue;
            const data = await this.credentialsService.decrypt(credential, true);
            if (data.teamId === workspaceId &&
                data.managerCredentialId === managerCredentialId &&
                typeof data.managedAppId === 'string') {
                return { appId: data.managedAppId, credentialId: credential.id };
            }
        }
        return undefined;
    }
    async getOrCreateManagedAppSession(options, agent, manager, workspaceName) {
        const key = (0, slack_setup_types_1.managedSlackAppCacheKey)({ ...options, userId: options.user.id });
        const cached = await this.cacheService.get(key);
        if (typeof cached === 'string') {
            const session = await this.methods.decodeSession(cached);
            if (hasManagedSessionShape(session)) {
                return {
                    session: { ...session, teamName: session.teamName ?? workspaceName },
                    created: false,
                };
            }
            await this.cacheService.delete(key);
        }
        return await this.createManagedAppSession(options, agent, manager, workspaceName, key);
    }
    async callManagerSlackApi(manager, method, params) {
        const paramsForToken = (accessToken) => typeof params === 'function' ? params(accessToken) : { ...params, token: accessToken };
        const response = await this.methods.callSlackApi(method, paramsForToken(manager.accessToken));
        const error = (0, integration_helpers_1.stringProperty)(response, 'error');
        if (!['invalid_auth', 'token_expired'].includes(error ?? ''))
            return response;
        const accessToken = await this.refreshManagerAccessToken(manager);
        if (!accessToken)
            return response;
        return await this.methods.callSlackApi(method, paramsForToken(accessToken));
    }
    async setManagedAppIcon(manager, managedAppId) {
        const image = await (0, promises_1.readFile)((0, node_path_1.join)(__dirname, 'assets', 'n8n-bot-icon.png'));
        const response = await this.callManagerSlackApi(manager, 'apps.icon.set', (accessToken) => {
            const formData = new FormData();
            formData.set('token', accessToken);
            formData.set('app_id', managedAppId);
            formData.set('file', new Blob([new Uint8Array(image)], { type: 'image/png' }), 'n8n-bot-icon.png');
            return formData;
        });
        if (!response.ok) {
            throw this.methods.slackError('set the Slack app icon', response);
        }
    }
    async getManagerCredentialSummary(credentialId, integrations, user) {
        const credential = await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:read']);
        if (!credential)
            return undefined;
        const rawData = await this.credentialsService.decrypt(credential, true);
        if (!this.usesManagedSlackAuth(rawData))
            return undefined;
        const oauthTokenData = (0, slack_setup_types_1.childRecord)(rawData, 'oauthTokenData');
        const authedUser = oauthTokenData ? (0, slack_setup_types_1.childRecord)(oauthTokenData, 'authed_user') : undefined;
        const accessToken = (0, integration_helpers_1.stringProperty)(authedUser, 'access_token');
        const grantedScopes = stringsFromScope((0, integration_helpers_1.stringProperty)(authedUser, 'scope') ?? (0, integration_helpers_1.stringProperty)(oauthTokenData, 'scope'));
        const reconnectRequired = !!accessToken && REQUIRED_MANAGER_SCOPES.some((scope) => !grantedScopes.has(scope));
        const workspaces = accessToken && oauthTokenData
            ? await this.getWorkspacesFromContext({ credential, rawData, oauthTokenData, accessToken }, integrations, user, false)
            : [];
        return {
            id: credential.id,
            name: credential.name,
            connected: !!accessToken,
            reconnectRequired,
            workspaces,
        };
    }
    async listWorkspaceRecords(manager, allowRefresh) {
        const team = (0, slack_setup_types_1.childRecord)(manager.oauthTokenData, 'team');
        if (manager.oauthTokenData.is_enterprise_install !== true)
            return team ? [team] : [];
        const records = [];
        let cursor = '';
        do {
            const params = { limit: '100', ...(cursor ? { cursor } : {}) };
            let response;
            if (allowRefresh) {
                response = await this.callManagerSlackApi(manager, 'auth.teams.list', params);
            }
            else {
                response = await this.methods.callSlackApi('auth.teams.list', {
                    token: manager.accessToken,
                    ...params,
                });
            }
            if (!response.ok)
                break;
            if (Array.isArray(response.teams))
                records.push(...response.teams.filter(is_record_1.isRecord));
            cursor =
                (0, integration_helpers_1.stringProperty)((0, slack_setup_types_1.childRecord)(response, 'response_metadata'), 'next_cursor')?.trim() ?? '';
        } while (cursor);
        return records;
    }
    async getInstallWorkspace(options, agent) {
        const manager = await this.getManagerCredentialContext(options.managerCredentialId, options.projectId, options.user);
        const workspaces = await this.getWorkspacesFromContext(manager, agent.integrations ?? [], options.user);
        const workspace = workspaces.find(({ id }) => id === options.workspaceId);
        if (!workspace) {
            throw new errors_1.NotFoundError('Slack workspace is not available to this credential');
        }
        return { manager, workspace };
    }
    async connectManagedInstallation(options, agent, session, response) {
        const botAccessToken = (0, integration_helpers_1.stringProperty)((0, slack_setup_types_1.childRecord)(response, 'api_access_tokens'), 'bot_access_token');
        if (!botAccessToken?.startsWith('xoxb-')) {
            throw new errors_1.BadRequestError('Slack did not return a Bot User OAuth Token');
        }
        const credentialId = await this.methods.connectBotCredential(agent, options.user, botAccessToken, session, options.modifiedBy);
        return { status: 'connected', appId: session.appId, credentialId };
    }
    async prepareManualInstall(session, response, responseOauthAuthorizeUrl) {
        const oauthAuthorizeUrl = responseOauthAuthorizeUrl ?? session.oauthAuthorizeUrl;
        const teamId = (0, integration_helpers_1.stringProperty)(response, 'team_id') ?? session.teamId;
        const updatedSession = { ...session, oauthAuthorizeUrl, teamId };
        const state = (0, node_crypto_1.randomBytes)(32).toString('hex');
        await this.methods.storeSession(state, updatedSession);
        return {
            status: 'manual_install_required',
            appId: session.appId,
            installUrl: this.methods.installUrl(oauthAuthorizeUrl, state, session.redirectUrl),
        };
    }
    async deleteManagedExternalApp(options, managedAppId, managerCredentialId) {
        try {
            const manager = await this.getManagerCredentialContext(managerCredentialId, options.projectId, options.user);
            const response = await this.callManagerSlackApi(manager, 'apps.manifest.delete', {
                app_id: managedAppId,
            });
            if (!response.ok && (0, integration_helpers_1.stringProperty)(response, 'error') !== 'app_not_found') {
                throw this.methods.slackError('delete the Slack app', response);
            }
        }
        catch (error) {
            if (!(error instanceof errors_1.NotFoundError))
                throw error;
            return {
                integrationType: 'slack',
                code: 'app_not_deleted',
                action: {
                    type: 'open_url',
                    url: `https://api.slack.com/apps/${encodeURIComponent(managedAppId)}`,
                },
                details: { appId: managedAppId },
            };
        }
        return undefined;
    }
    async createManagedAppSession(options, agent, manager, workspaceName, key) {
        const redirectUrl = this.methods.callbackUrl(options.projectId, options.agentId);
        const manifest = this.methods.buildManifest(agent.name, options.projectId, options.agentId, {
            redirectUrl,
            managed: true,
        });
        const response = await this.callManagerSlackApi(manager, 'apps.manifest.create', {
            manifest: JSON.stringify(manifest),
            team_id: options.workspaceId,
        });
        if (!response.ok)
            throw this.methods.slackError('create the Slack app', response);
        const appId = (0, integration_helpers_1.stringProperty)(response, 'app_id');
        try {
            const setup = (0, slack_setup_types_1.parseSlackAppSetupResponse)(response);
            await this.setManagedAppIcon(manager, setup.appId);
            const session = {
                projectId: options.projectId,
                agentId: options.agentId,
                userId: options.user.id,
                ...setup,
                redirectUrl,
                managerCredentialId: options.managerCredentialId,
                teamId: options.workspaceId,
                teamName: workspaceName,
            };
            await this.cacheService.set(key, await this.cipher.encryptV2(JSON.stringify(session)), slack_setup_types_1.SLACK_APP_SETUP_TTL_MS);
            return { session, created: true };
        }
        catch (error) {
            if (appId) {
                await Promise.allSettled([
                    this.callManagerSlackApi(manager, 'apps.manifest.delete', { app_id: appId }),
                    this.cacheService.delete(key),
                ]);
            }
            throw error;
        }
    }
    async refreshManagerAccessToken(manager) {
        const authedUser = (0, slack_setup_types_1.childRecord)(manager.oauthTokenData, 'authed_user');
        const refreshToken = (0, integration_helpers_1.stringProperty)(authedUser, 'refresh_token');
        const overwrite = this.credentialsOverwrites.getOverwrites(SLACK_MANAGER_CREDENTIAL_TYPE);
        if (!refreshToken ||
            typeof overwrite?.clientId !== 'string' ||
            typeof overwrite.clientSecret !== 'string') {
            return undefined;
        }
        const refreshResponse = await this.methods.callSlackApi('oauth.v2.access', {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: overwrite.clientId,
            client_secret: overwrite.clientSecret,
        });
        const refreshedAccessToken = (0, integration_helpers_1.stringProperty)(refreshResponse, 'access_token');
        if (!refreshResponse.ok || !refreshedAccessToken) {
            return undefined;
        }
        await this.saveRefreshedManagerToken(manager, authedUser, refreshResponse, refreshedAccessToken);
        return refreshedAccessToken;
    }
    async saveRefreshedManagerToken(manager, authedUser, refreshResponse, refreshedAccessToken) {
        const refreshedAuthedUser = {
            ...authedUser,
            access_token: refreshedAccessToken,
        };
        const refreshedUserId = (0, integration_helpers_1.stringProperty)(refreshResponse, 'user_id');
        const refreshedScope = (0, integration_helpers_1.stringProperty)(refreshResponse, 'scope');
        const refreshedRefreshToken = (0, integration_helpers_1.stringProperty)(refreshResponse, 'refresh_token');
        const refreshedTokenType = (0, integration_helpers_1.stringProperty)(refreshResponse, 'token_type');
        if (refreshedUserId !== undefined)
            refreshedAuthedUser.id = refreshedUserId;
        if (refreshedScope !== undefined)
            refreshedAuthedUser.scope = refreshedScope;
        if (refreshedRefreshToken !== undefined) {
            refreshedAuthedUser.refresh_token = refreshedRefreshToken;
        }
        if (refreshedTokenType !== undefined)
            refreshedAuthedUser.token_type = refreshedTokenType;
        if (typeof refreshResponse.expires_in === 'number') {
            refreshedAuthedUser.expires_in = refreshResponse.expires_in;
        }
        const oauthTokenData = {
            ...manager.oauthTokenData,
            authed_user: refreshedAuthedUser,
        };
        const updatedData = { ...manager.rawData, oauthTokenData };
        const encrypted = await this.credentialsService.createEncryptedData({
            id: manager.credential.id,
            name: manager.credential.name,
            type: manager.credential.type,
            data: updatedData,
        });
        await this.credentialsService.update(manager.credential.id, encrypted, { kind: 'system', reason: 'integration' }, updatedData);
        manager.oauthTokenData = oauthTokenData;
        manager.accessToken = refreshedAccessToken;
    }
};
exports.SlackManagedSetupService = SlackManagedSetupService;
exports.SlackManagedSetupService = SlackManagedSetupService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [slack_methods_service_1.SlackMethodsService, backend_services_1.CacheService, n8n_core_1.Cipher, credentials_service_1.CredentialsService, backend_services_1.CredentialsFinderService, credentials_overwrites_1.CredentialsOverwrites, agent_repository_1.AgentRepository])
], SlackManagedSetupService);
//# sourceMappingURL=slack-managed-setup.service.js.map