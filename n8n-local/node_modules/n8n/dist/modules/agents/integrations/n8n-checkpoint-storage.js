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
exports.N8NCheckpointStorage = exports.CHECKPOINT_RECONCILIATION_OVERFLOW = void 0;
const agents_1 = require("@n8n/agents");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const agent_sandbox_principal_1 = require("../agent-sandbox-principal");
const agent_checkpoint_repository_1 = require("../repositories/agent-checkpoint.repository");
const agent_execution_repository_1 = require("../repositories/agent-execution.repository");
const agent_execution_thread_repository_1 = require("../repositories/agent-execution-thread.repository");
const agent_message_queue_repository_1 = require("../repositories/agent-message-queue.repository");
const agent_queued_message_1 = require("../types/agent-queued-message");
const delegated_child_checkpoints_1 = require("../utils/delegated-child-checkpoints");
function stripStateFileData(state) {
    if (!state.messageList)
        return state;
    return {
        ...state,
        messageList: {
            ...state.messageList,
            messages: state.messageList.messages.map(agents_1.stripHydratedFileData),
        },
    };
}
const MAX_SANDBOX_RECONCILIATION_CHECKPOINTS = 100;
exports.CHECKPOINT_RECONCILIATION_OVERFLOW = Symbol('checkpoint-reconciliation-overflow');
let N8NCheckpointStorage = class N8NCheckpointStorage {
    constructor(agentCheckpointRepository, logger, agentsConfig, txRunner, executionRepository, threadRepository, queueRepository) {
        this.agentCheckpointRepository = agentCheckpointRepository;
        this.logger = logger;
        this.agentsConfig = agentsConfig;
        this.txRunner = txRunner;
        this.executionRepository = executionRepository;
        this.threadRepository = threadRepository;
        this.queueRepository = queueRepository;
        this.logger = this.logger.scoped('agents');
    }
    getStorage(agentId) {
        return {
            save: async (key, state) => await this.save(key, state, agentId),
            load: async (key) => await this.load(key, agentId),
            claimForResume: async (key, state) => await this.claimForResume(key, state, agentId),
            delete: async (key, state) => {
                if (!state)
                    return await this.delete(key, agentId);
                await this.withExecutionOwnership(state, async (ctx) => {
                    await this.agentCheckpointRepository.expireByRunIdAndAgentId(key, agentId, ctx);
                });
            },
        };
    }
    async getActiveRunIdsForSandbox(agentId, principalHash) {
        const checkpoints = await this.agentCheckpointRepository.findForSandboxReconciliation(agentId);
        if (checkpoints.length > MAX_SANDBOX_RECONCILIATION_CHECKPOINTS) {
            return exports.CHECKPOINT_RECONCILIATION_OVERFLOW;
        }
        const runIds = new Set();
        for (const checkpoint of checkpoints) {
            if (checkpoint.expired || checkpoint.state === null)
                continue;
            try {
                const state = (0, n8n_workflow_1.jsonParse)(checkpoint.state);
                if (state.status !== 'running' && state.status !== 'suspended')
                    continue;
                const scope = (0, agent_sandbox_principal_1.decodeAgentSandboxHostMetadata)(state.persistence?.hostMetadata);
                if (scope?.principalHash === principalHash)
                    runIds.add(checkpoint.runId);
            }
            catch {
            }
        }
        return runIds;
    }
    async save(key, checkpointState, agentId) {
        const state = stripStateFileData(checkpointState);
        await this.withExecutionOwnership(state, async (ctx) => {
            const existing = await this.agentCheckpointRepository.findByRunId(key, ctx);
            if (existing && existing.agentId !== agentId) {
                throw new n8n_workflow_1.UnexpectedError('Agent checkpoint is owned by a different agent');
            }
            const checkpoint = this.agentCheckpointRepository.create({
                ...existing,
                runId: key,
                agentId,
                threadId: state.persistence?.threadId ?? null,
                state: JSON.stringify(state),
                expired: false,
            });
            await this.agentCheckpointRepository.saveCheckpoint(checkpoint, ctx);
            const executionId = (0, agent_queued_message_1.checkpointExecutionId)(state);
            const threadId = state.persistence?.threadId;
            if (state.status === 'suspended' && executionId && threadId) {
                await this.executionRepository.closeSteering(threadId, executionId, ctx);
                await this.queueRepository.releaseSteering(threadId, executionId, ctx);
            }
        });
    }
    async withExecutionOwnership(state, write) {
        const executionId = (0, agent_queued_message_1.checkpointExecutionId)(state);
        if (!executionId)
            return await write({});
        await this.txRunner.run({}, async (ctx) => {
            const threadId = state.persistence?.threadId;
            if (!threadId || !(await this.threadRepository.lockById(threadId, ctx))) {
                throw new n8n_workflow_1.OperationalError('Agent execution no longer owns this session');
            }
            const execution = await this.executionRepository.findExecution(executionId, ctx);
            const active = await this.queueRepository.findActive(threadId, ctx);
            if (execution?.status !== 'running' ||
                execution.threadId !== threadId ||
                (active && active.executionId !== executionId)) {
                throw new n8n_workflow_1.OperationalError('Agent execution no longer owns this session');
            }
            await write(ctx);
        });
    }
    expiryCutoff() {
        return new Date(Date.now() - this.agentsConfig.checkpointTtlSeconds * constants_1.Time.seconds.toMilliseconds);
    }
    async load(key, agentId) {
        const checkpoint = await this.agentCheckpointRepository.findByRunIdAndAgentId(key, agentId);
        if (!checkpoint)
            return undefined;
        if (checkpoint.expired ||
            checkpoint.state === null ||
            checkpoint.updatedAt < this.expiryCutoff()) {
            throw new n8n_workflow_1.UserError('This action has expired and cannot be resumed');
        }
        const state = (0, n8n_workflow_1.jsonParse)(checkpoint.state);
        if (state.status !== 'suspended') {
            throw new n8n_workflow_1.UserError('This action has already been handled');
        }
        return state;
    }
    async claimForResume(key, checkpointState, agentId) {
        const state = stripStateFileData(checkpointState);
        return await this.agentCheckpointRepository.claimForResume(key, agentId, JSON.stringify(state), JSON.stringify({ ...state, status: 'running' }), this.expiryCutoff());
    }
    async cancelSuspended(key, state, agentId) {
        if (state.status !== 'suspended')
            return false;
        const executionId = (0, agent_queued_message_1.checkpointExecutionId)(state);
        if (!executionId)
            return await this.agentCheckpointRepository.cancelSuspended(key, agentId, JSON.stringify(state));
        return await this.txRunner.run({}, async (ctx) => {
            const threadId = state.persistence?.threadId;
            if (!threadId || !(await this.threadRepository.lockById(threadId, ctx)))
                return false;
            const running = await this.executionRepository.findRunningByThread(threadId, ctx);
            if (running.some(({ id }) => id !== executionId))
                return false;
            return await this.agentCheckpointRepository.cancelSuspended(key, agentId, JSON.stringify(state), ctx);
        });
    }
    async findSuspendedForThread(agentId, threadId, ctx = {}) {
        const rows = await this.agentCheckpointRepository.findActiveForThread(agentId, threadId, this.expiryCutoff(), ctx);
        for (const row of rows) {
            const checkpoint = this.parseSuspendedState(row.state, threadId);
            if (checkpoint)
                return checkpoint;
        }
        return null;
    }
    async hasNoConflictingThreadResource(agentId, threadId, resourceId) {
        const rows = await this.agentCheckpointRepository.findRetainedByThreadId(threadId);
        for (const row of rows) {
            if (!row.state)
                continue;
            const state = (0, n8n_workflow_1.jsonParse)(row.state, { fallbackValue: null });
            if (state?.persistence?.threadId === threadId &&
                (row.agentId !== agentId || state.persistence.resourceId !== resourceId)) {
                return false;
            }
        }
        return true;
    }
    async findDelegatedSuspensionForThread(agentId, threadId) {
        const rows = await this.agentCheckpointRepository.findActiveForThread(agentId, threadId, this.expiryCutoff());
        for (const row of rows) {
            if (!row.state)
                continue;
            const checkpoint = (0, n8n_workflow_1.jsonParse)(row.state);
            if (checkpoint.status !== 'suspended' ||
                !checkpoint.persistence?.delegated ||
                checkpoint.persistence.threadId !== threadId)
                continue;
            return {
                runId: row.runId,
                checkpoint,
                serializedState: row.state,
                updatedAt: row.updatedAt,
                expiresAt: new Date(row.updatedAt.getTime() +
                    this.agentsConfig.checkpointTtlSeconds * constants_1.Time.seconds.toMilliseconds),
            };
        }
        return undefined;
    }
    async deleteDelegatedForThread(agentId, threadId) {
        const rows = await this.agentCheckpointRepository.findRetainedByThreadId(threadId);
        const visited = new Set();
        for (const row of rows) {
            if (row.agentId === agentId)
                await this.deleteDelegation(row.runId, agentId, visited);
        }
    }
    async markUserPaused(agentId, suspension) {
        return await this.agentCheckpointRepository.markUserPaused(suspension.runId, agentId, suspension.serializedState, JSON.stringify({ ...suspension.checkpoint, finishReason: 'paused' }), suspension.updatedAt);
    }
    async deleteDelegation(runId, agentId, visited) {
        const identity = `${agentId}\0${runId}`;
        if (visited.has(identity))
            return;
        visited.add(identity);
        const status = await this.getStatus(runId, agentId);
        const checkpoint = status.status === 'not-found' ? undefined : status.checkpoint;
        const children = checkpoint ? (0, delegated_child_checkpoints_1.getDelegatedChildCheckpoints)(checkpoint, agentId) : [];
        for (const child of children)
            await this.deleteDelegation(child.runId, child.agentId, visited);
        await this.delete(runId, agentId);
    }
    parseSuspendedState(state, threadId) {
        if (!state)
            return null;
        let parsed;
        try {
            parsed = (0, n8n_workflow_1.jsonParse)(state);
        }
        catch {
            return null;
        }
        if (parsed?.status !== 'suspended' || parsed.persistence?.delegated === true)
            return null;
        if (parsed.persistence?.threadId !== threadId)
            return null;
        return parsed;
    }
    async getStatus(key, agentId, ctx = {}) {
        const checkpoint = await this.agentCheckpointRepository.findByRunIdAndAgentId(key, agentId, ctx);
        if (!checkpoint)
            return { status: 'not-found' };
        if (checkpoint.state === null)
            return { status: 'expired' };
        const state = (0, n8n_workflow_1.jsonParse)(checkpoint.state);
        if (checkpoint.expired || checkpoint.updatedAt < this.expiryCutoff())
            return { status: 'expired', checkpoint: state };
        return { status: 'active', checkpoint: state };
    }
    async delete(key, agentId) {
        await this.agentCheckpointRepository.expireByRunIdAndAgentId(key, agentId);
    }
    async pruneStaleSuspensions() {
        const ttlMs = this.agentsConfig.checkpointTtlSeconds * constants_1.Time.seconds.toMilliseconds;
        const cutoffDate = new Date(Date.now() - ttlMs);
        const count = await this.agentCheckpointRepository.markExpired(cutoffDate);
        if (count > 0) {
            this.logger.info('Marked stale agent checkpoints as expired', { count });
        }
        else {
            this.logger.debug('No stale agent checkpoints to expire');
        }
    }
};
exports.N8NCheckpointStorage = N8NCheckpointStorage;
exports.N8NCheckpointStorage = N8NCheckpointStorage = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_checkpoint_repository_1.AgentCheckpointRepository, backend_common_1.Logger, config_1.AgentsConfig, db_1.TransactionRunner, agent_execution_repository_1.AgentExecutionRepository, agent_execution_thread_repository_1.AgentExecutionThreadRepository, agent_message_queue_repository_1.AgentMessageQueueRepository])
], N8NCheckpointStorage);
//# sourceMappingURL=n8n-checkpoint-storage.js.map