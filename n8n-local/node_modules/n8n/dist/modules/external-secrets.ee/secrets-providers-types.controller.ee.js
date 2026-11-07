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
exports.SecretProvidersTypesController = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const response_helper_1 = require("../../response-helper");
const external_secrets_providers_ee_1 = require("./external-secrets-providers.ee");
const external_secrets_config_1 = require("./external-secrets.config");
let SecretProvidersTypesController = class SecretProvidersTypesController {
    constructor(config, logger, secretsProviders) {
        this.config = config;
        this.logger = logger;
        this.secretsProviders = secretsProviders;
        this.logger = this.logger.scoped('external-secrets');
    }
    checkFeatureFlag(_req, res, next) {
        const hasAccess = this.config.externalSecretsMultipleConnections || this.config.externalSecretsForProjects;
        if (!hasAccess) {
            this.logger.warn('Requested beta external secret endpoint without feature flag enabled');
            (0, response_helper_1.sendErrorResponse)(res, new errors_1.ForbiddenError('Requested beta external secret endpoint without feature flag enabled'));
            return;
        }
        next();
    }
    listSecretProviderTypes() {
        this.logger.debug('List provider connection types');
        const allProviders = this.secretsProviders.getAllProviders();
        return Object.values(allProviders).map((providerClass) => {
            const provider = new providerClass();
            return this.secretsProviders.toProviderTypeResponse(provider);
        });
    }
    getSecretProviderType(_req, _res, type) {
        this.logger.debug('Get provider connection type', { type });
        if (!this.secretsProviders.hasProvider(type)) {
            throw new errors_1.NotFoundError(`Provider type "${type}" not found`);
        }
        const providerClass = this.secretsProviders.getProvider(type);
        const provider = new providerClass();
        return this.secretsProviders.toProviderTypeResponse(provider);
    }
};
exports.SecretProvidersTypesController = SecretProvidersTypesController;
__decorate([
    (0, decorators_1.Middleware)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Function]),
    __metadata("design:returntype", void 0)
], SecretProvidersTypesController.prototype, "checkFeatureFlag", null);
__decorate([
    (0, decorators_1.Get)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], SecretProvidersTypesController.prototype, "listSecretProviderTypes", null);
__decorate([
    (0, decorators_1.Get)('/:type'),
    __param(2, (0, decorators_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Object)
], SecretProvidersTypesController.prototype, "getSecretProviderType", null);
exports.SecretProvidersTypesController = SecretProvidersTypesController = __decorate([
    (0, decorators_1.RestController)('/secret-providers/types'),
    __metadata("design:paramtypes", [external_secrets_config_1.ExternalSecretsConfig, backend_common_1.Logger, external_secrets_providers_ee_1.ExternalSecretsProviders])
], SecretProvidersTypesController);
//# sourceMappingURL=secrets-providers-types.controller.ee.js.map