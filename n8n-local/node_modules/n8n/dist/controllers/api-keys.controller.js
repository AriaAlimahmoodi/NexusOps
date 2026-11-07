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
exports.ApiKeysController = exports.isApiKeyAuthEnabledMiddleware = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_services_1 = require("@n8n/backend-services");
const decorators_1 = require("@n8n/decorators");
const permissions_1 = require("@n8n/permissions");
const errors_1 = require("@n8n/errors");
const public_api_1 = require("../public-api");
const public_api_key_service_1 = require("../services/public-api-key.service");
const isApiKeyAuthEnabledMiddleware = (_, res, next) => {
    if ((0, public_api_1.isApiKeyAuthEnabled)()) {
        next();
    }
    else {
        res.status(404).end();
    }
};
exports.isApiKeyAuthEnabledMiddleware = isApiKeyAuthEnabledMiddleware;
let ApiKeysController = class ApiKeysController {
    constructor(eventService, publicApiKeyService) {
        this.eventService = eventService;
        this.publicApiKeyService = publicApiKeyService;
    }
    async createApiKey(req, _res, body) {
        if (!this.publicApiKeyService.apiKeyHasValidScopesForRole(req.user, body.scopes)) {
            throw new errors_1.BadRequestError('Invalid scopes for user role');
        }
        const newApiKey = await this.publicApiKeyService.createPublicApiKeyForUser(req.user, body);
        this.eventService.emit('public-api-key-created', { user: req.user, publicApi: false });
        return {
            ...newApiKey,
            apiKey: this.publicApiKeyService.redactApiKey(newApiKey.apiKey),
            rawApiKey: newApiKey.apiKey,
            expiresAt: body.expiresAt,
        };
    }
    async getApiKeys(req, _res, query) {
        return await this.publicApiKeyService.getRedactedApiKeys(req.user, {
            take: query.take,
            skip: query.skip,
            ownership: query.ownership,
            label: query.label,
            ownerIds: query.ownerIds,
            sortBy: query.sortBy,
        });
    }
    async deleteApiKey(req, _res, apiKeyId) {
        const { isOwn } = await this.publicApiKeyService.deleteApiKey(req.user, apiKeyId);
        this.eventService.emit('public-api-key-deleted', {
            user: req.user,
            publicApi: false,
            isOwn,
        });
        return { success: true };
    }
    async updateApiKey(req, _res, apiKeyId, body) {
        if (!this.publicApiKeyService.apiKeyHasValidScopesForRole(req.user, body.scopes)) {
            throw new errors_1.BadRequestError('Invalid scopes for user role');
        }
        await this.publicApiKeyService.updateApiKeyForUser(req.user, apiKeyId, body);
        return { success: true };
    }
    async rotateApiKey(req, _res, apiKeyId) {
        const rotatedApiKey = await this.publicApiKeyService.rotateApiKey(req.user, apiKeyId);
        this.eventService.emit('public-api-key-rotated', { user: req.user, publicApi: false });
        return {
            ...rotatedApiKey,
            apiKey: this.publicApiKeyService.redactApiKey(rotatedApiKey.apiKey),
            rawApiKey: rotatedApiKey.apiKey,
            expiresAt: this.publicApiKeyService.getApiKeyExpiration(rotatedApiKey.apiKey),
        };
    }
    async getApiKeyScopes(req, _res) {
        const scopes = (0, permissions_1.getApiKeyScopesForRole)(req.user);
        return scopes;
    }
};
exports.ApiKeysController = ApiKeysController;
__decorate([
    (0, decorators_1.GlobalScope)('apiKey:create'),
    (0, decorators_1.Post)('/', { middlewares: [exports.isApiKeyAuthEnabledMiddleware] }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.CreateApiKeyRequestDto]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "createApiKey", null);
__decorate([
    (0, decorators_1.Get)('/', { middlewares: [exports.isApiKeyAuthEnabledMiddleware] }),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.ListApiKeysQueryDto]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "getApiKeys", null);
__decorate([
    (0, decorators_1.Delete)('/:id', { middlewares: [exports.isApiKeyAuthEnabledMiddleware] }),
    __param(2, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, String]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "deleteApiKey", null);
__decorate([
    (0, decorators_1.GlobalScope)('apiKey:update'),
    (0, decorators_1.Patch)('/:id', { middlewares: [exports.isApiKeyAuthEnabledMiddleware] }),
    __param(2, (0, decorators_1.Param)('id')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, String, api_types_1.UpdateApiKeyRequestDto]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "updateApiKey", null);
__decorate([
    (0, decorators_1.GlobalScope)('apiKey:update'),
    (0, decorators_1.Post)('/:id/rotate', { middlewares: [exports.isApiKeyAuthEnabledMiddleware] }),
    __param(2, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, String]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "rotateApiKey", null);
__decorate([
    (0, decorators_1.Get)('/scopes', { middlewares: [exports.isApiKeyAuthEnabledMiddleware] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "getApiKeyScopes", null);
exports.ApiKeysController = ApiKeysController = __decorate([
    (0, decorators_1.RestController)('/api-keys'),
    __metadata("design:paramtypes", [backend_services_1.EventService, public_api_key_service_1.PublicApiKeyService])
], ApiKeysController);
//# sourceMappingURL=api-keys.controller.js.map