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
exports.AgentConversationStateService = void 0;
const di_1 = require("@n8n/di");
const n8n_checkpoint_storage_1 = require("./integrations/n8n-checkpoint-storage");
const agent_execution_repository_1 = require("./repositories/agent-execution.repository");
let AgentConversationStateService = class AgentConversationStateService {
    constructor(executionRepository, checkpointStorage) {
        this.executionRepository = executionRepository;
        this.checkpointStorage = checkpointStorage;
    }
    async inspect(agentId, threadId) {
        const [running, suspendedCheckpoint] = await Promise.all([
            this.executionRepository.existsRunningByThread(threadId),
            this.checkpointStorage.findSuspendedForThread(agentId, threadId),
        ]);
        return { running, suspendedCheckpoint };
    }
    async isResumable(agentId, runId) {
        const result = await this.checkpointStorage.getStatus(runId, agentId);
        return result.status === 'active' && result.checkpoint.status === 'suspended';
    }
};
exports.AgentConversationStateService = AgentConversationStateService;
exports.AgentConversationStateService = AgentConversationStateService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_execution_repository_1.AgentExecutionRepository, n8n_checkpoint_storage_1.N8NCheckpointStorage])
], AgentConversationStateService);
//# sourceMappingURL=agent-conversation-state.service.js.map