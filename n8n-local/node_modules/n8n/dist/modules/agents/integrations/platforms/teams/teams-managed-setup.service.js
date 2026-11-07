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
exports.TeamsManagedSetupService = exports.REQUIRED_MANAGER_SCOPES = exports.TEAMS_MANAGER_CREDENTIAL_TYPE = void 0;
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const backend_services_1 = require("@n8n/backend-services");
const credentials_service_1 = require("../../../../../credentials/credentials.service");
const credentials_overwrites_1 = require("../../../../../credentials-overwrites");
const oauth_service_1 = require("../../../../../oauth/oauth.service");
const naming_service_1 = require("../../../../../services/naming.service");
const errors_1 = require("@n8n/errors");
const integration_helpers_1 = require("../../integration-helpers");
exports.TEAMS_MANAGER_CREDENTIAL_TYPE = 'microsoftTeamsManagerOAuth2Api';
const ADMIN_CONSENT_URL = 'https://login.microsoftonline.com/organizations/v2.0/adminconsent';
const DEFAULT_MANAGER_CREDENTIAL_NAME = 'Microsoft organization';
exports.REQUIRED_MANAGER_SCOPES = [
    'https://graph.microsoft.com/Application.ReadWrite.All',
    'https://graph.microsoft.com/AppCatalog.ReadWrite.All',
    'https://graph.microsoft.com/AppCatalog.Submit',
];
function childRecord(record, key) {
    const child = record[key];
    return (0, is_record_1.isRecord)(child) ? child : undefined;
}
function grantedScopes(scope) {
    if (!scope)
        return new Set();
    const granted = new Set();
    for (const entry of scope.split(' ')) {
        if (!entry)
            continue;
        granted.add(entry);
        const short = entry.split('/').pop();
        if (short)
            granted.add(short);
    }
    return granted;
}
function isMissingScope(granted, required) {
    const short = required.split('/').pop();
    return !granted.has(required) && !(short !== undefined && granted.has(short));
}
let TeamsManagedSetupService = class TeamsManagedSetupService {
    constructor(credentialsService, credentialsFinderService, credentialsOverwrites, oauthService, namingService) {
        this.credentialsService = credentialsService;
        this.credentialsFinderService = credentialsFinderService;
        this.credentialsOverwrites = credentialsOverwrites;
        this.oauthService = oauthService;
        this.namingService = namingService;
    }
    isSetupAvailable() {
        const overwrite = this.credentialsOverwrites.getOverwrites(exports.TEAMS_MANAGER_CREDENTIAL_TYPE);
        return (typeof overwrite?.clientId === 'string' &&
            overwrite.clientId.trim().length > 0 &&
            typeof overwrite.clientSecret === 'string' &&
            overwrite.clientSecret.trim().length > 0);
    }
    assertSetupAvailable() {
        if (!this.isSetupAvailable()) {
            throw new errors_1.BadRequestError('The recommended Microsoft Teams setup is not available here.');
        }
    }
    adminConsentUrl() {
        const overwrite = this.credentialsOverwrites.getOverwrites(exports.TEAMS_MANAGER_CREDENTIAL_TYPE);
        const clientId = typeof overwrite?.clientId === 'string' ? overwrite.clientId.trim() : '';
        if (!clientId)
            return null;
        const query = new URLSearchParams({
            client_id: clientId,
            scope: 'https://graph.microsoft.com/.default',
            redirect_uri: `${this.oauthService.getBaseUrl(2)}/callback`,
        });
        return `${ADMIN_CONSENT_URL}?${query.toString()}`;
    }
    async getSetupState(options) {
        if (!this.isSetupAvailable()) {
            return { managedSetupAvailable: false, managerCredentials: [], adminConsentUrl: null };
        }
        const usable = await this.credentialsService.getCredentialsAUserCanUseInAWorkflow(options.user, {
            projectId: options.projectId,
        });
        const managerCredentials = [];
        for (const candidate of usable) {
            if (candidate.type !== exports.TEAMS_MANAGER_CREDENTIAL_TYPE)
                continue;
            const credential = await this.credentialsFinderService.findCredentialForUser(candidate.id, options.user, ['credential:read']);
            if (!credential)
                continue;
            const rawData = await this.credentialsService.decrypt(credential, true);
            managerCredentials.push({
                id: credential.id,
                name: credential.name,
                ...this.summarizeGrant(rawData),
            });
        }
        return {
            managedSetupAvailable: true,
            managerCredentials,
            adminConsentUrl: this.adminConsentUrl(),
        };
    }
    async createManagerCredential(options) {
        this.assertSetupAvailable();
        const credential = await this.credentialsService.createUnmanagedCredential({
            name: await this.namingService.getUniqueCredentialName(DEFAULT_MANAGER_CREDENTIAL_NAME),
            type: exports.TEAMS_MANAGER_CREDENTIAL_TYPE,
            data: {},
            projectId: options.projectId,
        }, options.user);
        return {
            id: credential.id,
            name: credential.name,
            type: exports.TEAMS_MANAGER_CREDENTIAL_TYPE,
            isResolvable: false,
        };
    }
    summarizeGrant(rawData) {
        const data = rawData;
        const tokenData = childRecord(data, 'oauthTokenData');
        const connected = typeof (0, integration_helpers_1.stringProperty)(tokenData, 'access_token') === 'string';
        const granted = grantedScopes((0, integration_helpers_1.stringProperty)(tokenData, 'scope'));
        const canRefresh = typeof (0, integration_helpers_1.stringProperty)(tokenData, 'refresh_token') === 'string';
        return {
            connected,
            reconnectRequired: connected &&
                (!canRefresh || exports.REQUIRED_MANAGER_SCOPES.some((scope) => isMissingScope(granted, scope))),
            organizationName: (0, integration_helpers_1.stringProperty)(data, 'organizationName') ?? null,
            tenantId: (0, integration_helpers_1.stringProperty)(data, 'tenantId') ?? null,
        };
    }
};
exports.TeamsManagedSetupService = TeamsManagedSetupService;
exports.TeamsManagedSetupService = TeamsManagedSetupService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credentials_service_1.CredentialsService, backend_services_1.CredentialsFinderService, credentials_overwrites_1.CredentialsOverwrites, oauth_service_1.OauthService, naming_service_1.NamingService])
], TeamsManagedSetupService);
//# sourceMappingURL=teams-managed-setup.service.js.map