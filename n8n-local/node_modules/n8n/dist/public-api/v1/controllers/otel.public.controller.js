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
exports.OtelPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const otel_settings_service_1 = require("../../../modules/otel/otel-settings.service");
const otel_service_1 = require("../../../modules/otel/otel.service");
const otel_mapper_1 = require("../../../public-api/v1/shared/otel.mapper");
const publisher_service_1 = require("../../../scaling/pubsub/publisher.service");
const tags = ['SettingsOtel'];
let OtelPublicController = class OtelPublicController {
    constructor(settingsService, otelService, moduleRegistry, publisher) {
        this.settingsService = settingsService;
        this.otelService = otelService;
        this.moduleRegistry = moduleRegistry;
        this.publisher = publisher;
    }
    async getOtelSettings(_req, _res, _query) {
        await this.settingsService.loadSettings();
        const settings = this.settingsService.getSettings();
        return (0, otel_mapper_1.toOtelSettingsResponse)(settings);
    }
    async updateOtelSettings(_req, _res, body, _query) {
        await this.settingsService.loadSettings();
        const current = this.settingsService.getSettings();
        const conflicts = current.envManagedFields.filter((key) => body[key] !== current[key]);
        if (conflicts.length > 0) {
            throw new errors_1.ConflictError(`The following field(s) are managed by environment variables and cannot be changed through the API: ${conflicts.join(', ')}`);
        }
        await this.settingsService.saveSettings(body);
        await this.otelService.restart();
        await this.moduleRegistry.refreshModuleSettings('otel');
        void this.publisher.publishCommand({ command: 'reload-otel-config' });
        const updated = this.settingsService.getSettings();
        return (0, otel_mapper_1.toOtelSettingsResponse)(updated);
    }
    async testOtelTrace(_req, _res, body, _query) {
        const connection = this.settingsService.resolveTestConnection(body);
        return await this.otelService.sendTestTrace(connection);
    }
};
exports.OtelPublicController = OtelPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ApiKeyScope)('otel:manage'),
    (0, decorators_1.ApiSummary)('Retrieve the OpenTelemetry configuration'),
    (0, decorators_1.ApiDescription)('Retrieve the current OpenTelemetry configuration, including every field exposed in the UI. Requires the `otel:manage` scope.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.OtelSettingsPublicDto),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.OtelSettingsQueryPublicDto]),
    __metadata("design:returntype", Promise)
], OtelPublicController.prototype, "getOtelSettings", null);
__decorate([
    (0, decorators_1.Put)('/'),
    (0, decorators_1.ApiKeyScope)('otel:manage'),
    (0, decorators_1.ApiSummary)('Set the OpenTelemetry configuration'),
    (0, decorators_1.ApiDescription)('Set the OpenTelemetry configuration. This is a full replacement: every field must be provided, and a partial body is rejected. The exceptions are `exporterProtocol`, which defaults to `http/protobuf` when omitted, and `emitWorkflowStartSpan` and `emitNodeStartSpan`, which default to `false` when omitted. The update takes effect exactly as it would from the UI, using the same validation, and is applied to the running instance immediately. Fields managed declaratively via environment variables are read-only: attempting to change one is rejected with 409, while re-submitting its current value (as returned by GET) is accepted. Requires the `otel:manage` scope.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.OtelSettingsPublicDto),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, decorators_1.Body),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.UpdateOtelSettingsPublicDto, api_types_1.OtelSettingsQueryPublicDto]),
    __metadata("design:returntype", Promise)
], OtelPublicController.prototype, "updateOtelSettings", null);
__decorate([
    (0, decorators_1.Post)('/test-trace'),
    (0, decorators_1.ApiKeyScope)('otel:manage'),
    (0, decorators_1.ApiSummary)('Test the connection to an OTLP collector'),
    (0, decorators_1.ApiDescription)('Send a single test span to the given OTLP collector and report whether it was accepted. This tests the supplied connection details without changing the stored configuration. Fields managed declaratively via environment variables are overridden with their effective value before the test is sent. Requires the `otel:manage` scope.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.OtelTestTraceResultPublicDto),
    __param(2, decorators_1.Body),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.OtelTestTraceRequestPublicDto, api_types_1.OtelSettingsQueryPublicDto]),
    __metadata("design:returntype", Promise)
], OtelPublicController.prototype, "testOtelTrace", null);
exports.OtelPublicController = OtelPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/settings/otel'),
    __metadata("design:paramtypes", [otel_settings_service_1.OtelSettingsService, otel_service_1.OtelService, backend_common_1.ModuleRegistry, publisher_service_1.Publisher])
], OtelPublicController);
//# sourceMappingURL=otel.public.controller.js.map