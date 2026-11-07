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
exports.SecretProvidersCompletionsController = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const response_helper_1 = require("../../response-helper");
const external_secrets_config_1 = require("./external-secrets.config");
const secrets_providers_connections_service_ee_1 = require("./secrets-providers-connections.service.ee");
let SecretProvidersCompletionsController = class SecretProvidersCompletionsController {
    constructor(config, logger, connectionsService) {
        this.config = config;
        this.logger = logger;
        this.connectionsService = connectionsService;
        this.logger = this.logger.scoped('external-secrets');
    }
    checkFeatureFlag(req, res, next) {
        const path = req.path;
        if (path.startsWith('/secrets/global')) {
            const hasAccess = this.config.externalSecretsMultipleConnections || this.config.externalSecretsForProjects;
            if (!hasAccess) {
                this.logger.warn('External secrets multiple connections feature is not enabled');
                (0, response_helper_1.sendErrorResponse)(res, new errors_1.ForbiddenError('External secrets multiple connections feature is not enabled'));
                return;
            }
        }
        else if (path.startsWith('/secrets/project/')) {
            if (!this.config.externalSecretsForProjects) {
                this.logger.warn('External secrets for projects feature is not enabled');
                (0, response_helper_1.sendErrorResponse)(res, new errors_1.ForbiddenError('External secrets for projects feature is not enabled'));
                return;
            }
        }
        next();
    }
    async listGlobalSecrets() {
        this.logger.debug('Listing global secrets');
        const connections = await this.connectionsService.getGlobalCompletions();
        return this.connectionsService.toSecretCompletionsResponse(connections);
    }
    async listGlobalSecretsForProject(_req, _res, projectId) {
        this.logger.debug('Listing global secrets for project', { projectId });
        const connections = await this.connectionsService.getGlobalCompletions();
        return this.connectionsService.toSecretCompletionsResponse(connections);
    }
    async listProjectSecrets(_req, _res, projectId) {
        this.logger.debug('Listing secrets for project', { projectId });
        const connections = await this.connectionsService.getProjectCompletions(projectId);
        return this.connectionsService.toSecretCompletionsResponse(connections);
    }
};
exports.SecretProvidersCompletionsController = SecretProvidersCompletionsController;
__decorate([
    (0, decorators_1.Middleware)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Function]),
    __metadata("design:returntype", void 0)
], SecretProvidersCompletionsController.prototype, "checkFeatureFlag", null);
__decorate([
    (0, decorators_1.Get)('/secrets/global'),
    (0, decorators_1.GlobalScope)('externalSecret:list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SecretProvidersCompletionsController.prototype, "listGlobalSecrets", null);
__decorate([
    (0, decorators_1.Get)('/secrets/global/:projectId'),
    (0, decorators_1.ProjectScope)('externalSecret:list'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], SecretProvidersCompletionsController.prototype, "listGlobalSecretsForProject", null);
__decorate([
    (0, decorators_1.Get)('/secrets/project/:projectId'),
    (0, decorators_1.ProjectScope)('externalSecret:list'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], SecretProvidersCompletionsController.prototype, "listProjectSecrets", null);
exports.SecretProvidersCompletionsController = SecretProvidersCompletionsController = __decorate([
    (0, decorators_1.RestController)('/secret-providers/completions'),
    __metadata("design:paramtypes", [external_secrets_config_1.ExternalSecretsConfig, backend_common_1.Logger, secrets_providers_connections_service_ee_1.SecretsProvidersConnectionsService])
], SecretProvidersCompletionsController);
//# sourceMappingURL=secrets-providers-completions.controller.ee.js.map