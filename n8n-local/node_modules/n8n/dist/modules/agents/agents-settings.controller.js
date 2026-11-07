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
exports.AgentsSettingsController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const agents_settings_service_1 = require("./agents-settings.service");
let AgentsSettingsController = class AgentsSettingsController {
    constructor(settingsService, moduleRegistry, publisher, logger) {
        this.settingsService = settingsService;
        this.moduleRegistry = moduleRegistry;
        this.publisher = publisher;
        this.logger = logger;
    }
    async getSettings() {
        return { enabled: await this.settingsService.getEnabled() };
    }
    async updateSettings(_req, _res, settings) {
        await this.settingsService.setEnabled(settings.enabled);
        try {
            await this.reloadSettings();
        }
        catch (error) {
            this.logger.error('Failed to refresh the local Agents setting', { error });
        }
        try {
            await this.publisher.publishCommand({ command: 'reload-agents-settings' });
        }
        catch (error) {
            this.logger.error('Failed to notify other main processes of the Agents setting', { error });
        }
        return settings;
    }
    async reloadSettings() {
        await this.moduleRegistry.refreshModuleSettings('agents');
    }
};
exports.AgentsSettingsController = AgentsSettingsController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.GlobalScope)('agent:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentsSettingsController.prototype, "getSettings", null);
__decorate([
    (0, decorators_1.Put)('/'),
    (0, decorators_1.GlobalScope)('agent:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AgentsSettingsDto]),
    __metadata("design:returntype", Promise)
], AgentsSettingsController.prototype, "updateSettings", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('reload-agents-settings', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentsSettingsController.prototype, "reloadSettings", null);
exports.AgentsSettingsController = AgentsSettingsController = __decorate([
    (0, decorators_1.RestController)('/agents/settings'),
    __metadata("design:paramtypes", [agents_settings_service_1.AgentsSettingsService, backend_common_1.ModuleRegistry, publisher_service_1.Publisher, backend_common_1.Logger])
], AgentsSettingsController);
//# sourceMappingURL=agents-settings.controller.js.map