"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedactionModule = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
let RedactionModule = class RedactionModule {
    async init() {
        await import('./redaction-context-hook.js');
        await import('./dynamic-credentials-context-hook.js');
        await import('./instance-redaction-enforcement.service.js');
        const { ExecutionRedactionService } = await import('./executions/execution-redaction.service.js');
        const executionRedactionService = di_1.Container.get(ExecutionRedactionService);
        await executionRedactionService.init();
        const executionRedactionServiceProxy = di_1.Container.get(backend_services_1.ExecutionRedactionServiceProxy);
        executionRedactionServiceProxy.setExecutionRedaction(executionRedactionService);
    }
};
exports.RedactionModule = RedactionModule;
exports.RedactionModule = RedactionModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'redaction' })
], RedactionModule);
//# sourceMappingURL=redaction.module.js.map