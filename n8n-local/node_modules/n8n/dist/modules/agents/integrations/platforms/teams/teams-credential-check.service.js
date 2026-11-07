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
exports.TeamsCredentialCheckService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const agent_credential_lookup_service_1 = require("../../agent-credential-lookup.service");
const integration_helpers_1 = require("../../integration-helpers");
const teams_graph_permissions_1 = require("./teams-graph-permissions");
const TEAMS_CREDENTIAL_TYPE = 'microsoftEntraServicePrincipalApi';
const BOT_FRAMEWORK_SCOPE = 'https://api.botframework.com/.default';
const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
const GLOBAL_GRAPH_API_BASE_URL = 'https://graph.microsoft.com';
const CHECK_TIMEOUT_MS = 30_000;
let TeamsCredentialCheckService = class TeamsCredentialCheckService {
    constructor(credentialLookup, outboundHttp, logger) {
        this.credentialLookup = credentialLookup;
        this.outboundHttp = outboundHttp;
        this.logger = logger;
    }
    async check(user, projectId, credentialId) {
        const data = await this.credentialLookup.decryptForUser(user, projectId, credentialId, TEAMS_CREDENTIAL_TYPE);
        if (!data)
            return { status: 'failed', reason: 'incomplete' };
        if ((0, integration_helpers_1.stringProperty)(data, 'authentication') === 'certificate') {
            return { status: 'failed', reason: 'certificate' };
        }
        const graphApiBaseUrl = (0, integration_helpers_1.stringProperty)(data, 'graphApiBaseUrl');
        if (graphApiBaseUrl && graphApiBaseUrl.replace(/\/+$/, '') !== GLOBAL_GRAPH_API_BASE_URL) {
            return { status: 'failed', reason: 'cloud' };
        }
        const secret = clientSecretOf(data);
        if (!secret)
            return { status: 'failed', reason: 'incomplete' };
        try {
            const response = await this.requestToken(secret, BOT_FRAMEWORK_SCOPE);
            if (response.token)
                return { status: 'ok' };
            this.logger.debug('[TeamsCredentialCheck] Microsoft refused the credential', {
                statusCode: response.statusCode,
            });
            return { status: 'failed', reason: 'rejected' };
        }
        catch (error) {
            this.logger.debug('[TeamsCredentialCheck] Could not reach Microsoft', { error });
            return { status: 'failed', reason: 'unreachable' };
        }
    }
    async checkFileAccess(user, projectId, credentialId) {
        const data = await this.credentialLookup.decryptForUser(user, projectId, credentialId, TEAMS_CREDENTIAL_TYPE);
        const secret = clientSecretOf(data);
        if (!secret)
            return { status: 'unknown' };
        try {
            const { token } = await this.requestToken(secret, GRAPH_SCOPE);
            if (!token)
                return { status: 'unknown' };
            const granted = rolesOf(token);
            const approved = teams_graph_permissions_1.GRAPH_APP_ROLES.every(({ permission }) => granted.includes(permission));
            return { status: approved ? 'approved' : 'notApproved' };
        }
        catch (error) {
            this.logger.debug('[TeamsCredentialCheck] Could not read the Graph permission grant', {
                error,
            });
            return { status: 'unknown' };
        }
    }
    async requestToken({ tenantId, clientId, clientSecret }, scope) {
        const response = await this.outboundHttp
            .requests({ useDefaultSsrfPolicy: 'unsafe' })
            .request({
            method: 'POST',
            url: `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
                scope,
            }).toString(),
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
            timeout: CHECK_TIMEOUT_MS,
        });
        const body = response.body;
        const token = (0, integration_helpers_1.stringProperty)(body, 'access_token');
        return {
            statusCode: response.statusCode,
            token: response.statusCode === 200 ? token : undefined,
        };
    }
};
exports.TeamsCredentialCheckService = TeamsCredentialCheckService;
exports.TeamsCredentialCheckService = TeamsCredentialCheckService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_credential_lookup_service_1.AgentCredentialLookupService, backend_network_1.OutboundHttp, backend_common_1.Logger])
], TeamsCredentialCheckService);
function clientSecretOf(data) {
    const tenantId = (0, integration_helpers_1.stringProperty)(data, 'tenantId')?.trim();
    const clientId = (0, integration_helpers_1.stringProperty)(data, 'clientId')?.trim();
    const clientSecret = (0, integration_helpers_1.stringProperty)(data, 'clientSecret')?.trim();
    return tenantId && clientId && clientSecret ? { tenantId, clientId, clientSecret } : undefined;
}
function rolesOf(token) {
    const payload = (0, n8n_workflow_1.jsonParse)(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'), { fallbackValue: {} });
    const roles = (0, is_record_1.isRecord)(payload) ? payload.roles : undefined;
    return Array.isArray(roles)
        ? roles.filter((role) => typeof role === 'string')
        : [];
}
//# sourceMappingURL=teams-credential-check.service.js.map