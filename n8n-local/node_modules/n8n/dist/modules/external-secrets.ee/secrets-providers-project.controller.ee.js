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
exports.SecretProvidersProjectController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const response_helper_1 = require("../../response-helper");
const external_secrets_config_1 = require("./external-secrets.config");
const secret_provider_access_check_service_ee_1 = require("./secret-provider-access-check.service.ee");
const secrets_providers_connections_service_ee_1 = require("./secrets-providers-connections.service.ee");
let SecretProvidersProjectController = class SecretProvidersProjectController {
    constructor(config, logger, connectionsService, accessCheckService) {
        this.config = config;
        this.logger = logger;
        this.connectionsService = connectionsService;
        this.accessCheckService = accessCheckService;
        this.logger = this.logger.scoped('external-secrets');
    }
    checkFeatureFlag(_req, res, next) {
        if (!this.config.externalSecretsForProjects) {
            this.logger.warn('External secrets for projects feature is not enabled');
            (0, response_helper_1.sendErrorResponse)(res, new errors_1.ForbiddenError('External secrets for projects feature is not enabled'));
            return;
        }
        next();
    }
    async createConnection(req, _res, projectId, body) {
        this.logger.debug('Creating connection for project', {
            projectId,
            providerKey: body.providerKey,
        });
        const savedConnection = await this.connectionsService.createConnection({
            ...body,
            projectIds: [projectId],
        }, req.user.id, 'secretsProviderConnection:owner', req.user.role?.slug);
        const connection = await this.connectionsService.toPublicConnection(savedConnection);
        const scopes = await this.accessCheckService.getConnectionScopesForProject(req.user, body.providerKey, projectId);
        return { ...connection, scopes };
    }
    async listConnectionsForAProject(_req, _res, projectId) {
        this.logger.debug('List all connections within a project', { projectId });
        const connections = await this.connectionsService.listConnectionsForProject(projectId);
        return connections.map((c) => this.connectionsService.toPublicConnectionListItem(c));
    }
    async getConnection(req, _res, projectId, providerKey) {
        this.logger.debug('Getting connection for project', { projectId, providerKey });
        const connectionEntity = await this.connectionsService.getConnectionAccessibleFromProject(providerKey, projectId);
        const connection = await this.connectionsService.toPublicConnection(connectionEntity);
        const scopes = await this.accessCheckService.getConnectionScopesForProject(req.user, providerKey, projectId);
        return { ...connection, scopes };
    }
    async updateConnection(req, _res, projectId, providerKey, body) {
        this.logger.debug('Updating connection for project', { projectId, providerKey });
        await this.accessCheckService.assertConnectionAccess({
            providerKey,
            projectId,
            requiredScope: 'externalSecretsProvider:update',
            user: req.user,
        });
        const { projectIds: _, ...updates } = body;
        const updated = await this.connectionsService.updateProjectConnection(providerKey, updates, req.user.id, req.user.role?.slug);
        const connection = await this.connectionsService.toPublicConnection(updated);
        const scopes = await this.accessCheckService.getConnectionScopesForProject(req.user, providerKey, projectId);
        return { ...connection, scopes };
    }
    async deleteConnection(req, res, projectId, providerKey) {
        this.logger.debug('Deleting connection for project', { projectId, providerKey });
        await this.accessCheckService.assertConnectionAccess({
            providerKey,
            projectId,
            requiredScope: 'externalSecretsProvider:delete',
            user: req.user,
        });
        await this.connectionsService.deleteConnectionForProject(providerKey, projectId);
        res.status(204).send();
    }
    async testConnection(req, _res, projectId, providerKey) {
        this.logger.debug('Testing connection for project', { projectId, providerKey });
        await this.accessCheckService.assertConnectionAccess({
            providerKey,
            projectId,
            requiredScope: 'externalSecretsProvider:update',
            user: req.user,
        });
        return await this.connectionsService.testConnection(providerKey, req.user.id, req.user.role?.slug);
    }
};
exports.SecretProvidersProjectController = SecretProvidersProjectController;
__decorate([
    (0, decorators_1.Middleware)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Function]),
    __metadata("design:returntype", void 0)
], SecretProvidersProjectController.prototype, "checkFeatureFlag", null);
__decorate([
    (0, decorators_1.Post)('/:projectId/connections'),
    (0, decorators_1.ProjectScope)('externalSecretsProvider:create'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.CreateSecretsProviderConnectionDto]),
    __metadata("design:returntype", Promise)
], SecretProvidersProjectController.prototype, "createConnection", null);
__decorate([
    (0, decorators_1.Get)('/:projectId/connections'),
    (0, decorators_1.ProjectScope)('externalSecretsProvider:list'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], SecretProvidersProjectController.prototype, "listConnectionsForAProject", null);
__decorate([
    (0, decorators_1.Get)('/:projectId/connections/:providerKey'),
    (0, decorators_1.ProjectScope)('externalSecretsProvider:read'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __param(3, (0, decorators_1.Param)('providerKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], SecretProvidersProjectController.prototype, "getConnection", null);
__decorate([
    (0, decorators_1.Patch)('/:projectId/connections/:providerKey'),
    (0, decorators_1.ProjectScope)('externalSecretsProvider:update'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __param(3, (0, decorators_1.Param)('providerKey')),
    __param(4, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.UpdateSecretsProviderConnectionDto]),
    __metadata("design:returntype", Promise)
], SecretProvidersProjectController.prototype, "updateConnection", null);
__decorate([
    (0, decorators_1.Delete)('/:projectId/connections/:providerKey'),
    (0, decorators_1.ProjectScope)('externalSecretsProvider:delete'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __param(3, (0, decorators_1.Param)('providerKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], SecretProvidersProjectController.prototype, "deleteConnection", null);
__decorate([
    (0, decorators_1.Post)('/:projectId/connections/:providerKey/test'),
    (0, decorators_1.ProjectScope)('externalSecretsProvider:update'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __param(3, (0, decorators_1.Param)('providerKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], SecretProvidersProjectController.prototype, "testConnection", null);
exports.SecretProvidersProjectController = SecretProvidersProjectController = __decorate([
    (0, decorators_1.RestController)('/secret-providers/projects'),
    __metadata("design:paramtypes", [external_secrets_config_1.ExternalSecretsConfig, backend_common_1.Logger, secrets_providers_connections_service_ee_1.SecretsProvidersConnectionsService, secret_provider_access_check_service_ee_1.SecretsProviderAccessCheckService])
], SecretProvidersProjectController);
//# sourceMappingURL=secrets-providers-project.controller.ee.js.map