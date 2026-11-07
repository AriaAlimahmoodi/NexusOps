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
exports.OtelSettingsController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const otel_lifecycle_handler_1 = require("./otel-lifecycle-handler");
const otel_settings_service_1 = require("./otel-settings.service");
const otel_service_1 = require("./otel.service");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
let OtelSettingsController = class OtelSettingsController {
    constructor(otelSettingsService, otelService, otelLifecycleHandler, moduleRegistry, publisher) {
        this.otelSettingsService = otelSettingsService;
        this.otelService = otelService;
        this.otelLifecycleHandler = otelLifecycleHandler;
        this.moduleRegistry = moduleRegistry;
        this.publisher = publisher;
    }
    getSettings(_req) {
        return this.otelSettingsService.getSettings();
    }
    async updateSettings(_req, _res, dto) {
        await this.otelSettingsService.saveSettings(dto);
        await this.otelLifecycleHandler.onReloadOtelConfig();
        await this.moduleRegistry.refreshModuleSettings('otel');
        void this.publisher.publishCommand({ command: 'reload-otel-config' });
        return this.otelSettingsService.getSettings();
    }
    async testTrace(_req, _res, dto) {
        const connection = this.otelSettingsService.resolveTestConnection(dto);
        return await this.otelService.sendTestTrace(connection);
    }
};
exports.OtelSettingsController = OtelSettingsController;
__decorate([
    (0, decorators_1.Get)('/settings'),
    (0, decorators_1.GlobalScope)('otel:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OtelSettingsController.prototype, "getSettings", null);
__decorate([
    (0, decorators_1.Put)('/settings'),
    (0, decorators_1.GlobalScope)('otel:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.UpdateOtelSettingsDto]),
    __metadata("design:returntype", Promise)
], OtelSettingsController.prototype, "updateSettings", null);
__decorate([
    (0, decorators_1.Post)('/test-trace'),
    (0, decorators_1.GlobalScope)('otel:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.TestOtelTraceDto]),
    __metadata("design:returntype", Promise)
], OtelSettingsController.prototype, "testTrace", null);
exports.OtelSettingsController = OtelSettingsController = __decorate([
    (0, decorators_1.RestController)('/otel'),
    __metadata("design:paramtypes", [otel_settings_service_1.OtelSettingsService, otel_service_1.OtelService, otel_lifecycle_handler_1.OtelLifecycleHandler, backend_common_1.ModuleRegistry, publisher_service_1.Publisher])
], OtelSettingsController);
//# sourceMappingURL=otel-settings.controller.js.map