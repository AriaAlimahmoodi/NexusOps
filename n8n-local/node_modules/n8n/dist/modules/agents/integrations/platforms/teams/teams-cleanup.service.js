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
exports.TeamsCleanupService = void 0;
const di_1 = require("@n8n/di");
const agent_credential_lookup_service_1 = require("../../agent-credential-lookup.service");
const integration_helpers_1 = require("../../integration-helpers");
const BOT_CREDENTIAL_TYPE = 'microsoftEntraServicePrincipalApi';
const TEAMS_MANAGE_APPS_URL = 'https://admin.teams.microsoft.com/policies/manage-apps';
let TeamsCleanupService = class TeamsCleanupService {
    constructor(credentialLookup) {
        this.credentialLookup = credentialLookup;
    }
    async describeLeftovers(ctx) {
        if (!ctx.credentialId)
            return undefined;
        const data = await this.credentialLookup.decryptForUser(ctx.user, ctx.projectId, ctx.credentialId, BOT_CREDENTIAL_TYPE);
        if (!data || !(0, integration_helpers_1.stringProperty)(data, 'entraAppObjectId'))
            return undefined;
        return {
            integrationType: 'teams',
            code: 'resources_not_deleted',
            action: { type: 'open_url', url: TEAMS_MANAGE_APPS_URL },
            details: {
                appId: (0, integration_helpers_1.stringProperty)(data, 'clientId') ?? '',
            },
        };
    }
};
exports.TeamsCleanupService = TeamsCleanupService;
exports.TeamsCleanupService = TeamsCleanupService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_credential_lookup_service_1.AgentCredentialLookupService])
], TeamsCleanupService);
//# sourceMappingURL=teams-cleanup.service.js.map