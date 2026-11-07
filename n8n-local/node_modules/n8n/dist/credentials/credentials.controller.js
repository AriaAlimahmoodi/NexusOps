"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialsController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const zod_1 = require("zod");
const credential_connection_status_proxy_1 = require("./credential-connection-status-proxy");
const credential_descriptions_service_1 = require("./credential-descriptions.service");
const credentials_service_1 = require("./credentials.service");
const credentials_service_ee_1 = require("./credentials.service.ee");
const external_secrets_utils_1 = require("./external-secrets.utils");
const credentials_overwrites_1 = require("../credentials-overwrites");
const credential_not_found_error_1 = require("../errors/credential-not-found.error");
const errors_1 = require("@n8n/errors");
const middlewares_1 = require("../middlewares");
const check_access_1 = require("../permissions.ee/check-access");
const naming_service_1 = require("../services/naming.service");
const email_1 = require("../user-management/email");
const utils = __importStar(require("../utils"));
let CredentialsController = class CredentialsController {
    constructor(globalConfig, credentialsService, enterpriseCredentialsService, namingService, licenseState, logger, userManagementMailer, sharedCredentialsRepository, projectRelationRepository, eventService, credentialsFinderService, connectionStatusProxy, credentialsOverwrites, credentialDescriptions) {
        this.globalConfig = globalConfig;
        this.credentialsService = credentialsService;
        this.enterpriseCredentialsService = enterpriseCredentialsService;
        this.namingService = namingService;
        this.licenseState = licenseState;
        this.logger = logger;
        this.userManagementMailer = userManagementMailer;
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.projectRelationRepository = projectRelationRepository;
        this.eventService = eventService;
        this.credentialsFinderService = credentialsFinderService;
        this.connectionStatusProxy = connectionStatusProxy;
        this.credentialsOverwrites = credentialsOverwrites;
        this.credentialDescriptions = credentialDescriptions;
    }
    async stripDisabledDescription(req, _res, next) {
        try {
            if (req.body)
                await this.credentialDescriptions.stripIfDisabled(req.body);
            next();
        }
        catch (error) {
            next(error);
        }
    }
    async getMany(req, _res, query) {
        const credentials = await this.credentialsService.getMany(req.user, {
            listQueryOptions: req.listQueryOptions,
            includeScopes: query.includeScopes,
            includeData: query.includeData,
            onlySharedWithMe: query.onlySharedWithMe,
            includeGlobal: query.includeGlobal,
            filters: {
                externalSecretsStore: query.externalSecretsStore,
            },
        });
        credentials.forEach((c) => {
            delete c.shared;
        });
        return credentials;
    }
    async getProjectCredentials(req) {
        const { forAgent, ...scope } = zod_1.z
            .union([zod_1.z.object({ workflowId: zod_1.z.string() }), zod_1.z.object({ projectId: zod_1.z.string() })])
            .and(zod_1.z.object({ forAgent: zod_1.z.enum(['true', 'false']).optional() }))
            .parse(req.query);
        return await this.credentialsService.getCredentialsAUserCanUseInAWorkflow(req.user, {
            ...scope,
            excludePersonalRoute: forAgent === 'true',
        });
    }
    async generateUniqueName(_req, _res, query) {
        const requestedName = query.name ?? this.globalConfig.credentials.defaultName;
        return {
            name: await this.namingService.getUniqueCredentialName(requestedName),
        };
    }
    async getOne(req, _res, credentialId, query) {
        const { shared, ...credential } = this.licenseState.isSharingLicensed()
            ? await this.enterpriseCredentialsService.getOneForUser(req.user, credentialId, query.includeData)
            : await this.credentialsService.getOne(req.user, credentialId, query.includeData, {
                includeInstanceCredentials: true,
            });
        const scopes = await this.credentialsService.getCredentialScopes(req.user, req.params.credentialId);
        await this.credentialDescriptions.stripIfDisabled(credential);
        return { ...credential, scopes };
    }
    async testCredentials(req, _res, payload) {
        try {
            return await this.credentialsService.testWithCredentials(req.user, {
                ...payload.credentials,
                data: payload.credentials.data,
            });
        }
        catch (error) {
            if (error instanceof credential_not_found_error_1.CredentialNotFoundError) {
                throw new errors_1.ForbiddenError();
            }
            throw error;
        }
    }
    async probeCredentials(req, _res, credentialId) {
        try {
            const result = await this.credentialsService.probeById(req.user, credentialId);
            this.eventService.emit('credentials-probed', {
                user: req.user,
                credentialId,
                outcome: result.outcome,
            });
            return result;
        }
        catch (error) {
            if (error instanceof credential_not_found_error_1.CredentialNotFoundError) {
                throw new errors_1.ForbiddenError();
            }
            throw error;
        }
    }
    async createCredentials(req, _, payload) {
        const newCredential = await this.credentialsService.createUnmanagedCredential(payload, req.user);
        const project = await this.sharedCredentialsRepository.findCredentialOwningProject(newCredential.id);
        this.eventService.emit('credentials-created', {
            user: req.user,
            credentialType: newCredential.type,
            credentialId: newCredential.id,
            credentialName: newCredential.name,
            ...((await this.credentialDescriptions.isEnabled()) && {
                credentialDescriptionLength: newCredential.description?.length ?? 0,
            }),
            publicApi: false,
            projectId: project?.id,
            projectType: project?.type,
            uiContext: payload.uiContext,
            isDynamic: newCredential.isResolvable ?? false,
            usesExternalSecrets: (0, external_secrets_utils_1.getExternalSecretExpressionPaths)(payload.data).length > 0,
            jweEnabled: payload.data.jweEnabled === true,
            supportsManagedAuth: this.credentialsOverwrites.supportsManagedAuth(newCredential.type),
            usesManagedAuth: this.credentialsOverwrites.usesManagedAuth(newCredential.type, payload.data),
        });
        if (newCredential.isResolvable) {
            this.eventService.emit('private-credential-created', {
                user: req.user,
                credentialType: newCredential.type,
                credentialId: newCredential.id,
                projectId: project?.id,
                projectType: project?.type,
            });
        }
        return newCredential;
    }
    async updateCredentials(req) {
        const { body, user, params: { credentialId }, } = req;
        const credential = await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:update'], { includeInstanceCredentials: true });
        if (!credential) {
            this.logger.info('Attempt to update credential blocked due to lack of permissions', {
                credentialId,
                userId: user.id,
            });
            throw new errors_1.NotFoundError('Credential to be updated not found. You can only update credentials owned by you');
        }
        if (credential.isManaged) {
            throw new errors_1.BadRequestError('Managed credentials cannot be updated');
        }
        const isChangingAuthType = body.type !== undefined && body.type !== credential.type;
        if (credential.usageScope === 'instance' && isChangingAuthType) {
            throw new errors_1.BadRequestError('Provider connection type cannot be changed. Create a new connection instead.');
        }
        if (credential.usageScope === 'instance' &&
            (body.isGlobal === true || body.isResolvable === true)) {
            throw new errors_1.BadRequestError('Provider connections cannot be globally shared or converted to end-user credentials');
        }
        delete body.data?.oauthTokenData;
        const isTogglingToPrivate = body.isResolvable === true && credential.isResolvable === false;
        const isTogglingToStatic = body.isResolvable === false && credential.isResolvable === true;
        if (isTogglingToPrivate || isTogglingToStatic) {
            const owningProject = await this.sharedCredentialsRepository.findCredentialOwningProject(credentialId);
            if (isTogglingToPrivate) {
                this.credentialsService.ensureEndUserCredentialAllowedInProject(owningProject);
            }
            await this.credentialsService.ensureCanManageEndUserCredential(req.user, owningProject?.id);
        }
        const preparedCredentialData = await this.credentialsService.prepareUpdateData(req.user, req.body, credential, { clearOauthTokenData: isTogglingToPrivate || isChangingAuthType });
        const newCredentialData = await this.credentialsService.createEncryptedData({
            id: credential.id,
            name: preparedCredentialData.name,
            type: preparedCredentialData.type,
            data: preparedCredentialData.data,
        });
        if (preparedCredentialData.description !== undefined) {
            newCredentialData.description = preparedCredentialData.description;
        }
        const isGlobal = body.isGlobal;
        if (isGlobal !== undefined && isGlobal !== credential.isGlobal) {
            if (!this.licenseState.isSharingLicensed()) {
                throw new errors_1.ForbiddenError('You are not licensed for sharing credentials');
            }
            const canShareGlobally = (0, permissions_1.hasGlobalScope)(req.user, 'credential:shareGlobally');
            if (!canShareGlobally) {
                throw new errors_1.ForbiddenError('You do not have permission to change global sharing for credentials');
            }
            newCredentialData.isGlobal = isGlobal;
        }
        newCredentialData.isResolvable = body.isResolvable ?? credential.isResolvable;
        let sharedFieldsChanged = false;
        if (body.data && !isTogglingToStatic && newCredentialData.isResolvable) {
            const changedFields = await this.credentialsService.getChangedSharedFields(credential, preparedCredentialData.data);
            sharedFieldsChanged = changedFields.length > 0;
        }
        const responseData = await this.credentialsService.update(credentialId, newCredentialData, { kind: 'user', user: req.user }, body.data
            ? preparedCredentialData.data
            : undefined, {
            deleteUserEntries: isTogglingToStatic || sharedFieldsChanged,
            instanceCredential: credential.usageScope === 'instance' ? credential : undefined,
            user: req.user,
        });
        if (responseData === null) {
            throw new errors_1.NotFoundError(`Credential ID "${credentialId}" could not be found to be updated.`);
        }
        const { data, shared, ...rest } = responseData;
        this.logger.debug('Credential updated', { credentialId });
        const updatedData = preparedCredentialData.data;
        this.eventService.emit('credentials-updated', {
            user: req.user,
            credentialType: credential.type,
            credentialId: credential.id,
            credentialName: responseData.name,
            ...((await this.credentialDescriptions.isEnabled()) && {
                credentialDescriptionLength: responseData.description?.length ?? 0,
            }),
            isDynamic: newCredentialData.isResolvable ?? false,
            usesExternalSecrets: (0, external_secrets_utils_1.getExternalSecretExpressionPaths)(preparedCredentialData.data).length > 0,
            jweEnabled: updatedData.jweEnabled === true,
            supportsManagedAuth: this.credentialsOverwrites.supportsManagedAuth(credential.type),
            usesManagedAuth: this.credentialsOverwrites.usesManagedAuth(credential.type, updatedData),
        });
        const wasResolvable = Boolean(credential.isResolvable);
        const willBeResolvable = Boolean(newCredentialData.isResolvable);
        if (!wasResolvable && willBeResolvable) {
            this.eventService.emit('private-credential-toggled-to-private', {
                user: req.user,
                credentialType: credential.type,
                credentialId: credential.id,
            });
        }
        else if (wasResolvable && !willBeResolvable) {
            this.eventService.emit('private-credential-toggled-to-static', {
                user: req.user,
                credentialType: credential.type,
                credentialId: credential.id,
            });
        }
        else if (sharedFieldsChanged) {
            this.eventService.emit('private-credential-connections-cleared', {
                user: req.user,
                credentialType: credential.type,
                credentialId: credential.id,
            });
        }
        const scopes = await this.credentialsService.getCredentialScopes(req.user, credential.id);
        return { ...rest, scopes };
    }
    async disconnectOauthToken(req, _res, credentialId) {
        const credential = await this.credentialsFinderService.findCredentialForUser(credentialId, req.user, ['credential:update']);
        if (!credential) {
            throw new errors_1.NotFoundError('Credential not found. You can only modify credentials you have access to.');
        }
        if (credential.isManaged) {
            throw new errors_1.BadRequestError('Managed credentials cannot be updated');
        }
        if (!this.credentialsService.isOAuthCredentialType(credential.type)) {
            throw new errors_1.BadRequestError('Only OAuth credentials can be disconnected');
        }
        await this.credentialsService.clearOauthTokenData(credential, { kind: 'user', user: req.user });
        this.logger.debug('Credential OAuth token cleared', { credentialId });
        return { success: true };
    }
    async deleteCredentials(req) {
        const { credentialId } = req.params;
        const credential = await this.credentialsFinderService.findCredentialForUser(credentialId, req.user, ['credential:delete'], { includeInstanceCredentials: true });
        if (!credential) {
            this.logger.info('Attempt to delete credential blocked due to lack of permissions', {
                credentialId,
                userId: req.user.id,
            });
            throw new errors_1.NotFoundError('Credential to be deleted not found. You can only removed credentials owned by you');
        }
        await this.credentialsService.delete(req.user, credential.id, {
            includeInstanceCredentials: true,
        });
        return true;
    }
    async shareCredentials(req) {
        const { credentialId } = req.params;
        const { shareWithIds } = req.body;
        if (!Array.isArray(shareWithIds) ||
            !shareWithIds.every((userId) => typeof userId === 'string')) {
            throw new errors_1.BadRequestError('Bad request');
        }
        const credential = await this.credentialsFinderService.findCredentialForUser(credentialId, req.user, ['credential:read'], { visibilityOnly: true });
        if (!credential) {
            throw new errors_1.ForbiddenError();
        }
        const currentProjectIds = credential.shared
            .filter((sc) => sc.role === 'credential:user')
            .map((sc) => sc.projectId);
        const newProjectIds = shareWithIds;
        const toShare = utils.rightDiff([currentProjectIds, (id) => id], [newProjectIds, (id) => id]);
        const toUnshare = utils.rightDiff([newProjectIds, (id) => id], [currentProjectIds, (id) => id]);
        if (toShare.length > 0) {
            const canShare = await (0, check_access_1.userHasScopes)(req.user, ['credential:share'], false, {
                credentialId,
            });
            if (!canShare) {
                throw new errors_1.ForbiddenError();
            }
        }
        if (toUnshare.length > 0) {
            const canUnshare = await (0, check_access_1.userHasScopes)(req.user, ['credential:unshare'], false, {
                credentialId,
            });
            if (!canUnshare) {
                throw new errors_1.ForbiddenError();
            }
        }
        let amountRemoved = null;
        let newShareeIds = [];
        const { manager: dbManager } = this.sharedCredentialsRepository;
        await dbManager.transaction(async (trx) => {
            const deleteResult = await trx.delete(db_1.SharedCredentials, {
                credentialsId: credentialId,
                projectId: (0, typeorm_1.In)(toUnshare),
            });
            await this.enterpriseCredentialsService.shareWithProjects(req.user, credential.id, toShare, trx);
            if (deleteResult.affected) {
                amountRemoved = deleteResult.affected;
                await this.connectionStatusProxy.cleanupOrphanedEntriesForProjects(credentialId, toUnshare, trx);
            }
            newShareeIds = toShare;
        });
        this.eventService.emit('credentials-shared', {
            user: req.user,
            credentialType: credential.type,
            credentialId: credential.id,
            userIdSharer: req.user.id,
            userIdsShareesAdded: newShareeIds,
            shareesRemoved: amountRemoved,
        });
        const projectsRelations = await this.projectRelationRepository.findBy({
            projectId: (0, typeorm_1.In)(newShareeIds),
            role: { slug: permissions_1.PROJECT_OWNER_ROLE_SLUG },
        });
        await this.userManagementMailer.notifyCredentialsShared({
            sharer: req.user,
            newShareeIds: projectsRelations.map((pr) => pr.userId),
            credentialsName: credential.name,
        });
    }
    async transfer(req) {
        const body = zod_1.z.object({ destinationProjectId: zod_1.z.string() }).parse(req.body);
        return await this.enterpriseCredentialsService.transferOne(req.user, req.params.credentialId, body.destinationProjectId);
    }
};
exports.CredentialsController = CredentialsController;
__decorate([
    (0, decorators_1.Middleware)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Function]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "stripDisabledDescription", null);
__decorate([
    (0, decorators_1.Get)('/', { middlewares: middlewares_1.listQueryMiddleware }),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CredentialsGetManyRequestQuery]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "getMany", null);
__decorate([
    (0, decorators_1.Get)('/for-workflow'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "getProjectCredentials", null);
__decorate([
    (0, decorators_1.Get)('/new'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.GenerateCredentialNameRequestQuery]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "generateUniqueName", null);
__decorate([
    (0, decorators_1.Get)('/:credentialId'),
    (0, decorators_1.ProjectScope)('credential:read'),
    __param(2, (0, decorators_1.Param)('credentialId')),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.CredentialsGetOneRequestQuery]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "getOne", null);
__decorate([
    (0, decorators_1.Post)('/test'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.TestCredentialRequestDto]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "testCredentials", null);
__decorate([
    (0, decorators_1.Post)('/:credentialId/probe'),
    (0, decorators_1.ProjectScope)('credential:read'),
    __param(2, (0, decorators_1.Param)('credentialId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "probeCredentials", null);
__decorate([
    (0, decorators_1.Post)('/'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateCredentialDto]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "createCredentials", null);
__decorate([
    (0, decorators_1.Patch)('/:credentialId'),
    (0, decorators_1.ProjectScope)('credential:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "updateCredentials", null);
__decorate([
    (0, decorators_1.Delete)('/:credentialId/oauth-token'),
    (0, decorators_1.ProjectScope)('credential:update'),
    __param(2, (0, decorators_1.Param)('credentialId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "disconnectOauthToken", null);
__decorate([
    (0, decorators_1.Delete)('/:credentialId'),
    (0, decorators_1.ProjectScope)('credential:delete'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "deleteCredentials", null);
__decorate([
    (0, decorators_1.Licensed)('feat:sharing'),
    (0, decorators_1.Put)('/:credentialId/share'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "shareCredentials", null);
__decorate([
    (0, decorators_1.Put)('/:credentialId/transfer'),
    (0, decorators_1.ProjectScope)('credential:move'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "transfer", null);
exports.CredentialsController = CredentialsController = __decorate([
    (0, decorators_1.RestController)('/credentials'),
    __metadata("design:paramtypes", [config_1.GlobalConfig, credentials_service_1.CredentialsService, credentials_service_ee_1.EnterpriseCredentialsService, naming_service_1.NamingService, backend_common_1.LicenseState, backend_common_1.Logger, email_1.UserManagementMailer, db_1.SharedCredentialsRepository, db_1.ProjectRelationRepository, backend_services_1.EventService, backend_services_1.CredentialsFinderService, credential_connection_status_proxy_1.CredentialConnectionStatusProxy, credentials_overwrites_1.CredentialsOverwrites, credential_descriptions_service_1.CredentialDescriptionsService])
], CredentialsController);
//# sourceMappingURL=credentials.controller.js.map