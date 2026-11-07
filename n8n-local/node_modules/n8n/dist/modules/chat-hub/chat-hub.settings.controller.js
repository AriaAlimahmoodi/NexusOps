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
exports.ChatHubSettingsController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const chat_hub_settings_service_1 = require("./chat-hub.settings.service");
let ChatHubSettingsController = class ChatHubSettingsController {
    constructor(settings, logger, moduleRegistry) {
        this.settings = settings;
        this.logger = logger;
        this.moduleRegistry = moduleRegistry;
        this.logger = this.logger.scoped('chat-hub');
    }
    async syncModuleSettings() {
        try {
            await this.moduleRegistry.refreshModuleSettings('chat-hub');
        }
        catch (error) {
            this.logger.warn('Failed to sync chat settings to module registry', {
                cause: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async getSettings(_req, _res) {
        const providers = await this.settings.getAllProviderSettings();
        return { providers };
    }
    async getProviderSettings(_req, _res, provider) {
        if (!api_types_1.chatHubLLMProviderSchema.safeParse(provider).success) {
            throw new errors_1.BadRequestError(`Invalid provider: ${provider}`);
        }
        const settings = await this.settings.getProviderSettings(provider);
        return { settings };
    }
    async updateSettings(_req, _res, body) {
        const { payload } = body;
        await this.settings.setProviderSettings(payload.provider, payload);
        await this.syncModuleSettings();
        return await this.settings.getProviderSettings(payload.provider);
    }
    async setEnabled(_req, _res, body) {
        await this.settings.setEnabled(body.enabled);
        await this.syncModuleSettings();
        return { enabled: body.enabled };
    }
    async setVectorStoreCredential(_req, _res, body) {
        await this.settings.setSemanticSearchSettings(body);
        await this.syncModuleSettings();
    }
};
exports.ChatHubSettingsController = ChatHubSettingsController;
__decorate([
    (0, decorators_1.Get)('/settings'),
    (0, decorators_1.GlobalScope)('chatHub:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response]),
    __metadata("design:returntype", Promise)
], ChatHubSettingsController.prototype, "getSettings", null);
__decorate([
    (0, decorators_1.Get)('/settings/:provider'),
    (0, decorators_1.GlobalScope)('chatHub:manage'),
    __param(2, (0, decorators_1.Param)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, String]),
    __metadata("design:returntype", Promise)
], ChatHubSettingsController.prototype, "getProviderSettings", null);
__decorate([
    (0, decorators_1.Post)('/settings'),
    (0, decorators_1.GlobalScope)('chatHub:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.UpdateChatSettingsRequest]),
    __metadata("design:returntype", Promise)
], ChatHubSettingsController.prototype, "updateSettings", null);
__decorate([
    (0, decorators_1.Put)('/enabled'),
    (0, decorators_1.GlobalScope)('chatHub:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.UpdateChatEnabledRequest]),
    __metadata("design:returntype", Promise)
], ChatHubSettingsController.prototype, "setEnabled", null);
__decorate([
    (0, decorators_1.Put)('/semantic-search'),
    (0, decorators_1.GlobalScope)('chatHub:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.ChatHubSemanticSearchSettings]),
    __metadata("design:returntype", Promise)
], ChatHubSettingsController.prototype, "setVectorStoreCredential", null);
exports.ChatHubSettingsController = ChatHubSettingsController = __decorate([
    (0, decorators_1.RestController)('/chat'),
    __metadata("design:paramtypes", [chat_hub_settings_service_1.ChatHubSettingsService, backend_common_1.Logger, backend_common_1.ModuleRegistry])
], ChatHubSettingsController);
//# sourceMappingURL=chat-hub.settings.controller.js.map