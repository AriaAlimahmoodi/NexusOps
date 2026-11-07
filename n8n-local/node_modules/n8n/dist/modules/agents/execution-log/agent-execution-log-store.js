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
exports.AgentExecutionLogStore = void 0;
const blob_storage_1 = require("@n8n/blob-storage");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const agent_execution_log_write_error_1 = require("./agent-execution-log-write.error");
const corrupted_agent_execution_log_error_1 = require("./corrupted-agent-execution-log.error");
const AGENT_EXECUTION_LOG_VERSION = 1;
let AgentExecutionLogStore = class AgentExecutionLogStore extends blob_storage_1.JsonStore {
    constructor(fsByteStore, errorReporter) {
        super({
            byteStores: { fs: fsByteStore },
            version: AGENT_EXECUTION_LOG_VERSION,
            key: ({ agentId, threadId, executionId }) => [
                'agents',
                encodeURIComponent(agentId),
                'threads',
                encodeURIComponent(threadId),
                'executions',
                encodeURIComponent(executionId),
                'log.json',
            ].join('/'),
            getId: (ref) => ref.executionId,
            createWriteError: (ref, cause) => new agent_execution_log_write_error_1.AgentExecutionLogWriteError(ref, cause),
            createCorruptedError: (ref, cause) => new corrupted_agent_execution_log_error_1.CorruptedAgentExecutionLogError(ref, cause),
            reportError: (error) => errorReporter.error(error),
        });
    }
};
exports.AgentExecutionLogStore = AgentExecutionLogStore;
exports.AgentExecutionLogStore = AgentExecutionLogStore = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.FsByteStoreService, n8n_core_1.ErrorReporter])
], AgentExecutionLogStore);
//# sourceMappingURL=agent-execution-log-store.js.map