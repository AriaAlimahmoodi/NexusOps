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
exports.AgentWakeService = exports.MAX_CONSECUTIVE_FAILED_WAKES = exports.WAKE_DEBOUNCE_MS = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const check_access_1 = require("../../../permissions.ee/check-access");
const publisher_service_1 = require("../../../scaling/pubsub/publisher.service");
const agent_conversation_state_service_1 = require("../agent-conversation-state.service");
const agent_execution_orchestrator_service_1 = require("../agent-execution-orchestrator.service");
const agent_sandbox_principal_1 = require("../agent-sandbox-principal");
const agent_background_job_service_1 = require("./agent-background-job.service");
const background_job_messages_1 = require("./background-job-messages");
const agent_chat_integration_1 = require("../integrations/agent-chat-integration");
const agent_background_job_repository_1 = require("../repositories/agent-background-job.repository");
const agent_repository_1 = require("../repositories/agent.repository");
const agent_memory_scope_1 = require("../utils/agent-memory-scope");
exports.WAKE_DEBOUNCE_MS = 5_000;
exports.MAX_CONSECUTIVE_FAILED_WAKES = 3;
const WAKE_LOCK_WAIT_MS = 250;
const WAKE_LOCK_TTL_MS = 30_000;
const HINT_TITLE_MAX_CHARS = 80;
let AgentWakeService = class AgentWakeService {
    constructor(jobRepository, conversationState, agentRepository, userRepository, integrationRegistry, orchestrator, lockService, publisher, instanceSettings, agentsConfig, logger, backgroundJobService) {
        this.jobRepository = jobRepository;
        this.conversationState = conversationState;
        this.agentRepository = agentRepository;
        this.userRepository = userRepository;
        this.integrationRegistry = integrationRegistry;
        this.orchestrator = orchestrator;
        this.lockService = lockService;
        this.publisher = publisher;
        this.instanceSettings = instanceSettings;
        this.agentsConfig = agentsConfig;
        this.logger = logger;
        this.backgroundJobService = backgroundJobService;
        this.timers = new Map();
        this.failures = new Map();
        this.activeWakes = new Set();
        this.logger = this.logger.scoped('agents');
    }
    async requestWake(threadId) {
        if (!this.agentsConfig.backgroundTasksEnabled)
            return;
        if (this.instanceSettings.isWorker) {
            await this.publisher.publishCommand({
                command: 'wake-agent-background-job',
                payload: { threadId },
            });
            return;
        }
        this.scheduleLocal(threadId);
    }
    handleWakeRelay({ threadId }) {
        if (!this.agentsConfig.backgroundTasksEnabled)
            return;
        this.scheduleLocal(threadId);
    }
    async drainUnconsumed() {
        if (!this.agentsConfig.backgroundTasksEnabled)
            return;
        const threadIds = await this.jobRepository.findThreadsWithUnconsumedMail();
        for (const threadId of threadIds)
            this.scheduleLocal(threadId);
    }
    isWakeActive(threadId) {
        return this.activeWakes.has(threadId);
    }
    async onParentTurnFinished(threadId) {
        this.failures.delete(threadId);
        await this.requestWake(threadId);
    }
    async getBackgroundUpdates(threadId, resourceId) {
        if (!this.agentsConfig.backgroundTasksEnabled)
            return undefined;
        if (this.activeWakes.has(threadId))
            return undefined;
        const [pending, stoppedHere] = await Promise.all([
            this.jobRepository.findWakeableUnconsumed(threadId),
            this.jobRepository.hasRequestedStop(threadId, resourceId),
        ]);
        const jobs = pending.filter((job) => job.parentResourceId === resourceId && job.status !== 'suspended' && !job.pauseRequestId);
        if (jobs.length === 0 && !stoppedHere)
            return undefined;
        const summaries = jobs
            .map((job) => {
            const title = job.title.replace(/[<>]/g, '').slice(0, HINT_TITLE_MAX_CHARS);
            return `${JSON.stringify(title)} (${job.status})`;
        })
            .join(', ');
        const updates = [];
        if (jobs.length > 0)
            updates.push(`${jobs.length} background job(s) settled: ${summaries}. Call check_background_jobs once before you finish this turn, only if you have not already checked in this turn. Collect all relevant jobs in that call.`);
        if (stoppedHere)
            updates.push('The user requested a stop for background tasks. Sub-agents pause at their checkpoints. Workflows stop through execution cancellation. One combined report follows when the selected tasks are inactive. Do not replace or resume these tasks automatically. First call resume_background_jobs when the latest user message explicitly asks to continue. If that message arrived before the report, ask the user to wait and retry. Cancelled workflows need new calls through their normal tools. Check conversation history and current jobs before repeating a workflow call.');
        return `${background_job_messages_1.AGENT_BACKGROUND_UPDATES_OPEN_TAG}${updates.join('\n')}${background_job_messages_1.AGENT_BACKGROUND_UPDATES_CLOSE_TAG}`;
    }
    scheduleLocal(threadId) {
        if (this.timers.has(threadId))
            return;
        const timer = setTimeout(() => {
            this.timers.delete(threadId);
            void this.attemptWake(threadId);
        }, exports.WAKE_DEBOUNCE_MS);
        timer.unref();
        this.timers.set(threadId, timer);
    }
    async attemptWake(threadId) {
        if (!this.agentsConfig.backgroundTasksEnabled)
            return;
        try {
            await this.lockService.withLease(backend_common_1.LockNamespace.KNOWN_LOCKS, `agent-background-wake:${threadId}`, async (signal) => await this.deliverInsideLease(threadId, signal), { waitTimeoutMs: WAKE_LOCK_WAIT_MS, leaseTtlMs: WAKE_LOCK_TTL_MS });
        }
        catch (error) {
            this.logger.warn('Failed to acquire the background job wake lease', { threadId, error });
        }
    }
    async deliverInsideLease(threadId, signal) {
        let pending = await this.jobRepository.findWakeableUnconsumed(threadId);
        const stopped = pending.filter((job) => job.pauseRequestId);
        if (stopped.length > 0) {
            for (const job of stopped)
                await this.backgroundJobService.retainLatestStopGroup(job);
            pending = await this.jobRepository.findWakeableUnconsumed(threadId);
        }
        for (const job of pending.filter((item) => item.status === 'suspended' && !item.pauseRequestId)) {
            if (signal.aborted)
                return;
            await this.deliverApproval(job, signal);
        }
        const settled = pending.filter((job) => job.status !== 'suspended');
        const first = settled[0];
        if (!first || signal.aborted)
            return;
        const jobs = settled.filter((job) => this.hasSameParentIdentity(job, first) &&
            (job.pauseRequestId ?? null) === (first.pauseRequestId ?? null));
        const generation = jobs
            .map((job) => `${job.id}:${job.status}:${job.updatedAt.toISOString()}`)
            .sort()
            .join(':');
        const failure = this.failures.get(threadId);
        if (failure?.generation === generation && failure.count >= exports.MAX_CONSECUTIVE_FAILED_WAKES) {
            return;
        }
        try {
            const { agent, identity } = await this.resolveWakeTarget(first);
            const { running, suspendedCheckpoint } = await this.conversationState.inspect(first.parentAgentId, threadId);
            if (running || suspendedCheckpoint !== null)
                return;
            await this.runWake(agent, identity, jobs, threadId, first.parentResourceId, signal);
            if (signal.aborted)
                return;
            await this.backgroundJobService.markMailConsumed(threadId, jobs.map((job) => job.id), Boolean(first.pauseRequestId));
            this.failures.delete(threadId);
            this.scheduleLocal(threadId);
        }
        catch {
            if (signal.aborted)
                return;
            this.recordFailure(threadId, generation);
        }
    }
    async deliverApproval(job, signal) {
        try {
            const approval = await this.backgroundJobService.getApproval(job);
            if (!approval)
                return;
            const { agent, identity } = await this.resolveWakeTarget(job);
            if (signal.aborted)
                return;
            await this.orchestrator.deliverBackgroundApproval({
                agentId: agent.id,
                projectId: agent.projectId,
                memory: { threadId: job.parentThreadId, resourceId: job.parentResourceId },
                identity,
            }, job.title, approval);
            if (signal.aborted)
                return;
            await this.jobRepository.markApprovalDelivered(job.id, approval.runId, approval.serializedState);
            this.failures.delete(job.parentThreadId);
            this.scheduleLocal(job.parentThreadId);
        }
        catch {
            if (!signal.aborted) {
                this.logger.warn('Failed to deliver a background approval', { jobId: job.id });
            }
        }
    }
    async resolveIdentity(resourceId, principalHash, projectId) {
        const draftUserId = (0, agent_memory_scope_1.userIdFromDraftChatMemoryResourceId)(resourceId);
        const userId = draftUserId ?? (0, agent_memory_scope_1.userIdFromProductionChatMemoryResourceId)(resourceId);
        if (userId) {
            const expectedHash = (0, agent_sandbox_principal_1.hashAgentSandboxPrincipal)({ type: 'n8n-user', userId });
            if (expectedHash !== principalHash) {
                throw new n8n_workflow_1.UnexpectedError('Wake identity does not match its principal');
            }
            const user = await this.userRepository.findByIdWithRole(userId);
            if (!user || user.disabled)
                throw new n8n_workflow_1.OperationalError('Wake user is no longer active');
            if (!(await (0, check_access_1.userHasScopes)(user, ['agent:execute'], false, { projectId }))) {
                throw new n8n_workflow_1.OperationalError('Wake user can no longer execute this agent');
            }
            return draftUserId
                ? { type: 'draft', user, principalHash: expectedHash }
                : {
                    type: 'published',
                    integrationType: api_types_1.N8N_CHAT_INTEGRATION_TYPE,
                    principalHash: expectedHash,
                };
        }
        const integrationType = (0, agent_memory_scope_1.integrationTypeFromMemoryResourceId)(resourceId);
        if (!integrationType ||
            !this.integrationRegistry.get(integrationType) ||
            !(0, agent_sandbox_principal_1.isAgentSandboxPrincipalHash)(principalHash)) {
            throw new n8n_workflow_1.UnexpectedError('Published wake identity is invalid');
        }
        return { type: 'published', integrationType, principalHash };
    }
    hasSameParentIdentity(job, other) {
        return (job.parentAgentId === other.parentAgentId &&
            job.parentResourceId === other.parentResourceId &&
            job.parentPrincipalHash === other.parentPrincipalHash);
    }
    recordFailure(threadId, generation) {
        const previous = this.failures.get(threadId);
        const count = previous?.generation === generation ? previous.count + 1 : 1;
        this.failures.set(threadId, { generation, count });
        this.logger.warn('Failed to deliver background job results to the parent agent', {
            threadId,
            attempt: count,
            reason: 'Wake run failed',
        });
    }
    async resolveWakeTarget(first) {
        const agent = await this.agentRepository.findById(first.parentAgentId);
        if (!agent)
            throw new n8n_workflow_1.OperationalError('Background job parent agent no longer exists');
        const identity = await this.resolveIdentity(first.parentResourceId, first.parentPrincipalHash, agent.projectId);
        return { agent, identity };
    }
    async runWake(agent, identity, jobs, threadId, resourceId, signal) {
        this.activeWakes.add(threadId);
        try {
            await this.orchestrator.executeForWake({
                agentId: agent.id,
                projectId: agent.projectId,
                message: (0, background_job_messages_1.formatWakeMessage)(jobs),
                pauseReport: Boolean(jobs[0]?.pauseRequestId),
                backgroundJobSignal: {
                    tasks: jobs.flatMap(({ id, title, kind, status }) => status === 'running' ||
                        status === 'suspended' ||
                        status === 'paused' ||
                        jobs[0]?.pauseRequestId
                        ? []
                        : [{ id, title, kind, status }]),
                },
                memory: { threadId, resourceId },
                identity,
                abortSignal: signal,
            });
        }
        finally {
            this.activeWakes.delete(threadId);
        }
    }
};
exports.AgentWakeService = AgentWakeService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('wake-agent-background-job', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AgentWakeService.prototype, "handleWakeRelay", null);
exports.AgentWakeService = AgentWakeService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_background_job_repository_1.AgentBackgroundJobRepository, agent_conversation_state_service_1.AgentConversationStateService, agent_repository_1.AgentRepository, db_1.UserRepository, agent_chat_integration_1.ChatIntegrationRegistry, agent_execution_orchestrator_service_1.AgentExecutionOrchestratorService, backend_common_1.LockService, publisher_service_1.Publisher, n8n_core_1.InstanceSettings, config_1.AgentsConfig, backend_common_1.Logger, agent_background_job_service_1.AgentBackgroundJobService])
], AgentWakeService);
//# sourceMappingURL=agent-wake.service.js.map