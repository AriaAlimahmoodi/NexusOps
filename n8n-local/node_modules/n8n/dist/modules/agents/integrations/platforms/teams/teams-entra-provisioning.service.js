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
exports.TeamsEntraProvisioningService = exports.BOT_CREDENTIAL_TYPE = void 0;
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const teams_setup_telemetry_service_1 = require("./teams-setup-telemetry.service");
const backend_services_1 = require("@n8n/backend-services");
const credentials_service_1 = require("../../../../../credentials/credentials.service");
const errors_1 = require("@n8n/errors");
const teams_admin_consent_1 = require("./teams-admin-consent");
const teams_graph_permissions_1 = require("./teams-graph-permissions");
const teams_graph_service_1 = require("./teams-graph.service");
const teams_managed_setup_service_1 = require("./teams-managed-setup.service");
const teams_manager_token_service_1 = require("./teams-manager-token.service");
const integration_helpers_1 = require("../../integration-helpers");
exports.BOT_CREDENTIAL_TYPE = 'microsoftEntraServicePrincipalApi';
const SECRET_RENEW_BEFORE_MS = 7 * 24 * 60 * 60 * 1000;
function usableSecret(data) {
    const value = (0, integration_helpers_1.stringProperty)(data, 'clientSecret');
    const expiresAt = (0, integration_helpers_1.stringProperty)(data, 'secretExpiresAt');
    if (!value || !expiresAt)
        return undefined;
    const expiry = Date.parse(expiresAt);
    if (Number.isNaN(expiry) || expiry - Date.now() < SECRET_RENEW_BEFORE_MS)
        return undefined;
    return { value, expiresAt };
}
const GRAPH_APP_ID = '00000003-0000-0000-c000-000000000000';
function withGraphPermissions(requiredResourceAccess) {
    const entries = Array.isArray(requiredResourceAccess) ? requiredResourceAccess : [];
    const graph = entries.find((entry) => (0, is_record_1.isRecord)(entry) && entry.resourceAppId === GRAPH_APP_ID);
    const roles = (0, is_record_1.isRecord)(graph) && Array.isArray(graph.resourceAccess) ? graph.resourceAccess : [];
    const missing = teams_graph_permissions_1.GRAPH_APP_ROLES.filter(({ id }) => !roles.some((role) => (0, is_record_1.isRecord)(role) && role.id === id)).map(({ id }) => ({ id, type: 'Role' }));
    if (missing.length === 0)
        return entries;
    return [
        ...entries.filter((entry) => entry !== graph),
        { resourceAppId: GRAPH_APP_ID, resourceAccess: [...roles, ...missing] },
    ];
}
const ENTRA_APP_URL = 'https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId';
const SECRET_LIFETIMES_MONTHS = [24, 12, 6, 3];
const UNIQUE_NAME_PREFIX = 'n8n-agent-';
const APP_NAME_MAX = 120;
let TeamsEntraProvisioningService = class TeamsEntraProvisioningService {
    constructor(graph, tokens, credentialsService, credentialsFinderService, urlService) {
        this.graph = graph;
        this.tokens = tokens;
        this.credentialsService = credentialsService;
        this.credentialsFinderService = credentialsFinderService;
        this.urlService = urlService;
    }
    async provision(options) {
        const manager = await this.managerCredential(options);
        const token = await this.tokens.acquire(manager, teams_manager_token_service_1.GRAPH_RESOURCE);
        const tenant = await this.readTenant(token);
        await this.rememberTenant(options.user, manager, tenant);
        const existing = await this.findProvisionedCredential(options);
        const app = await this.createApp(token, options.agentId, options.agentName);
        const secret = (existing?.objectId === app.objectId ? existing.secret : undefined) ??
            (await this.addSecret(token, app.objectId));
        await this.createServicePrincipal(token, app.appId);
        const redirectUri = (0, teams_admin_consent_1.adminConsentRedirectUri)(this.urlService.getInstanceBaseUrl(), options);
        const fileAccessDeclared = await this.declareFileAccess(token, app.objectId, redirectUri);
        const credentialId = await this.writeBotCredential({
            options,
            app,
            secret,
            tenantId: tenant.tenantId,
            existingCredential: existing?.credential,
        });
        return {
            credentialId,
            appId: app.appId,
            appName: app.displayName,
            organizationName: tenant.organizationName,
            entraAppUrl: `${ENTRA_APP_URL}/${app.appId}`,
            fileAccessConsentUrl: fileAccessDeclared && redirectUri
                ? (0, teams_admin_consent_1.adminConsentUrl)(tenant.tenantId, app.appId, redirectUri)
                : null,
            secretExpiresAt: secret.expiresAt,
        };
    }
    async managerCredential(options) {
        const credential = await this.credentialsFinderService.findCredentialForUser(options.managerCredentialId, options.user, ['credential:use']);
        if (!credential || credential.type !== teams_managed_setup_service_1.TEAMS_MANAGER_CREDENTIAL_TYPE) {
            throw (0, teams_setup_telemetry_service_1.withTeamsFailure)(new errors_1.BadRequestError('Sign in with Microsoft before creating the Teams app.'), 'not_signed_in');
        }
        return credential;
    }
    async readTenant(token) {
        const organization = await this.graph.request(token, 'GET', '/organization?$select=id,displayName');
        if (!organization.ok) {
            throw new n8n_workflow_1.OperationalError('Could not read the organization this account belongs to.');
        }
        const first = (0, is_record_1.isRecord)(organization.body)
            ? organization.body.value?.[0]
            : undefined;
        const tenantId = (0, integration_helpers_1.stringProperty)(first, 'id');
        if (!tenantId) {
            throw (0, teams_setup_telemetry_service_1.withTeamsFailure)(new n8n_workflow_1.UserError('Teams apps need a work or school account. Sign in again with your organization’s account.'), 'personal_account');
        }
        return { tenantId, organizationName: (0, integration_helpers_1.stringProperty)(first, 'displayName') ?? null };
    }
    async rememberTenant(user, manager, tenant) {
        const rawData = await this.credentialsService.decrypt(manager, true);
        const current = rawData;
        if (current.tenantId === tenant.tenantId &&
            current.organizationName === (tenant.organizationName ?? '')) {
            return;
        }
        const updated = {
            ...rawData,
            tenantId: tenant.tenantId,
            organizationName: tenant.organizationName ?? '',
        };
        const encrypted = await this.credentialsService.createEncryptedData({
            id: manager.id,
            name: manager.name,
            type: manager.type,
            data: updated,
        });
        await this.credentialsService.update(manager.id, encrypted, { kind: 'user', user }, updated);
    }
    async createApp(token, agentId, agentName) {
        const displayName = (0, integration_helpers_1.sanitiseAppName)(`${agentName || 'n8n Agent'} (n8n)`, APP_NAME_MAX, 'n8n Agent (n8n)');
        const uniqueName = `${UNIQUE_NAME_PREFIX}${agentId}`;
        const response = await this.graph.request(token, 'PATCH', `/applications(uniqueName='${encodeURIComponent((0, teams_graph_service_1.odataLiteral)(uniqueName))}')`, {
            displayName,
            signInAudience: 'AzureADMyOrg',
            tags: [uniqueName],
        }, { Prefer: 'create-if-missing' });
        if (!response.ok) {
            throw this.registrationError(response.statusCode, (0, teams_graph_service_1.graphErrorCode)(response.body));
        }
        const objectId = (0, integration_helpers_1.stringProperty)(response.body, 'id');
        const appId = (0, integration_helpers_1.stringProperty)(response.body, 'appId');
        if (objectId && appId)
            return { objectId, appId, displayName };
        return await this.findAppByUniqueName(token, uniqueName, displayName);
    }
    async findAppByUniqueName(token, uniqueName, displayName) {
        const query = new URLSearchParams({
            $filter: `uniqueName eq '${(0, teams_graph_service_1.odataLiteral)(uniqueName)}'`,
            $select: 'id,appId,displayName',
        });
        const response = await this.graph.request(token, 'GET', `/applications?${query.toString()}`);
        if (!response.ok) {
            throw this.registrationError(response.statusCode, (0, teams_graph_service_1.graphErrorCode)(response.body));
        }
        const value = (0, is_record_1.isRecord)(response.body) ? response.body.value : undefined;
        const first = Array.isArray(value) ? value[0] : undefined;
        const objectId = (0, integration_helpers_1.stringProperty)(first, 'id');
        const appId = (0, integration_helpers_1.stringProperty)(first, 'appId');
        if (!objectId || !appId) {
            throw new n8n_workflow_1.OperationalError('Microsoft updated the app but would not say which one.');
        }
        return { objectId, appId, displayName: (0, integration_helpers_1.stringProperty)(first, 'displayName') ?? displayName };
    }
    async declareFileAccess(token, objectId, redirectUri) {
        try {
            return await this.mergeFileAccess(token, objectId, redirectUri);
        }
        catch {
            return false;
        }
    }
    async mergeFileAccess(token, objectId, redirectUri) {
        const current = await this.graph.request(token, 'GET', `/applications/${objectId}?$select=requiredResourceAccess,web`);
        if (!current.ok)
            return false;
        const app = (0, is_record_1.isRecord)(current.body) ? current.body : {};
        const web = (0, is_record_1.isRecord)(app.web) ? app.web : {};
        const redirectUris = Array.isArray(web.redirectUris) ? web.redirectUris : [];
        const response = await this.graph.request(token, 'PATCH', `/applications/${objectId}`, {
            requiredResourceAccess: withGraphPermissions(app.requiredResourceAccess),
            ...(redirectUri && !redirectUris.includes(redirectUri)
                ? { web: { redirectUris: [...redirectUris, redirectUri] } }
                : {}),
        });
        return response.ok;
    }
    async dropExpiredSecrets(token, objectId) {
        const response = await this.graph.request(token, 'GET', `/applications/${objectId}`);
        if (!response.ok)
            return;
        const credentials = (0, is_record_1.isRecord)(response.body) ? response.body.passwordCredentials : undefined;
        if (!Array.isArray(credentials))
            return;
        const now = Date.now();
        for (const credential of credentials) {
            const keyId = (0, integration_helpers_1.stringProperty)(credential, 'keyId');
            const endDateTime = (0, integration_helpers_1.stringProperty)(credential, 'endDateTime');
            if (!keyId || !endDateTime)
                continue;
            const expiry = Date.parse(endDateTime);
            if (Number.isNaN(expiry) || expiry > now)
                continue;
            await this.graph.request(token, 'POST', `/applications/${objectId}/removePassword`, {
                keyId,
            });
        }
    }
    async addSecret(token, objectId) {
        await this.dropExpiredSecrets(token, objectId);
        let lastCode;
        for (const months of SECRET_LIFETIMES_MONTHS) {
            const endDateTime = new Date();
            endDateTime.setMonth(endDateTime.getMonth() + months);
            const response = await this.graph.request(token, 'POST', `/applications/${objectId}/addPassword`, {
                passwordCredential: {
                    displayName: 'n8n agent channel',
                    endDateTime: endDateTime.toISOString(),
                },
            });
            if (response.ok) {
                const value = (0, integration_helpers_1.stringProperty)(response.body, 'secretText');
                if (!value) {
                    throw new n8n_workflow_1.OperationalError('Microsoft created a secret but did not return it.');
                }
                return {
                    value,
                    expiresAt: (0, integration_helpers_1.stringProperty)(response.body, 'endDateTime') ?? endDateTime.toISOString(),
                };
            }
            lastCode = (0, teams_graph_service_1.graphErrorCode)(response.body);
        }
        throw (0, teams_setup_telemetry_service_1.withTeamsFailure)(new n8n_workflow_1.UserError(lastCode === 'Authorization_RequestDenied'
            ? 'This organization does not allow n8n to add a client secret. Use the manual setup.'
            : 'This organization refused every client secret lifetime n8n offered. Use the manual setup.'), 'secrets_refused');
    }
    async createServicePrincipal(token, appId) {
        const response = await this.graph.request(token, 'POST', '/servicePrincipals', { appId });
        if (!response.ok &&
            (0, teams_graph_service_1.graphErrorCode)(response.body) !== 'Request_MultipleObjectsWithSameKeyValue') {
            throw new n8n_workflow_1.OperationalError('Could not finish registering the app in this organization.');
        }
    }
    registrationError(statusCode, code) {
        if (statusCode === 403 || code === 'Authorization_RequestDenied') {
            return (0, teams_setup_telemetry_service_1.withTeamsFailure)(new n8n_workflow_1.UserError('This organization doesn’t let you register apps. Ask an admin to register the app.'), 'cannot_register_apps');
        }
        return new n8n_workflow_1.OperationalError('Microsoft refused to register the app. Try again.');
    }
    async findProvisionedCredential(options) {
        const usable = await this.credentialsService.getCredentialsAUserCanUseInAWorkflow(options.user, { projectId: options.projectId });
        for (const candidate of usable) {
            if (candidate.type !== exports.BOT_CREDENTIAL_TYPE)
                continue;
            const credential = await this.credentialsFinderService.findCredentialForUser(candidate.id, options.user, ['credential:read']);
            if (!credential)
                continue;
            const data = await this.credentialsService.decrypt(credential, true);
            const objectId = (0, integration_helpers_1.stringProperty)(data, 'entraAppObjectId');
            if (objectId && (0, integration_helpers_1.stringProperty)(data, 'provisionedForAgentId') === options.agentId) {
                return { credential, objectId, secret: usableSecret(data) };
            }
        }
        return undefined;
    }
    async writeBotCredential(input) {
        const existingData = input.existingCredential
            ? (await this.credentialsService.decrypt(input.existingCredential, true))
            : {};
        const movedIdentity = (existingData.tenantId !== undefined && existingData.tenantId !== input.tenantId) ||
            (existingData.clientId !== undefined && existingData.clientId !== input.app.appId);
        if (movedIdentity) {
            delete existingData.publishedTeamsAppId;
            delete existingData.publishedTeamsAppState;
            delete existingData.publishedTeamsAppAt;
            delete existingData.azureBotName;
            delete existingData.azureSubscriptionId;
        }
        const data = {
            ...existingData,
            tenantId: input.tenantId,
            clientId: input.app.appId,
            clientSecret: input.secret.value,
            entraAppObjectId: input.app.objectId,
            provisionedForAgentId: input.options.agentId,
            managerCredentialId: input.options.managerCredentialId,
            secretExpiresAt: input.secret.expiresAt,
        };
        if (input.existingCredential) {
            const encrypted = await this.credentialsService.createEncryptedData({
                id: input.existingCredential.id,
                name: input.existingCredential.name,
                type: exports.BOT_CREDENTIAL_TYPE,
                data,
            });
            await this.credentialsService.update(input.existingCredential.id, encrypted, { kind: 'user', user: input.options.user }, data);
            return input.existingCredential.id;
        }
        const created = await this.credentialsService.createUnmanagedCredential({
            name: input.app.displayName,
            type: exports.BOT_CREDENTIAL_TYPE,
            data,
            projectId: input.options.projectId,
        }, input.options.user);
        return created.id;
    }
};
exports.TeamsEntraProvisioningService = TeamsEntraProvisioningService;
exports.TeamsEntraProvisioningService = TeamsEntraProvisioningService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [teams_graph_service_1.TeamsGraphService, teams_manager_token_service_1.TeamsManagerTokenService, credentials_service_1.CredentialsService, backend_services_1.CredentialsFinderService, backend_services_1.UrlService])
], TeamsEntraProvisioningService);
//# sourceMappingURL=teams-entra-provisioning.service.js.map