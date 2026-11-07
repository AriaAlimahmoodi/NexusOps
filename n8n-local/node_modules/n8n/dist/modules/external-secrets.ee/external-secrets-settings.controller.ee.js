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
exports.ExternalSecretsSettingsController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const response_helper_1 = require("../../response-helper");
const external_secrets_settings_service_ee_1 = require("./external-secrets-settings.service.ee");
const external_secrets_config_1 = require("./external-secrets.config");
let ExternalSecretsSettingsController = class ExternalSecretsSettingsController {
    constructor(config, settingsService, moduleRegistry, logger, eventService) {
        this.config = config;
        this.settingsService = settingsService;
        this.moduleRegistry = moduleRegistry;
        this.logger = logger;
        this.eventService = eventService;
    }
    checkFeatureFlag(_req, res, next) {
        if (!this.config.externalSecretsRoleBasedAccess) {
            (0, response_helper_1.sendErrorResponse)(res, new errors_1.ForbiddenError('Role-based access for external secrets is not enabled'));
            return;
        }
        next();
    }
    async updateSettings(req, _res, body) {
        await this.settingsService.setSystemRolesEnabled(body.systemRolesEnabled);
        this.eventService.emit('external-secrets-system-roles-toggled', {
            userId: req.user.id,
            enabled: body.systemRolesEnabled,
        });
        try {
            await this.moduleRegistry.refreshModuleSettings('external-secrets');
        }
        catch (error) {
            this.logger.warn('Failed to sync external secrets settings to module registry', {
                cause: error instanceof Error ? error.message : String(error),
            });
        }
        return {
            systemRolesEnabled: await this.settingsService.isSystemRolesEnabled(),
        };
    }
};
exports.ExternalSecretsSettingsController = ExternalSecretsSettingsController;
__decorate([
    (0, decorators_1.Middleware)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Function]),
    __metadata("design:returntype", void 0)
], ExternalSecretsSettingsController.prototype, "checkFeatureFlag", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.GlobalScope)('externalSecretsProvider:update'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.UpdateExternalSecretsSettingsDto]),
    __metadata("design:returntype", Promise)
], ExternalSecretsSettingsController.prototype, "updateSettings", null);
exports.ExternalSecretsSettingsController = ExternalSecretsSettingsController = __decorate([
    (0, decorators_1.RestController)('/external-secrets/settings'),
    __metadata("design:paramtypes", [external_secrets_config_1.ExternalSecretsConfig, external_secrets_settings_service_ee_1.ExternalSecretsSettingsService, backend_common_1.ModuleRegistry, backend_common_1.Logger, backend_services_1.EventService])
], ExternalSecretsSettingsController);
//# sourceMappingURL=external-secrets-settings.controller.ee.js.map