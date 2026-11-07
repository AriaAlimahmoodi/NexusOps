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
exports.TeamsManagerTokenService = exports.RESOURCE_SCOPES = exports.AZURE_RESOURCE = exports.GRAPH_RESOURCE = void 0;
const backend_network_1 = require("@n8n/backend-network");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const credentials_service_1 = require("../../../../../credentials/credentials.service");
const credentials_overwrites_1 = require("../../../../../credentials-overwrites");
const errors_1 = require("@n8n/errors");
const n8n_workflow_1 = require("n8n-workflow");
const teams_managed_setup_service_1 = require("./teams-managed-setup.service");
const teams_setup_telemetry_service_1 = require("./teams-setup-telemetry.service");
const integration_helpers_1 = require("../../integration-helpers");
const TOKEN_ENDPOINT = 'https://login.microsoftonline.com/organizations/oauth2/v2.0/token';
const TOKEN_TIMEOUT_MS = 30_000;
exports.GRAPH_RESOURCE = 'https://graph.microsoft.com';
exports.AZURE_RESOURCE = 'https://management.azure.com';
function resourceName(resource) {
    return resource === exports.AZURE_RESOURCE ? 'Azure' : 'Microsoft Graph';
}
exports.RESOURCE_SCOPES = {
    [exports.GRAPH_RESOURCE]: [
        'offline_access',
        `${exports.GRAPH_RESOURCE}/Application.ReadWrite.All`,
        `${exports.GRAPH_RESOURCE}/AppCatalog.ReadWrite.All`,
        `${exports.GRAPH_RESOURCE}/AppCatalog.Submit`,
        `${exports.GRAPH_RESOURCE}/User.Read`,
    ].join(' '),
    [exports.AZURE_RESOURCE]: ['offline_access', `${exports.AZURE_RESOURCE}/user_impersonation`].join(' '),
};
function mergeScopes(stored, granted) {
    const all = [...(stored ?? '').split(' '), ...granted.split(' ')].filter(Boolean);
    return [...new Set(all)].join(' ');
}
let TeamsManagerTokenService = class TeamsManagerTokenService {
    constructor(credentialsService, credentialsRepository, credentialsOverwrites, outboundHttp, logger) {
        this.credentialsService = credentialsService;
        this.credentialsRepository = credentialsRepository;
        this.credentialsOverwrites = credentialsOverwrites;
        this.outboundHttp = outboundHttp;
        this.logger = logger;
        this.inFlight = new Map();
    }
    async acquire(credential, resource) {
        if (credential.type !== teams_managed_setup_service_1.TEAMS_MANAGER_CREDENTIAL_TYPE) {
            throw new errors_1.BadRequestError('That credential is not a Microsoft setup sign-in.');
        }
        const running = this.inFlight.get(credential.id);
        const next = running
            ? running.then(async () => await this.redeem(credential, resource), async () => await this.redeem(credential, resource))
            : this.redeem(credential, resource);
        this.inFlight.set(credential.id, next);
        next
            .finally(() => {
            if (this.inFlight.get(credential.id) === next)
                this.inFlight.delete(credential.id);
        })
            .catch(() => { });
        return await next;
    }
    async redeem(credential, resource) {
        const current = (await this.credentialsRepository.findOneBy({ id: credential.id })) ?? credential;
        const rawData = await this.credentialsService.decrypt(current, true);
        const tokenData = this.tokenDataOf(rawData);
        const refreshToken = (0, integration_helpers_1.stringProperty)(tokenData, 'refresh_token');
        if (!refreshToken) {
            throw (0, teams_setup_telemetry_service_1.withTeamsFailure)(new errors_1.BadRequestError('Sign in with Microsoft again to continue.'), 'not_signed_in');
        }
        const client = this.clientCredentials();
        const response = await this.outboundHttp
            .requests({ useDefaultSsrfPolicy: 'unsafe' })
            .request({
            method: 'POST',
            url: TOKEN_ENDPOINT,
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: client.clientId,
                client_secret: client.clientSecret,
                scope: exports.RESOURCE_SCOPES[resource],
            }).toString(),
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
            timeout: TOKEN_TIMEOUT_MS,
        });
        const body = response.body;
        const accessToken = (0, integration_helpers_1.stringProperty)(body, 'access_token');
        if (response.statusCode !== 200 || !accessToken) {
            this.logger.debug('[TeamsManagerToken] Microsoft refused the refresh', {
                statusCode: response.statusCode,
                resource,
                error: (0, integration_helpers_1.stringProperty)(body, 'error'),
                suberror: (0, integration_helpers_1.stringProperty)(body, 'suberror'),
                errorDescription: (0, integration_helpers_1.stringProperty)(body, 'error_description'),
            });
            if ((0, integration_helpers_1.stringProperty)(body, 'error') === 'invalid_grant') {
                throw (0, teams_setup_telemetry_service_1.withTeamsFailure)(new errors_1.BadRequestError(`This Microsoft sign-in does not reach ${resourceName(resource)}. Sign in again, and make sure the organisation approved n8n for it.`), 'not_signed_in');
            }
            throw new n8n_workflow_1.OperationalError(`Microsoft would not issue a token for ${resourceName(resource)}. Sign in again and retry.`);
        }
        await this.persistRotatedRefreshToken(credential, rawData, tokenData, body);
        return accessToken;
    }
    async persistRotatedRefreshToken(credential, rawData, tokenData, body) {
        const rotated = (0, integration_helpers_1.stringProperty)(body, 'refresh_token');
        if (!rotated)
            return;
        const oauthTokenData = { ...tokenData, refresh_token: rotated };
        const scope = (0, integration_helpers_1.stringProperty)(body, 'scope');
        if (scope !== undefined) {
            oauthTokenData.scope = mergeScopes((0, integration_helpers_1.stringProperty)(tokenData, 'scope'), scope);
        }
        const updated = { ...rawData, oauthTokenData };
        const encrypted = await this.credentialsService.createEncryptedData({
            id: credential.id,
            name: credential.name,
            type: credential.type,
            data: updated,
        });
        await this.credentialsService.update(credential.id, encrypted, { kind: 'system', reason: 'integration' }, updated);
        if (encrypted.data)
            credential.data = encrypted.data;
    }
    tokenDataOf(rawData) {
        const tokenData = rawData.oauthTokenData;
        return (0, is_record_1.isRecord)(tokenData) ? tokenData : {};
    }
    clientCredentials() {
        const overwrite = this.credentialsOverwrites.getOverwrites(teams_managed_setup_service_1.TEAMS_MANAGER_CREDENTIAL_TYPE);
        const clientId = typeof overwrite?.clientId === 'string' ? overwrite.clientId.trim() : '';
        const clientSecret = typeof overwrite?.clientSecret === 'string' ? overwrite.clientSecret.trim() : '';
        if (!clientId || !clientSecret) {
            throw new errors_1.BadRequestError('The recommended Microsoft Teams setup is not available here.');
        }
        return { clientId, clientSecret };
    }
};
exports.TeamsManagerTokenService = TeamsManagerTokenService;
exports.TeamsManagerTokenService = TeamsManagerTokenService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credentials_service_1.CredentialsService, db_1.CredentialsRepository, credentials_overwrites_1.CredentialsOverwrites, backend_network_1.OutboundHttp, backend_common_1.Logger])
], TeamsManagerTokenService);
//# sourceMappingURL=teams-manager-token.service.js.map