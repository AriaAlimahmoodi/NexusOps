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
exports.CredentialResolversController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const config_redaction_1 = require("./config-redaction");
const credential_resolution_error_1 = require("./errors/credential-resolution.error");
const credential_resolver_not_found_error_1 = require("./errors/credential-resolver-not-found.error");
const system_resolver_modification_error_1 = require("./errors/system-resolver-modification.error");
const credential_resolver_service_1 = require("./services/credential-resolver.service");
let CredentialResolversController = class CredentialResolversController {
    constructor(service) {
        this.service = service;
    }
    redactSecrets(resolver) {
        const type = this.service.getAvailableTypes().find((t) => t.metadata.name === resolver.type);
        if (!type) {
            const { decryptedConfig: _drop, ...rest } = resolver;
            return { ...rest, config: '' };
        }
        const secretFields = (0, config_redaction_1.collectSecretFieldNames)(type.metadata.options);
        return {
            ...resolver,
            config: '',
            decryptedConfig: (0, config_redaction_1.redactSecretConfig)(resolver.decryptedConfig, secretFields),
        };
    }
    async listResolvers(_req, _res, query) {
        try {
            const rows = query.includeSystem
                ? await this.service.findAll()
                : await this.service.findAllPublic();
            const resolvers = api_types_1.credentialResolversSchema.parse(rows);
            return resolvers.map(({ decryptedConfig: _, ...rest }) => ({ ...rest, config: '' }));
        }
        catch (e) {
            if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            throw e;
        }
    }
    listResolverTypes(_req, _res) {
        try {
            const types = this.service.getAvailablePublicTypes();
            return api_types_1.credentialResolverTypesSchema.parse(types.map((t) => t.metadata));
        }
        catch (e) {
            if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            throw e;
        }
    }
    async createResolver(req, _res, dto) {
        try {
            const createdResolver = await this.service.create({
                name: dto.name,
                type: dto.type,
                config: dto.config,
                user: req.user,
            });
            return this.redactSecrets(api_types_1.credentialResolverSchema.parse(createdResolver));
        }
        catch (e) {
            if (e instanceof system_resolver_modification_error_1.SystemResolverModificationError) {
                throw new errors_1.BadRequestError(e.message);
            }
            if (e instanceof decorators_1.CredentialResolverValidationError) {
                throw new errors_1.BadRequestError(e.message);
            }
            if (e instanceof credential_resolution_error_1.CredentialResolutionError) {
                throw new errors_1.BadRequestError(e.message);
            }
            if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            throw e;
        }
    }
    async getAffectedWorkflows(_req, _res, id) {
        try {
            const workflows = await this.service.findAffectedWorkflows(id);
            return api_types_1.credentialResolverAffectedWorkflowsSchema.parse(workflows);
        }
        catch (e) {
            if (e instanceof credential_resolver_not_found_error_1.DynamicCredentialResolverNotFoundError) {
                throw new errors_1.NotFoundError(e.message);
            }
            if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            throw e;
        }
    }
    async getResolver(_req, _res, id) {
        try {
            return this.redactSecrets(api_types_1.credentialResolverSchema.parse(await this.service.findById(id)));
        }
        catch (e) {
            if (e instanceof credential_resolver_not_found_error_1.DynamicCredentialResolverNotFoundError) {
                throw new errors_1.NotFoundError(e.message);
            }
            if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            throw e;
        }
    }
    async updateResolver(req, _res, id, dto) {
        try {
            return this.redactSecrets(api_types_1.credentialResolverSchema.parse(await this.service.update(id, {
                type: dto.type,
                name: dto.name,
                config: dto.config,
                clearCredentials: dto.clearCredentials,
                user: req.user,
            })));
        }
        catch (e) {
            if (e instanceof credential_resolver_not_found_error_1.DynamicCredentialResolverNotFoundError) {
                throw new errors_1.NotFoundError(e.message);
            }
            if (e instanceof system_resolver_modification_error_1.SystemResolverModificationError) {
                throw new errors_1.BadRequestError(e.message);
            }
            if (e instanceof decorators_1.CredentialResolverValidationError) {
                throw new errors_1.BadRequestError(e.message);
            }
            if (e instanceof credential_resolution_error_1.CredentialResolutionError) {
                throw new errors_1.BadRequestError(e.message);
            }
            if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            throw e;
        }
    }
    async deleteResolver(_req, _res, id) {
        try {
            await this.service.delete(id);
            return { success: true };
        }
        catch (e) {
            if (e instanceof system_resolver_modification_error_1.SystemResolverModificationError) {
                throw new errors_1.BadRequestError(e.message);
            }
            if (e instanceof credential_resolver_not_found_error_1.DynamicCredentialResolverNotFoundError) {
                throw new errors_1.NotFoundError(e.message);
            }
            if (e instanceof Error) {
                throw new errors_1.InternalServerError(e.message, e);
            }
            throw e;
        }
    }
};
exports.CredentialResolversController = CredentialResolversController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.GlobalScope)('credentialResolver:list'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListCredentialResolversQueryDto]),
    __metadata("design:returntype", Promise)
], CredentialResolversController.prototype, "listResolvers", null);
__decorate([
    (0, decorators_1.Get)('/types'),
    (0, decorators_1.GlobalScope)('credentialResolver:list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Array)
], CredentialResolversController.prototype, "listResolverTypes", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.GlobalScope)('credentialResolver:create'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateCredentialResolverDto]),
    __metadata("design:returntype", Promise)
], CredentialResolversController.prototype, "createResolver", null);
__decorate([
    (0, decorators_1.Get)('/:id/workflows'),
    (0, decorators_1.GlobalScope)('credentialResolver:read'),
    __param(2, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CredentialResolversController.prototype, "getAffectedWorkflows", null);
__decorate([
    (0, decorators_1.Get)('/:id'),
    (0, decorators_1.GlobalScope)('credentialResolver:read'),
    __param(2, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CredentialResolversController.prototype, "getResolver", null);
__decorate([
    (0, decorators_1.Patch)('/:id'),
    (0, decorators_1.GlobalScope)('credentialResolver:update'),
    __param(2, (0, decorators_1.Param)('id')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateCredentialResolverDto]),
    __metadata("design:returntype", Promise)
], CredentialResolversController.prototype, "updateResolver", null);
__decorate([
    (0, decorators_1.Delete)('/:id'),
    (0, decorators_1.GlobalScope)('credentialResolver:delete'),
    __param(2, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CredentialResolversController.prototype, "deleteResolver", null);
exports.CredentialResolversController = CredentialResolversController = __decorate([
    (0, decorators_1.RestController)('/credential-resolvers'),
    __metadata("design:paramtypes", [credential_resolver_service_1.DynamicCredentialResolverService])
], CredentialResolversController);
//# sourceMappingURL=credential-resolvers.controller.js.map