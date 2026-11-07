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
exports.ScimController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const scim_route_1 = require("./scim-route");
const scim_errors_1 = require("./scim.errors");
const scim_service_1 = require("./scim.service");
let ScimController = class ScimController {
    constructor(logger, scimService) {
        this.logger = logger;
        this.scimService = scimService;
    }
    scimError(res, status, detail, scimType) {
        const error = {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
            status: String(status),
            detail,
            scimType,
        };
        return res.status(status).header('Content-Type', 'application/scim+json').json(error);
    }
    handleError(res, error, operation) {
        if (error instanceof scim_errors_1.ScimResourceNotFoundError) {
            return this.scimError(res, 404, error.message);
        }
        if (error instanceof scim_errors_1.ScimConflictError) {
            return this.scimError(res, 409, error.message, 'uniqueness');
        }
        if (error instanceof scim_errors_1.ScimInvalidFilterError) {
            return this.scimError(res, 400, error.message, 'invalidFilter');
        }
        if (error instanceof scim_errors_1.ScimInvalidValueError) {
            return this.scimError(res, 400, error.message, 'invalidValue');
        }
        this.logger.error(`SCIM: Error during ${operation}`, { error });
        return this.scimError(res, 500, 'Internal server error');
    }
    async listUsers(_req, res, query) {
        try {
            const result = await this.scimService.getUsers({
                startIndex: query.startIndex,
                count: query.count,
                filter: query.filter,
            });
            return res.header('Content-Type', 'application/scim+json').json(result);
        }
        catch (error) {
            return this.handleError(res, error, 'list users');
        }
    }
    async getUser(_req, res, userId) {
        try {
            const user = await this.scimService.getUserById(userId);
            if (!user) {
                return this.scimError(res, 404, `Resource ${userId} not found`);
            }
            return res.header('Content-Type', 'application/scim+json').json(user);
        }
        catch (error) {
            return this.handleError(res, error, 'get user');
        }
    }
    async createUser(_req, res, body) {
        try {
            const createdUser = await this.scimService.createUser(body);
            return res.status(201).header('Content-Type', 'application/scim+json').json(createdUser);
        }
        catch (error) {
            return this.handleError(res, error, 'create user');
        }
    }
    async replaceUser(_req, res, userId, body) {
        try {
            const updatedUser = await this.scimService.updateUser(userId, body);
            return res.header('Content-Type', 'application/scim+json').json(updatedUser);
        }
        catch (error) {
            return this.handleError(res, error, 'replace user');
        }
    }
    async patchUser(_req, res, userId, body) {
        try {
            const updatedUser = await this.scimService.patchUser(userId, body);
            return res.header('Content-Type', 'application/scim+json').json(updatedUser);
        }
        catch (error) {
            return this.handleError(res, error, 'patch user');
        }
    }
    async deleteUser(_req, res, userId) {
        try {
            await this.scimService.deleteUser(userId);
            return res.status(204).send();
        }
        catch (error) {
            return this.handleError(res, error, 'delete user');
        }
    }
};
exports.ScimController = ScimController;
__decorate([
    (0, decorators_1.Get)('/Users', scim_route_1.scimRoute),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ScimQueryDto]),
    __metadata("design:returntype", Promise)
], ScimController.prototype, "listUsers", null);
__decorate([
    (0, decorators_1.Get)('/Users/:id', scim_route_1.scimRoute),
    __param(2, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ScimController.prototype, "getUser", null);
__decorate([
    (0, decorators_1.Post)('/Users', scim_route_1.scimRoute),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ScimUserCreateDto]),
    __metadata("design:returntype", Promise)
], ScimController.prototype, "createUser", null);
__decorate([
    (0, decorators_1.Put)('/Users/:id', scim_route_1.scimRoute),
    __param(2, (0, decorators_1.Param)('id')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ScimUserCreateDto]),
    __metadata("design:returntype", Promise)
], ScimController.prototype, "replaceUser", null);
__decorate([
    (0, decorators_1.Patch)('/Users/:id', scim_route_1.scimRoute),
    __param(2, (0, decorators_1.Param)('id')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ScimPatchRequestDto]),
    __metadata("design:returntype", Promise)
], ScimController.prototype, "patchUser", null);
__decorate([
    (0, decorators_1.Delete)('/Users/:id', scim_route_1.scimRoute),
    __param(2, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ScimController.prototype, "deleteUser", null);
exports.ScimController = ScimController = __decorate([
    (0, decorators_1.RootLevelController)('/scim/v2'),
    __metadata("design:paramtypes", [backend_common_1.Logger, scim_service_1.ScimService])
], ScimController);
//# sourceMappingURL=scim.controller.js.map