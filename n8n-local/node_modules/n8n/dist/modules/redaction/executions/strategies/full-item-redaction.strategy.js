"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FullItemRedactionStrategy = void 0;
const di_1 = require("@n8n/di");
let FullItemRedactionStrategy = class FullItemRedactionStrategy {
    constructor() {
        this.name = 'full-item-redaction';
    }
    requiresRedaction(_execution, _context) {
        return true;
    }
    async apply(execution, context) {
        const runData = execution.data.resultData.runData;
        if (!runData)
            return;
        const reason = context.enforceDynCredRedaction
            ? 'dynamic_credentials'
            : context.enforceCredentialUsabilityRedaction
                ? 'credential_inaccessible'
                : context.redactExecutionData === true
                    ? 'user_requested'
                    : context.redactedBySubWorkflow
                        ? 'sub_workflow_redaction_policy'
                        : 'workflow_redaction_policy';
        for (const nodeName of Object.keys(runData)) {
            for (const taskData of runData[nodeName]) {
                if (taskData.data) {
                    this.redactConnections(taskData.data, reason);
                }
                if (taskData.inputOverride) {
                    this.redactConnections(taskData.inputOverride, reason);
                }
                if (taskData.error) {
                    taskData.redactedError = this.redactError(taskData.error);
                    delete taskData.error;
                }
            }
        }
        const resultData = execution.data.resultData;
        if (resultData.error) {
            resultData.redactedError = this.redactError(resultData.error);
            delete resultData.error;
        }
        const executionData = execution.data.executionData;
        if (executionData) {
            for (const executeData of executionData.nodeExecutionStack ?? []) {
                if (executeData.data) {
                    this.redactConnections(executeData.data, reason);
                }
            }
            for (const runIndexMap of Object.values(executionData.waitingExecution ?? {})) {
                for (const waitingExecution of Object.values(runIndexMap)) {
                    this.redactConnections(waitingExecution, reason);
                }
            }
        }
        execution.data.redactionInfo = {
            ...execution.data.redactionInfo,
            isRedacted: true,
            reason,
            canReveal: context.userCanReveal,
            ...(reason === 'credential_inaccessible' && {
                credentialIds: [...context.inaccessibleCredentialIds],
            }),
        };
    }
    redactConnections(connections, reason) {
        for (const connectionType of Object.keys(connections)) {
            const outputs = connections[connectionType];
            for (const items of outputs) {
                if (items) {
                    for (const item of items) {
                        this.redactItem(item, reason);
                    }
                }
            }
        }
    }
    redactItem(item, reason) {
        const redactedError = item.error ? this.redactError(item.error) : undefined;
        delete item.error;
        item.json = {};
        delete item.binary;
        item.redaction = {
            redacted: true,
            reason,
            ...(redactedError !== undefined && { error: redactedError }),
        };
    }
    redactError(error) {
        const result = { type: error.name };
        if (error.name === 'NodeApiError') {
            result.httpCode =
                ('httpCode' in error ? error.httpCode : null) ?? null;
        }
        return result;
    }
};
exports.FullItemRedactionStrategy = FullItemRedactionStrategy;
exports.FullItemRedactionStrategy = FullItemRedactionStrategy = __decorate([
    (0, di_1.Service)()
], FullItemRedactionStrategy);
//# sourceMappingURL=full-item-redaction.strategy.js.map