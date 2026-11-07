"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionRedactionServiceProxy = void 0;
const di_1 = require("@n8n/di");
let ExecutionRedactionServiceProxy = class ExecutionRedactionServiceProxy {
    setExecutionRedaction(executionRedaction) {
        this.executionRedaction = executionRedaction;
    }
    async processExecution(execution, options) {
        if (!this.executionRedaction) {
            return execution;
        }
        return await this.executionRedaction.processExecution(execution, options);
    }
    async processExecutions(executions, options) {
        if (!this.executionRedaction)
            return;
        await this.executionRedaction.processExecutions(executions, options);
    }
};
exports.ExecutionRedactionServiceProxy = ExecutionRedactionServiceProxy;
exports.ExecutionRedactionServiceProxy = ExecutionRedactionServiceProxy = __decorate([
    (0, di_1.Service)()
], ExecutionRedactionServiceProxy);
//# sourceMappingURL=execution-redaction-proxy.service.js.map