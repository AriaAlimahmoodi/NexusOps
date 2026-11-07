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
exports.TeamsCatalogService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_workflow_1 = require("n8n-workflow");
const backend_services_1 = require("@n8n/backend-services");
const errors_1 = require("@n8n/errors");
const credentials_service_1 = require("../../../../../credentials/credentials.service");
const teams_credential_notes_service_1 = require("./teams-credential-notes.service");
const teams_entra_provisioning_service_1 = require("./teams-entra-provisioning.service");
const teams_graph_service_1 = require("./teams-graph.service");
const teams_manifest_service_1 = require("./teams-manifest.service");
const teams_managed_setup_service_1 = require("./teams-managed-setup.service");
const teams_manager_token_service_1 = require("./teams-manager-token.service");
const teams_setup_service_1 = require("./teams-setup.service");
const integration_helpers_1 = require("../../integration-helpers");
const PUBLISH_NOTE_TTL_MS = 48 * 60 * 60 * 1000;
const CATALOG_LOOKUP_ATTEMPTS = 3;
const CATALOG_LOOKUP_DELAY_MS = 2000;
let TeamsCatalogService = class TeamsCatalogService {
    constructor(graph, tokens, setupService, manifestService, credentialsFinderService, credentialsService, logger, notes) {
        this.graph = graph;
        this.tokens = tokens;
        this.setupService = setupService;
        this.manifestService = manifestService;
        this.credentialsFinderService = credentialsFinderService;
        this.credentialsService = credentialsService;
        this.logger = logger;
        this.notes = notes;
    }
    async publish(options) {
        const { archive, fingerprint } = await this.setupService.buildPackage(options.user, { projectId: options.projectId, agentId: options.agentId }, options.credentialId, options.settings);
        const state = await this.publishToCatalog(options, archive);
        await this.rememberPublish(options, state, fingerprint);
        return state;
    }
    async publishToCatalog(options, archive) {
        const token = await this.graphToken(options);
        const existing = await this.findCatalogApp(token, options.agentId);
        if (existing) {
            const status = await this.updateExistingApp(token, existing.teamsAppId, archive);
            return { status, teamsAppId: existing.teamsAppId };
        }
        const direct = await this.graph.postZip(token, '/appCatalogs/teamsApps', archive);
        if (direct.ok) {
            this.logger.debug('[TeamsCatalog] Published straight to the organisation', {
                agentId: options.agentId,
                teamsAppId: (0, integration_helpers_1.stringProperty)(direct.body, 'id') ?? null,
                externalId: this.manifestService.buildManifestId(options.agentId),
            });
            return this.createdState(direct.body, 'published');
        }
        if (direct.statusCode === 409 || (0, teams_graph_service_1.graphErrorCode)(direct.body) === 'Conflict') {
            return await this.publishOverConflict(token, options.agentId, archive, direct.body);
        }
        if (!this.isPermissionRefusal(direct.statusCode, (0, teams_graph_service_1.graphErrorCode)(direct.body))) {
            throw this.publishError(direct.statusCode, direct.body);
        }
        const submitted = await this.graph.postZip(token, '/appCatalogs/teamsApps?requiresReview=true', archive);
        if (submitted.ok) {
            this.logger.debug('[TeamsCatalog] Sent for review instead of published', {
                agentId: options.agentId,
                teamsAppId: (0, integration_helpers_1.stringProperty)(submitted.body, 'id') ?? null,
                refusedWith: direct.statusCode,
            });
            return this.createdState(submitted.body, 'submitted');
        }
        if (submitted.statusCode === 409 || (0, teams_graph_service_1.graphErrorCode)(submitted.body) === 'Conflict') {
            return await this.publishOverConflict(token, options.agentId, archive, submitted.body);
        }
        throw this.publishError(submitted.statusCode, submitted.body);
    }
    createdState(body, status) {
        const teamsAppId = (0, integration_helpers_1.stringProperty)(body, 'id');
        return teamsAppId ? { status, teamsAppId } : { status: 'unknown', teamsAppId: null };
    }
    async publishOverConflict(token, agentId, archive, refusal) {
        const externalId = this.manifestService.buildManifestId(agentId);
        const ours = ((0, teams_graph_service_1.graphErrorMessage)(refusal) ?? '').includes(externalId);
        const existing = await this.awaitCatalogApp(token, agentId);
        if (!existing) {
            throw ours
                ? new n8n_workflow_1.UserError('This agent already has an app in the organization catalog, and Microsoft has not listed it yet, so it cannot be updated. Nothing is wrong and nothing was lost — try again in a few minutes.')
                : new n8n_workflow_1.UserError('An app with this name is already in the organization catalog, and Microsoft has not listed it yet, so it cannot be updated. If an earlier publish made it, try again in a few minutes. If another app holds the name, rename the agent and try again.');
        }
        const status = await this.updateExistingApp(token, existing.teamsAppId, archive);
        return { status, teamsAppId: existing.teamsAppId };
    }
    async getState(options) {
        const token = await this.graphToken(options);
        const state = await this.readState(token, options.agentId);
        if (state.status !== 'unknown')
            return state;
        return (await this.rememberedPublish(options)) ?? state;
    }
    async rememberPublish(options, state, fingerprint) {
        if (!options.credentialId)
            return;
        const notes = { teamsAppFingerprint: fingerprint };
        if (state.teamsAppId && state.status !== 'unknown') {
            notes.publishedTeamsAppId = state.teamsAppId;
            notes.publishedTeamsAppState = state.status;
            notes.publishedTeamsAppAt = new Date().toISOString();
        }
        await this.notes.write(options.user, options.credentialId, notes);
    }
    async rememberedPublish(options) {
        const credential = await this.botCredential(options, 'credential:read');
        if (!credential)
            return undefined;
        const data = await this.credentialsService.decrypt(credential, true);
        const teamsAppId = (0, integration_helpers_1.stringProperty)(data, 'publishedTeamsAppId');
        const status = (0, integration_helpers_1.stringProperty)(data, 'publishedTeamsAppState');
        if (!teamsAppId || (status !== 'published' && status !== 'submitted'))
            return undefined;
        const writtenAt = Date.parse((0, integration_helpers_1.stringProperty)(data, 'publishedTeamsAppAt') ?? '');
        if (Number.isNaN(writtenAt) || Date.now() - writtenAt > PUBLISH_NOTE_TTL_MS) {
            return undefined;
        }
        return { status, teamsAppId };
    }
    async botCredential(options, scope) {
        if (!options.credentialId)
            return undefined;
        const credential = await this.credentialsFinderService.findCredentialForUser(options.credentialId, options.user, [scope]);
        return credential?.type === teams_entra_provisioning_service_1.BOT_CREDENTIAL_TYPE ? credential : undefined;
    }
    async updateExistingApp(token, teamsAppId, archive) {
        const path = `/appCatalogs/teamsApps/${teamsAppId}/appDefinitions`;
        const direct = await this.graph.postZip(token, path, archive);
        if (direct.ok)
            return 'published';
        if (!this.isPermissionRefusal(direct.statusCode, (0, teams_graph_service_1.graphErrorCode)(direct.body))) {
            throw this.publishError(direct.statusCode, direct.body);
        }
        const submitted = await this.graph.postZip(token, `${path}?requiresReview=true`, archive);
        if (!submitted.ok) {
            throw this.publishError(submitted.statusCode, submitted.body);
        }
        return 'submitted';
    }
    async awaitCatalogApp(token, agentId) {
        for (let attempt = 0; attempt < CATALOG_LOOKUP_ATTEMPTS; attempt++) {
            if (attempt > 0)
                await (0, sleep_1.sleep)(CATALOG_LOOKUP_DELAY_MS);
            const byExternalId = await this.queryCatalog(token, `externalId eq '${this.manifestService.buildManifestId(agentId)}'`);
            if (byExternalId)
                return byExternalId;
            this.logger.debug('[TeamsCatalog] Catalogue has not listed the app yet', {
                agentId,
                attempt: attempt + 1,
                of: CATALOG_LOOKUP_ATTEMPTS,
            });
        }
        return undefined;
    }
    async queryCatalog(token, filter) {
        const query = new URLSearchParams({ $filter: filter, $expand: 'appDefinitions' });
        const response = await this.graph.request(token, 'GET', `/appCatalogs/teamsApps?${query.toString()}`);
        if (!response.ok) {
            this.logger.debug('[TeamsCatalog] Could not read the catalogue', {
                statusCode: response.statusCode,
                error: (0, teams_graph_service_1.graphErrorCode)(response.body),
            });
            return undefined;
        }
        const value = (0, is_record_1.isRecord)(response.body) ? response.body.value : undefined;
        return this.toCatalogEntry(Array.isArray(value) ? value[0] : undefined);
    }
    async findCatalogApp(token, agentId) {
        return await this.queryCatalog(token, `externalId eq '${this.manifestService.buildManifestId(agentId)}'`);
    }
    toCatalogEntry(entry) {
        const teamsAppId = (0, integration_helpers_1.stringProperty)(entry, 'id');
        if (!teamsAppId)
            return undefined;
        const definitions = (0, is_record_1.isRecord)(entry) ? entry.appDefinitions : undefined;
        const latest = Array.isArray(definitions) ? definitions[definitions.length - 1] : undefined;
        return {
            teamsAppId,
            publishingState: (0, integration_helpers_1.stringProperty)(latest, 'publishingState') ?? null,
        };
    }
    async readState(token, agentId) {
        const app = await this.findCatalogApp(token, agentId);
        if (!app) {
            return { status: 'unknown', teamsAppId: null };
        }
        switch (app.publishingState) {
            case 'published':
                return { status: 'published', teamsAppId: app.teamsAppId };
            case 'submitted':
                return { status: 'submitted', teamsAppId: app.teamsAppId };
            case 'rejected':
                return { status: 'rejected', teamsAppId: app.teamsAppId };
            default:
                return { status: 'unknown', teamsAppId: app.teamsAppId };
        }
    }
    isPermissionRefusal(statusCode, code) {
        return statusCode === 403 || code === 'Forbidden' || code === 'UnauthorizedAccessException';
    }
    publishError(statusCode, body) {
        if (statusCode === 409 || (0, teams_graph_service_1.graphErrorCode)(body) === 'Conflict') {
            return new n8n_workflow_1.UserError('An app with this name is already in the organization catalog.');
        }
        if (this.isPermissionRefusal(statusCode, (0, teams_graph_service_1.graphErrorCode)(body))) {
            return new n8n_workflow_1.UserError('This account may not put the app in the organization catalog. A Teams administrator has to publish it.');
        }
        return new n8n_workflow_1.OperationalError('Microsoft would not accept the Teams app. Try again in a few minutes.');
    }
    async graphToken(options) {
        const credential = await this.managerCredential(options);
        return await this.tokens.acquire(credential, teams_manager_token_service_1.GRAPH_RESOURCE);
    }
    async managerCredential(options) {
        const credential = await this.credentialsFinderService.findCredentialForUser(options.managerCredentialId, options.user, ['credential:use']);
        if (!credential || credential.type !== teams_managed_setup_service_1.TEAMS_MANAGER_CREDENTIAL_TYPE) {
            throw new errors_1.BadRequestError('Sign in with Microsoft before publishing the Teams app.');
        }
        return credential;
    }
};
exports.TeamsCatalogService = TeamsCatalogService;
exports.TeamsCatalogService = TeamsCatalogService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [teams_graph_service_1.TeamsGraphService, teams_manager_token_service_1.TeamsManagerTokenService, teams_setup_service_1.TeamsSetupService, teams_manifest_service_1.TeamsManifestService, backend_services_1.CredentialsFinderService, credentials_service_1.CredentialsService, backend_common_1.Logger, teams_credential_notes_service_1.TeamsCredentialNotesService])
], TeamsCatalogService);
//# sourceMappingURL=teams-catalog.service.js.map