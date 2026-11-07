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
exports.SecretProvidersConnectionsController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const response_helper_1 = require("../../response-helper");
const external_secrets_config_1 = require("./external-secrets.config");
const secrets_providers_connections_service_ee_1 = require("./secrets-providers-connections.service.ee");
let SecretProvidersConnectionsController = class SecretProvidersConnectionsController {
    constructor(config, logger, connectionsService) {
        this.config = config;
        this.logger = logger;
        this.connectionsService = connectionsService;
        this.logger = this.logger.scoped('external-secrets');
    }
    checkFeatureFlag(req, res, next) {
        const isProjectScopedRequest = (req.method === 'POST' || req.method === 'PATCH') &&
            req.body.projectIds?.length > 0;
        if (isProjectScopedRequest) {
            if (!this.config.externalSecretsForProjects) {
                this.logger.warn('Tried to create a project-scoped external secret connection without feature flag enabled');
                (0, response_helper_1.sendErrorResponse)(res, new errors_1.ForbiddenError('Tried to create a project-scoped external secret connection without feature flag enabled'));
                return;
            }
            next();
            return;
        }
        if (!this.config.externalSecretsForProjects &&
            !this.config.externalSecretsMultipleConnections) {
            this.logger.warn('Requested beta external secret endpoint without feature flag enabled');
            (0, response_helper_1.sendErrorResponse)(res, new errors_1.ForbiddenError('Requested beta external secret endpoint without feature flag enabled'));
            return;
        }
        next();
    }
    async createConnection(req, _res, body) {
        this.logger.debug('Creating new connection', {
            providerKey: body.providerKey,
            type: body.type,
        });
        const savedConnection = await this.connectionsService.createConnection(body, req.user.id, 'secretsProviderConnection:user', req.user.role?.slug);
        return await this.connectionsService.toPublicConnection(savedConnection);
    }
    async updateConnection(req, _res, providerKey, body) {
        this.logger.debug('Updating connection', { providerKey });
        const connection = await this.connectionsService.updateGlobalConnection(providerKey, body, req.user.id, req.user.role?.slug);
        return await this.connectionsService.toPublicConnection(connection);
    }
    async deleteConnection(req, res, providerKey) {
        this.logger.debug('Deleting connection', { providerKey });
        await this.connectionsService.deleteConnection(providerKey, req.user.id, req.user.role?.slug);
        res.status(204).send();
        return;
    }
    async listConnections() {
        this.logger.debug('Listing all connections');
        const connections = await this.connectionsService.listConnections();
        return connections.map((connection) => this.connectionsService.toPublicConnectionListItem(connection));
    }
    async getConnection(_req, _res, providerKey) {
        this.logger.debug('Getting connection', { providerKey });
        const connection = await this.connectionsService.getConnection(providerKey);
        return await this.connectionsService.toPublicConnection(connection);
    }
    async testConnection(req, _res, providerKey) {
        this.logger.debug('Testing provider connection', { providerKey });
        return await this.connectionsService.testConnection(providerKey, req.user.id, req.user.role?.slug);
    }
    async reloadConnectionSecrets(req, _res, providerKey) {
        this.logger.debug('Reloading secrets for secret provider connection', { providerKey });
        return await this.connectionsService.reloadConnectionSecrets(providerKey, req.user.id, req.user.role?.slug);
    }
};
exports.SecretProvidersConnectionsController = SecretProvidersConnectionsController;
__decorate([
    (0, decorators_1.Middleware)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Function]),
    __metadata("design:returntype", void 0)
], SecretProvidersConnectionsController.prototype, "checkFeatureFlag", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.GlobalScope)('externalSecretsProvider:create'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateSecretsProviderConnectionDto]),
    __metadata("design:returntype", Promise)
], SecretProvidersConnectionsController.prototype, "createConnection", null);
__decorate([
    (0, decorators_1.Patch)('/:providerKey'),
    (0, decorators_1.GlobalScope)('externalSecretsProvider:update'),
    __param(2, (0, decorators_1.Param)('providerKey')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateSecretsProviderConnectionDto]),
    __metadata("design:returntype", Promise)
], SecretProvidersConnectionsController.prototype, "updateConnection", null);
__decorate([
    (0, decorators_1.Delete)('/:providerKey'),
    (0, decorators_1.GlobalScope)('externalSecretsProvider:delete'),
    __param(2, (0, decorators_1.Param)('providerKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], SecretProvidersConnectionsController.prototype, "deleteConnection", null);
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.GlobalScope)('externalSecretsProvider:list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SecretProvidersConnectionsController.prototype, "listConnections", null);
__decorate([
    (0, decorators_1.Get)('/:providerKey'),
    (0, decorators_1.GlobalScope)('externalSecretsProvider:read'),
    __param(2, (0, decorators_1.Param)('providerKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], SecretProvidersConnectionsController.prototype, "getConnection", null);
__decorate([
    (0, decorators_1.Post)('/:providerKey/test'),
    (0, decorators_1.GlobalScope)('externalSecretsProvider:update'),
    __param(2, (0, decorators_1.Param)('providerKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], SecretProvidersConnectionsController.prototype, "testConnection", null);
__decorate([
    (0, decorators_1.Post)('/:providerKey/reload'),
    (0, decorators_1.GlobalScope)('externalSecretsProvider:sync'),
    __param(2, (0, decorators_1.Param)('providerKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], SecretProvidersConnectionsController.prototype, "reloadConnectionSecrets", null);
exports.SecretProvidersConnectionsController = SecretProvidersConnectionsController = __decorate([
    (0, decorators_1.RestController)('/secret-providers/connections'),
    __metadata("design:paramtypes", [external_secrets_config_1.ExternalSecretsConfig, backend_common_1.Logger, secrets_providers_connections_service_ee_1.SecretsProvidersConnectionsService])
], SecretProvidersConnectionsController);
//# sourceMappingURL=secrets-providers-connections.controller.ee.js.map