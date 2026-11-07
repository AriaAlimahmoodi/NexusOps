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
exports.ScimTokenController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const scim_settings_service_1 = require("./scim-settings.service");
const scim_token_service_1 = require("./scim-token.service");
let ScimTokenController = class ScimTokenController {
    constructor(logger, scimTokenService, scimSettingsService, moduleRegistry) {
        this.logger = logger;
        this.scimTokenService = scimTokenService;
        this.scimSettingsService = scimSettingsService;
        this.moduleRegistry = moduleRegistry;
    }
    async getConfig(req, res) {
        try {
            const [enabled, tokenInfo] = await Promise.all([
                this.scimSettingsService.isEnabled(),
                this.scimTokenService.getTokenInfoForUser(req.user),
            ]);
            return res.status(200).json({
                data: {
                    enabled,
                    hasToken: tokenInfo.hasToken,
                    tokenHint: tokenInfo.lastFour,
                    baseUrl: this.scimTokenService.getScimBaseUrl(),
                },
            });
        }
        catch (error) {
            this.logger.error('Error getting SCIM config', { error });
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    async updateConfig(_req, res, body) {
        try {
            await this.scimSettingsService.setEnabled(body.enabled);
            await this.moduleRegistry.refreshModuleSettings('scim');
            return res.status(200).json({ data: { enabled: body.enabled } });
        }
        catch (error) {
            this.logger.error('Error updating SCIM config', { error });
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    async generateToken(req, res) {
        try {
            const apiKey = await this.scimTokenService.rotateScimApiKey(req.user);
            const baseUrl = this.scimTokenService.getScimBaseUrl();
            return res.status(201).json({ data: { token: apiKey.apiKey, baseUrl } });
        }
        catch (error) {
            this.logger.error('Error generating SCIM token', { error });
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    async deleteToken(req, res) {
        try {
            await this.scimTokenService.deleteAllScimApiKeysForUser(req.user);
            return res.status(200).json({ data: { success: true } });
        }
        catch (error) {
            this.logger.error('Error deleting SCIM token', { error });
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
};
exports.ScimTokenController = ScimTokenController;
__decorate([
    (0, decorators_1.Get)('/config'),
    (0, decorators_1.GlobalScope)('scim:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ScimTokenController.prototype, "getConfig", null);
__decorate([
    (0, decorators_1.Patch)('/config'),
    (0, decorators_1.GlobalScope)('scim:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ScimConfigPatchDto]),
    __metadata("design:returntype", Promise)
], ScimTokenController.prototype, "updateConfig", null);
__decorate([
    (0, decorators_1.Post)('/token'),
    (0, decorators_1.GlobalScope)('scim:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ScimTokenController.prototype, "generateToken", null);
__decorate([
    (0, decorators_1.Delete)('/token'),
    (0, decorators_1.GlobalScope)('scim:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ScimTokenController.prototype, "deleteToken", null);
exports.ScimTokenController = ScimTokenController = __decorate([
    (0, decorators_1.RestController)('/scim'),
    __metadata("design:paramtypes", [backend_common_1.Logger, scim_token_service_1.ScimTokenService, scim_settings_service_1.ScimSettingsService, backend_common_1.ModuleRegistry])
], ScimTokenController);
//# sourceMappingURL=scim-token.controller.js.map