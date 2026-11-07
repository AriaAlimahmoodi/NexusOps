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
exports.OAuthClientsController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const permissions_1 = require("@n8n/permissions");
const errors_1 = require("@n8n/errors");
const oauth_server_service_1 = require("./oauth-server.service");
let OAuthClientsController = class OAuthClientsController {
    constructor(oauthServerService, logger) {
        this.oauthServerService = oauthServerService;
        this.logger = logger;
    }
    async getAllClients(req, _res, query) {
        this.logger.debug('Fetching OAuth clients for user', {
            userId: req.user.id,
            ownership: query.ownership ?? 'mine',
        });
        const { clients, count, totals, owners } = await this.oauthServerService.getAllClients(req.user, query);
        this.logger.debug(`Found ${count} OAuth clients`);
        const clientDtos = clients.map((client) => ({
            id: client.id,
            name: client.name,
            redirectUris: client.redirectUris,
            grantTypes: client.grantTypes,
            tokenEndpointAuthMethod: client.tokenEndpointAuthMethod,
            createdAt: client.createdAt.toISOString(),
            updatedAt: client.updatedAt.toISOString(),
            grantedAt: client.grantedAt,
            scopes: client.scopes,
            owner: client.owner,
        }));
        return {
            data: clientDtos,
            count,
            scopeTools: await this.oauthServerService.getInstanceScopeTools(),
            totals,
            owners,
        };
    }
    async getInstanceStats() {
        return await this.oauthServerService.getInstanceClientStats();
    }
    async deleteClient(req, _res, clientId, query) {
        const targetUserId = query.userId ?? req.user.id;
        if (targetUserId !== req.user.id && !(0, permissions_1.hasGlobalScope)(req.user, 'mcp:manage')) {
            throw new errors_1.ForbiddenError('You are not allowed to revoke connected clients of other users');
        }
        this.logger.info('Deleting OAuth client', {
            clientId,
            userId: req.user.id,
            targetUserId,
            userEmail: req.user.email,
        });
        try {
            await this.oauthServerService.deleteClient(clientId, targetUserId, req.user);
            this.logger.info('OAuth client deleted successfully', {
                clientId,
                userId: req.user.id,
                targetUserId,
            });
            return {
                success: true,
                message: `OAuth client ${clientId} has been deleted successfully`,
            };
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                this.logger.warn('Attempted to delete non-existent OAuth client', {
                    clientId,
                    userId: req.user.id,
                });
                throw new errors_1.NotFoundError(`OAuth client with ID ${clientId} not found`);
            }
            throw error;
        }
    }
};
exports.OAuthClientsController = OAuthClientsController;
__decorate([
    (0, decorators_1.GlobalScope)('mcp:oauth'),
    (0, decorators_1.Get)('/'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListOAuthClientsQueryDto]),
    __metadata("design:returntype", Promise)
], OAuthClientsController.prototype, "getAllClients", null);
__decorate([
    (0, decorators_1.GlobalScope)('mcp:manage'),
    (0, decorators_1.Get)('/instance-stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OAuthClientsController.prototype, "getInstanceStats", null);
__decorate([
    (0, decorators_1.GlobalScope)('mcp:oauth'),
    (0, decorators_1.Delete)('/:clientId'),
    __param(2, (0, decorators_1.Param)('clientId')),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.DeleteOAuthClientQueryDto]),
    __metadata("design:returntype", Promise)
], OAuthClientsController.prototype, "deleteClient", null);
exports.OAuthClientsController = OAuthClientsController = __decorate([
    (0, decorators_1.RestController)('/mcp/oauth-clients'),
    __metadata("design:paramtypes", [oauth_server_service_1.OAuthServerService, backend_common_1.Logger])
], OAuthClientsController);
//# sourceMappingURL=oauth-clients.controller.js.map