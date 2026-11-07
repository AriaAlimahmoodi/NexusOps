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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialsPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const decorators_1 = require("@n8n/decorators");
const permissions_1 = require("@n8n/permissions");
const credential_descriptions_service_1 = require("../../../credentials/credential-descriptions.service");
const external_secrets_utils_1 = require("../../../credentials/external-secrets.utils");
const credentials_overwrites_1 = require("../../../credentials-overwrites");
const credential_types_1 = require("../../../credential-types");
const credentials_service_1 = require("../../../credentials/credentials.service");
const credentials_service_ee_1 = require("../../../credentials/credentials.service.ee");
const credentials_helper_1 = require("../../../credentials-helper");
const credential_not_found_error_1 = require("../../../errors/credential-not-found.error");
const errors_1 = require("@n8n/errors");
const credentials_utils_1 = require("../../../public-api/v1/handlers/credentials/credentials.utils");
const pagination_service_1 = require("../../../public-api/v1/shared/services/pagination.service");
function toCredentialPublicDto(credential, includeDescription) {
    return {
        id: credential.id,
        name: credential.name,
        ...(includeDescription && { description: credential.description ?? null }),
        type: credential.type,
        isManaged: credential.isManaged,
        isGlobal: credential.isGlobal,
        isResolvable: credential.isResolvable,
        resolvableAllowFallback: credential.resolvableAllowFallback ?? false,
        resolverId: credential.resolverId ?? null,
        createdAt: credential.createdAt.toISOString(),
        updatedAt: credential.updatedAt.toISOString(),
    };
}
function toDeleteCredentialPublicDto(credential, includeDescription) {
    return {
        ...toCredentialPublicDto(credential, includeDescription),
        usageScope: credential.usageScope,
    };
}
function toCredentialListItem(credential) {
    return {
        id: credential.id,
        name: credential.name,
        type: credential.type,
        createdAt: credential.createdAt.toISOString(),
        updatedAt: credential.updatedAt.toISOString(),
        shared: (0, credentials_utils_1.buildSharedForCredential)(credential).map((entry) => ({
            ...entry,
            createdAt: entry.createdAt.toISOString(),
            updatedAt: entry.updatedAt.toISOString(),
        })),
    };
}
let CredentialsPublicController = class CredentialsPublicController {
    constructor(credentialsService, credentialsFinderService, credentialTypes, credentialsHelper, licenseState, eventService, enterpriseCredentialsService, credentialDescriptions, credentialsOverwrites) {
        this.credentialsService = credentialsService;
        this.credentialsFinderService = credentialsFinderService;
        this.credentialTypes = credentialTypes;
        this.credentialsHelper = credentialsHelper;
        this.licenseState = licenseState;
        this.eventService = eventService;
        this.enterpriseCredentialsService = enterpriseCredentialsService;
        this.credentialDescriptions = credentialDescriptions;
        this.credentialsOverwrites = credentialsOverwrites;
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
    async getCredentials(req, _res, query) {
        const { offset, limit } = (0, pagination_service_1.resolveOffsetPagination)(query);
        const { credentials, count } = await this.credentialsService.getManyAndCount(req.user, {
            listQueryOptions: {
                take: limit,
                skip: offset,
                sortBy: 'createdAt:desc',
                relations: ['shared', 'shared.project'],
            },
        });
        return {
            data: credentials.map((credential) => toCredentialListItem(credential)),
            nextCursor: (0, pagination_service_1.encodeNextCursor)({
                offset,
                limit,
                numberOfTotalRecords: count,
            }),
        };
    }
    async getCredential(_req, _res, credentialId) {
        const credential = await this.credentialsFinderService.findById(credentialId);
        if (!credential) {
            throw new errors_1.NotFoundError('Credential not found');
        }
        return toCredentialPublicDto(credential, await this.credentialDescriptions.isEnabled());
    }
    async createCredential(req, _res, body) {
        this.assertKnownCredentialType(body.type);
        (0, credentials_utils_1.validateCredentialData)(this.credentialsHelper, body.type, body.data);
        const credential = await this.credentialsService.createUnmanagedCredential({
            type: body.type,
            name: body.name,
            description: body.description,
            data: body.data,
            projectId: body.projectId,
            isResolvable: body.isResolvable,
            usageScope: 'project',
        }, req.user, { id: body.id });
        const project = await this.credentialsService.findCredentialOwningProject(credential.id);
        const includeDescription = await this.credentialDescriptions.isEnabled();
        this.eventService.emit('credentials-created', {
            user: req.user,
            credentialType: credential.type,
            credentialId: credential.id,
            credentialName: credential.name,
            ...(includeDescription && {
                credentialDescriptionLength: credential.description?.length ?? 0,
            }),
            publicApi: true,
            projectId: project?.id,
            projectType: project?.type,
            isDynamic: credential.isResolvable ?? false,
            jweEnabled: body.data.jweEnabled === true,
        });
        return toCredentialPublicDto(credential, includeDescription);
    }
    async updateCredential(req, _res, credentialId, body) {
        if (body.type !== undefined) {
            this.assertKnownCredentialType(body.type);
        }
        const existingCredential = await this.credentialsFinderService.findById(credentialId, {
            includeSharedProject: true,
        });
        if (!existingCredential) {
            throw new errors_1.NotFoundError('Credential not found');
        }
        (0, credentials_utils_1.assertValidUpdateProperties)(this.credentialsHelper, existingCredential, body);
        if (existingCredential.isManaged) {
            throw new errors_1.BadRequestError('Managed credentials cannot be updated.');
        }
        if (body.isGlobal !== undefined && body.isGlobal !== existingCredential.isGlobal) {
            if (!this.licenseState.isSharingLicensed()) {
                throw new errors_1.ForbiddenError('You are not licensed for sharing credentials');
            }
            const canShareGlobally = (0, permissions_1.hasGlobalScope)(req.user, 'credential:shareGlobally');
            if (!canShareGlobally) {
                throw new errors_1.ForbiddenError('You do not have permission to change global sharing for credentials');
            }
        }
        if (body.isResolvable !== undefined &&
            body.isResolvable !== Boolean(existingCredential.isResolvable)) {
            const ownerSharing = existingCredential.shared?.find((sharing) => sharing.role === 'credential:owner');
            if (body.isResolvable) {
                this.credentialsService.ensureEndUserCredentialAllowedInProject(ownerSharing?.project);
            }
            await this.credentialsService.ensureCanManageEndUserCredential(req.user, ownerSharing?.projectId);
        }
        const isChangingAuthType = body.type !== undefined && body.type !== existingCredential.type;
        const isTogglingToPrivate = Boolean(body.isResolvable) && !existingCredential.isResolvable;
        const { updatePayload, decryptedDataForDeps } = await this.buildUpdatePayload({
            user: req.user,
            existingCredential,
            body,
            clearOauthTokenData: isTogglingToPrivate || isChangingAuthType,
        });
        const updatedCredential = await this.credentialsService.update(credentialId, updatePayload, { kind: 'user', user: req.user }, decryptedDataForDeps);
        if (!updatedCredential) {
            throw new errors_1.NotFoundError('Credential not found');
        }
        const includeDescription = await this.credentialDescriptions.isEnabled();
        const credentialData = decryptedDataForDeps ?? (await this.credentialsService.decrypt(existingCredential, true));
        this.eventService.emit('credentials-updated', {
            user: req.user,
            credentialType: updatedCredential.type,
            credentialId: updatedCredential.id,
            credentialName: updatedCredential.name,
            ...(includeDescription && {
                credentialDescriptionLength: updatedCredential.description?.length ?? 0,
            }),
            isDynamic: updatedCredential.isResolvable ?? false,
            usesExternalSecrets: (0, external_secrets_utils_1.getExternalSecretExpressionPaths)(credentialData).length > 0,
            jweEnabled: credentialData.jweEnabled === true,
            supportsManagedAuth: this.credentialsOverwrites.supportsManagedAuth(updatedCredential.type),
            usesManagedAuth: this.credentialsOverwrites.usesManagedAuth(updatedCredential.type, credentialData),
        });
        return toCredentialPublicDto(updatedCredential, includeDescription);
    }
    assertKnownCredentialType(type) {
        try {
            this.credentialTypes.getByName(type);
        }
        catch {
            throw new errors_1.BadRequestError('req.body.type is not a known type');
        }
    }
    async buildUpdatePayload({ user, existingCredential, body, clearOauthTokenData, }) {
        let updatePayload;
        let decryptedDataForDeps;
        if (body.data) {
            const preparedCredentialData = await this.credentialsService.prepareUpdateData(user, {
                name: body.name ?? existingCredential.name,
                type: body.type ?? existingCredential.type,
                data: body.data,
            }, existingCredential, {
                dataMerge: body.isPartialData ? 'partial' : 'replace',
                clearOauthTokenData,
            });
            decryptedDataForDeps =
                preparedCredentialData.data;
            updatePayload = await this.credentialsService.createEncryptedData({
                id: existingCredential.id,
                name: preparedCredentialData.name,
                type: preparedCredentialData.type,
                data: decryptedDataForDeps,
            });
        }
        else {
            updatePayload = {
                id: existingCredential.id,
                name: body.name ?? existingCredential.name,
                type: body.type ?? existingCredential.type,
                data: existingCredential.data,
                createdAt: existingCredential.createdAt,
                updatedAt: existingCredential.updatedAt,
            };
        }
        if (body.isGlobal !== undefined) {
            updatePayload.isGlobal = body.isGlobal;
        }
        if (body.isResolvable !== undefined) {
            updatePayload.isResolvable = body.isResolvable;
        }
        if (body.description !== undefined) {
            updatePayload.description = body.description;
        }
        updatePayload.updatedAt = new Date();
        return { updatePayload, decryptedDataForDeps };
    }
    async deleteCredential(req, _res, credentialId) {
        const credential = await this.credentialsFinderService.findCredentialForUser(credentialId, req.user, ['credential:delete']);
        if (!credential) {
            throw new errors_1.NotFoundError('Not Found');
        }
        await this.credentialsService.delete(req.user, credentialId);
        return toDeleteCredentialPublicDto(credential, await this.credentialDescriptions.isEnabled());
    }
    async transferCredential(req, _res, credentialId, body) {
        await this.enterpriseCredentialsService.transferOne(req.user, credentialId, body.destinationProjectId);
    }
    async testCredential(req, _res, credentialId) {
        try {
            return await this.credentialsService.testById(req.user, credentialId);
        }
        catch (error) {
            if (error instanceof credential_not_found_error_1.CredentialNotFoundError) {
                throw new errors_1.NotFoundError(error.message);
            }
            throw error;
        }
    }
    async getCredentialType(_req, _res, credentialTypeName) {
        try {
            this.credentialTypes.getByName(credentialTypeName);
        }
        catch {
            throw new errors_1.NotFoundError('Not Found');
        }
        const properties = this.credentialsHelper
            .getCredentialsProperties(credentialTypeName)
            .filter((property) => property.type !== 'hidden');
        return (0, credentials_utils_1.toJsonSchema)(properties);
    }
};
exports.CredentialsPublicController = CredentialsPublicController;
__decorate([
    (0, decorators_1.Middleware)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Function]),
    __metadata("design:returntype", Promise)
], CredentialsPublicController.prototype, "stripDisabledDescription", null);
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ApiKeyScope)('credential:list'),
    (0, decorators_1.ApiSummary)('List credentials'),
    (0, decorators_1.ApiDescription)('Retrieve all credentials from your instance. Only available for the instance owner ' +
        'and admin. Credential data (secrets) is not included.'),
    (0, decorators_1.ApiTags)(['Credential']),
    (0, decorators_1.ApiResponse)(200, api_types_1.CredentialListPublicDto),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListCredentialsQueryDto]),
    __metadata("design:returntype", Promise)
], CredentialsPublicController.prototype, "getCredentials", null);
__decorate([
    (0, decorators_1.Get)('/:credentialId'),
    (0, decorators_1.ApiKeyScope)('credential:read'),
    (0, decorators_1.ProjectScope)('credential:read'),
    (0, decorators_1.ApiSummary)('Get credential by ID'),
    (0, decorators_1.ApiDescription)('Retrieves a credential by ID. Credential data (secrets) is not included.'),
    (0, decorators_1.ApiTags)(['Credential']),
    (0, decorators_1.ApiResponse)(200, api_types_1.CredentialPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('credentialId', api_types_1.credentialIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CredentialsPublicController.prototype, "getCredential", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.ApiKeyScope)('credential:create'),
    (0, decorators_1.ApiSummary)('Create a credential'),
    (0, decorators_1.ApiDescription)('Creates a credential that can be used by nodes of the specified type.'),
    (0, decorators_1.ApiTags)(['Credential']),
    (0, decorators_1.ApiResponse)(200, api_types_1.CredentialPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateCredentialPublicDto]),
    __metadata("design:returntype", Promise)
], CredentialsPublicController.prototype, "createCredential", null);
__decorate([
    (0, decorators_1.Patch)('/:credentialId'),
    (0, decorators_1.ApiKeyScope)('credential:update'),
    (0, decorators_1.ProjectScope)('credential:update'),
    (0, decorators_1.ApiSummary)('Update credential by ID'),
    (0, decorators_1.ApiDescription)('Updates an existing credential. You must be the owner of the credential.'),
    (0, decorators_1.ApiTags)(['Credential']),
    (0, decorators_1.ApiResponse)(200, api_types_1.CredentialPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('credentialId', api_types_1.credentialIdParamSchema)),
    __param(3, (0, decorators_1.Body)({ required: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateCredentialPublicDto]),
    __metadata("design:returntype", Promise)
], CredentialsPublicController.prototype, "updateCredential", null);
__decorate([
    (0, decorators_1.Delete)('/:credentialId'),
    (0, decorators_1.ApiKeyScope)('credential:delete'),
    (0, decorators_1.ProjectScope)('credential:delete'),
    (0, decorators_1.ApiSummary)('Delete credential by ID'),
    (0, decorators_1.ApiDescription)('Deletes a credential from your instance. You must be the owner of the credential.'),
    (0, decorators_1.ApiTags)(['Credential']),
    (0, decorators_1.ApiResponse)(200, api_types_1.DeleteCredentialPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('credentialId', api_types_1.credentialIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CredentialsPublicController.prototype, "deleteCredential", null);
__decorate([
    (0, decorators_1.Put)('/:credentialId/transfer'),
    (0, decorators_1.ApiKeyScope)('credential:move'),
    (0, decorators_1.ProjectScope)('credential:move'),
    (0, decorators_1.ApiSummary)('Transfer a credential to another project.'),
    (0, decorators_1.ApiDescription)('Transfer a credential to another project.'),
    (0, decorators_1.ApiTags)(['Credential']),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('credentialId', api_types_1.credentialIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.TransferCredentialPublicDto]),
    __metadata("design:returntype", Promise)
], CredentialsPublicController.prototype, "transferCredential", null);
__decorate([
    (0, decorators_1.Post)('/:credentialId/test'),
    (0, decorators_1.ApiKeyScope)('credential:read'),
    (0, decorators_1.ProjectScope)('credential:read'),
    (0, decorators_1.ApiSummary)('Test credential by ID'),
    (0, decorators_1.ApiDescription)('Tests a credential by ID using the stored credential data.'),
    (0, decorators_1.ApiTags)(['Credential']),
    (0, decorators_1.ApiResponse)(200, api_types_1.CredentialTestPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('credentialId', api_types_1.credentialIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CredentialsPublicController.prototype, "testCredential", null);
__decorate([
    (0, decorators_1.Get)('/schema/:credentialTypeName'),
    (0, decorators_1.ApiSummary)('Show credential data schema'),
    (0, decorators_1.ApiTags)(['Credential']),
    (0, decorators_1.ApiResponse)(200, api_types_1.CredentialSchemaPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('credentialTypeName', api_types_1.credentialTypeNameParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CredentialsPublicController.prototype, "getCredentialType", null);
exports.CredentialsPublicController = CredentialsPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/credentials'),
    __metadata("design:paramtypes", [credentials_service_1.CredentialsService, backend_services_1.CredentialsFinderService, credential_types_1.CredentialTypes, credentials_helper_1.CredentialsHelper, backend_common_1.LicenseState, backend_services_1.EventService, credentials_service_ee_1.EnterpriseCredentialsService, credential_descriptions_service_1.CredentialDescriptionsService, credentials_overwrites_1.CredentialsOverwrites])
], CredentialsPublicController);
//# sourceMappingURL=credentials.public.controller.js.map