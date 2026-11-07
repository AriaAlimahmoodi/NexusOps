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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtelModule = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
let OtelModule = class OtelModule {
    async init() {
        const { OtelLifecycleHandler } = await import('./otel-lifecycle-handler.js');
        di_1.Container.get(OtelLifecycleHandler).init();
        const { OtelService } = await import('./otel.service.js');
        await di_1.Container.get(OtelService).init();
        if (di_1.Container.get(n8n_core_1.InstanceSettings).instanceType === 'main') {
            await import('./otel-settings.controller.js');
        }
    }
    async settings() {
        const { OtelSettingsService } = await import('./otel-settings.service.js');
        const { enabled } = di_1.Container.get(OtelSettingsService).getSettings();
        return { enabled };
    }
    async context() {
        const { ExecutionLevelTracer } = await import('./execution-level-tracer.js');
        const tracer = di_1.Container.get(ExecutionLevelTracer);
        return {
            injectTraceHeaders: tracer.injectTraceHeaders.bind(tracer),
        };
    }
    async shutdown() {
        const { OtelService } = await import('./otel.service.js');
        await di_1.Container.get(OtelService).shutdown();
    }
};
exports.OtelModule = OtelModule;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OtelModule.prototype, "shutdown", null);
exports.OtelModule = OtelModule = __decorate([
    (0, decorators_1.BackendModule)({
        name: 'otel',
        instanceTypes: ['main', 'worker', 'webhook'],
    })
], OtelModule);
//# sourceMappingURL=otel.module.js.map