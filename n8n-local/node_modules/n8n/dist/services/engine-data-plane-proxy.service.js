"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineDataPlaneProxyService = exports.isStartRefusedBeforeSave = exports.EngineDidNotAdmitError = exports.EngineRejectedWorkflowError = void 0;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
class EngineRejectedWorkflowError extends n8n_workflow_1.UserError {
}
exports.EngineRejectedWorkflowError = EngineRejectedWorkflowError;
class EngineDidNotAdmitError extends n8n_workflow_1.OperationalError {
}
exports.EngineDidNotAdmitError = EngineDidNotAdmitError;
const isStartRefusedBeforeSave = (error) => error instanceof EngineRejectedWorkflowError || error instanceof EngineDidNotAdmitError;
exports.isStartRefusedBeforeSave = isStartRefusedBeforeSave;
let EngineDataPlaneProxyService = class EngineDataPlaneProxyService {
    constructor() {
        this.provider = null;
    }
    registerProvider(provider) {
        this.provider = provider;
    }
    isAvailable() {
        return this.provider !== null;
    }
    async searchExecutions(request) {
        if (!this.provider)
            return { items: [], nextCursor: null, total: 0 };
        return await this.provider.searchExecutions(request);
    }
    async startExecution(request) {
        if (!this.provider) {
            throw new n8n_workflow_1.UserError('Engine v2 is not available. Enable the `engine-v2` module with N8N_ENABLED_MODULES.');
        }
        return await this.provider.startExecution(request);
    }
    async getExecution(id, options) {
        if (!this.provider)
            return undefined;
        return await this.provider.getExecution(id, options);
    }
    async cancelExecution(id) {
        if (!this.provider)
            return undefined;
        return await this.provider.cancelExecution(id);
    }
};
exports.EngineDataPlaneProxyService = EngineDataPlaneProxyService;
exports.EngineDataPlaneProxyService = EngineDataPlaneProxyService = __decorate([
    (0, di_1.Service)()
], EngineDataPlaneProxyService);
//# sourceMappingURL=engine-data-plane-proxy.service.js.map