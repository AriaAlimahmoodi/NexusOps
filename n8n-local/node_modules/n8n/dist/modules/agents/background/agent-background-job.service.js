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
exports.AgentBackgroundJobService = exports.EXECUTION_OUTCOME_UNKNOWN_ERROR = exports.WORKFLOW_JOB_RESULT_MAX_CHARS = exports.EXPIRED_BACKGROUND_CHECKPOINT_ERROR = exports.SETTLED_JOB_RETENTION_MS = exports.SUB_AGENT_BACKGROUND_TIMEOUT_MS = exports.MAX_RUNNING_JOBS_PER_THREAD = void 0;
exports.settlementStatusForExecution = settlementStatusForExecution;
exports.collectResultData = collectResultData;
exports.serializeWorkflowJobResult = serializeWorkflowJobResult;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const node_crypto_1 = require("node:crypto");
const uuid_1 = require("uuid");
const n8n_workflow_1 = require("n8n-workflow");
const execution_persistence_1 = require("../../../executions/execution-persistence");
const publisher_service_1 = require("../../../scaling/pubsub/publisher.service");
const agent_execution_update_broadcaster_1 = require("../agent-execution-update-broadcaster");
const agent_background_job_repository_1 = require("../repositories/agent-background-job.repository");
const agent_execution_repository_1 = require("../repositories/agent-execution.repository");
const agent_message_repository_1 = require("../repositories/agent-message.repository");
const agent_sandbox_principal_1 = require("../agent-sandbox-principal");
const agent_chat_suspension_cards_1 = require("../integrations/agent-chat-suspension-cards");
const n8n_checkpoint_storage_1 = require("../integrations/n8n-checkpoint-storage");
const background_job_messages_1 = require("./background-job-messages");
const sub_agent_background_state_1 = require("./sub-agent-background-state");
exports.MAX_RUNNING_JOBS_PER_THREAD = 5;
exports.SUB_AGENT_BACKGROUND_TIMEOUT_MS = 30 * constants_1.Time.minutes.toMilliseconds;
exports.SETTLED_JOB_RETENTION_MS = 30 * constants_1.Time.days.toMilliseconds;
exports.EXPIRED_BACKGROUND_CHECKPOINT_ERROR = 'This background task checkpoint has expired and cannot be resumed';
exports.WORKFLOW_JOB_RESULT_MAX_CHARS = 8000;
exports.EXECUTION_OUTCOME_UNKNOWN_ERROR = 'The workflow execution was not retained (check the workflow’s save settings), so its outcome is unknown — it may have completed. Do not run the workflow again without checking for its effects.';
function settlementStatusForExecution(status) {
    if (status === 'success')
        return 'completed';
    if (status === 'canceled')
        return 'cancelled';
    return 'failed';
}
function outputItemsFromNodeRuns(nodeRuns) {
    const lastRun = nodeRuns[nodeRuns.length - 1];
    if (!lastRun?.data?.main)
        return [];
    return lastRun.data.main.flatMap((items) => items ?? []).map((item) => item.json);
}
function collectResultData(runData, allOutputs) {
    const resultData = {};
    if (allOutputs) {
        for (const [nodeName, nodeRuns] of Object.entries(runData)) {
            const outputItems = outputItemsFromNodeRuns(nodeRuns);
            if (outputItems.length > 0) {
                resultData[nodeName] = outputItems;
            }
        }
        return resultData;
    }
    const nodeNames = Object.keys(runData);
    const lastNodeName = nodeNames[nodeNames.length - 1];
    if (lastNodeName) {
        const outputItems = outputItemsFromNodeRuns(runData[lastNodeName]);
        if (outputItems.length > 0) {
            resultData[lastNodeName] = outputItems;
        }
    }
    return resultData;
}
function serializeWorkflowJobResult(resultData) {
    if (!resultData || Object.keys(resultData).length === 0)
        return null;
    let serialized;
    try {
        serialized = JSON.stringify(resultData);
    }
    catch {
        return null;
    }
    if (serialized.length <= exports.WORKFLOW_JOB_RESULT_MAX_CHARS)
        return serialized;
    return `${serialized.slice(0, exports.WORKFLOW_JOB_RESULT_MAX_CHARS)}… [truncated, full data on execution]`;
}
function latestStopGroup(jobs) {
    const latestId = jobs
        .flatMap((job) => (job.pauseRequestId ? [job.pauseRequestId] : []))
        .sort((a, b) => Number(b[14] === '7') - Number(a[14] === '7') || b.localeCompare(a))[0];
    return latestId ? jobs.filter((job) => job.pauseRequestId === latestId) : [];
}
let AgentBackgroundJobService = class AgentBackgroundJobService {
    constructor(jobRepository, executionRepository, executionPersistence, publisher, logger, agentsConfig, updateBroadcaster, checkpointStorage, messageRepository) {
        this.jobRepository = jobRepository;
        this.executionRepository = executionRepository;
        this.executionPersistence = executionPersistence;
        this.publisher = publisher;
        this.logger = logger;
        this.agentsConfig = agentsConfig;
        this.updateBroadcaster = updateBroadcaster;
        this.checkpointStorage = checkpointStorage;
        this.messageRepository = messageRepository;
        this.abortControllers = new Map();
        this.logger = this.logger.scoped('agents');
    }
    async registerSubAgentJob(params) {
        const inserted = await this.jobRepository.insertSubAgentJobIfCapacity({
            ...params,
            kind: 'subagent',
            timeoutAt: new Date(Date.now() + exports.SUB_AGENT_BACKGROUND_TIMEOUT_MS),
        }, exports.MAX_RUNNING_JOBS_PER_THREAD);
        if (!inserted)
            return { status: 'limit-reached' };
        this.updateBroadcaster.notifyBackgroundJobsUpdated(params.parentAgentId, params.parentThreadId);
        return { status: 'started', jobId: params.id };
    }
    async registerWorkflowJob(params) {
        const { executionId, ...job } = params;
        const outcome = await this.jobRepository.insertWorkflowJobOrGetExisting({
            ...job,
            kind: 'workflow',
            childExecutionId: executionId,
        });
        if (outcome.inserted) {
            this.updateBroadcaster.notifyBackgroundJobsUpdated(params.parentAgentId, params.parentThreadId);
        }
        return { status: 'started', jobId: outcome.inserted ? params.id : outcome.existing.id };
    }
    async settleWorkflowJobByExecutionId(executionId, settlement, runData) {
        const job = await this.jobRepository.findRunningWorkflowJobByExecutionId(executionId);
        if (!job)
            return false;
        if (job.pauseRequestId && runData) {
            settlement = {
                ...settlement,
                result: serializeWorkflowJobResult(collectResultData(runData, true)),
            };
        }
        return await this.settle(job.id, settlement);
    }
    async settle(jobId, settlement, expected) {
        const controller = this.abortControllers.get(jobId);
        let releaseController = true;
        try {
            const settled = await this.jobRepository.settleIfActive(jobId, settlement, expected);
            releaseController = settled;
            const job = await this.findJob(jobId);
            if (job && job.status !== 'running' && job.status !== 'suspended' && job.status !== 'paused')
                await this.clearChildCheckpoint(job);
            if (!settled || !job)
                return settled;
            if (job.pauseRequestId)
                await this.retainLatestStopGroup(job);
            this.notifyJobUpdate(job);
            await this.requestWakeSafely(job.parentThreadId);
            return true;
        }
        finally {
            if (controller && releaseController)
                this.unregisterAbortController(jobId, controller);
        }
    }
    async getCheckpoint(job) {
        if (job.kind !== 'subagent' ||
            !job.subAgentId ||
            !job.childThreadId ||
            !['running', 'suspended', 'paused'].includes(job.status))
            return undefined;
        const suspension = await this.checkpointStorage.findDelegatedSuspensionForThread(job.subAgentId, job.childThreadId);
        if (!suspension)
            return undefined;
        const { checkpoint } = suspension;
        const metadata = (0, sub_agent_background_state_1.readBackgroundSubAgentState)(checkpoint);
        const scope = (0, agent_sandbox_principal_1.decodeAgentSandboxHostMetadata)(checkpoint.persistence?.hostMetadata);
        if (!scope ||
            metadata?.jobId !== job.id ||
            metadata.resumeContext.agentId !== job.subAgentId ||
            checkpoint.persistence?.resourceId !== job.parentResourceId ||
            scope.principalHash !== job.parentPrincipalHash)
            return undefined;
        return { ...suspension, metadata, scope };
    }
    async getApproval(job) {
        const suspension = await this.getCheckpoint(job);
        if (!suspension)
            return undefined;
        const { checkpoint } = suspension;
        const pending = Object.values(checkpoint.pendingToolCalls).find((call) => call.suspended && (0, agent_chat_suspension_cards_1.isApprovalSuspendPayload)(call.suspendPayload));
        if (!pending?.suspended || pending.runId !== suspension.runId)
            return undefined;
        const token = (0, node_crypto_1.createHash)('sha256')
            .update(suspension.serializedState)
            .update(suspension.updatedAt.toISOString())
            .digest('base64url')
            .slice(0, 22);
        return { ...suspension, pending, token };
    }
    async requestPause(parentAgentId, parentThreadId, parentResourceId) {
        await this.pruneExpiredPausedJobs(parentThreadId);
        await this.jobRepository.requestPause(parentAgentId, parentThreadId, parentResourceId, (0, uuid_1.v7)());
        this.updateBroadcaster.notifyBackgroundJobsUpdated(parentAgentId, parentThreadId);
        const jobs = await this.jobRepository.findByParentThread(parentThreadId);
        const selected = jobs.filter((job) => job.parentAgentId === parentAgentId &&
            job.parentResourceId === parentResourceId &&
            job.pauseRequestId &&
            !job.notifiedAt);
        const results = await Promise.allSettled(selected.map(async (job) => {
            if (job.kind === 'workflow' && job.status === 'running')
                await this.cancelWorkflowJob(job);
            else if (job.kind === 'subagent' && job.status === 'suspended')
                await this.pause(job.id);
        }));
        await this.requestWakeSafely(parentThreadId);
        const failure = results.find((result) => result.status === 'rejected');
        if (failure)
            throw failure.reason;
    }
    async shouldPause(jobId) {
        const job = await this.jobRepository.findById(jobId);
        return Boolean(job?.pauseRequestId);
    }
    async preparePausedResume(parentAgentId, parentThreadId, parentResourceId, executionId) {
        const execution = await this.executionRepository.findExecution(executionId);
        if (execution?.threadId !== parentThreadId || execution.status !== 'running') {
            return { status: 'unavailable', jobs: [] };
        }
        const inputs = (await this.messageRepository.findExecutionInputs([executionId])).get(executionId) ?? [];
        const userInput = inputs
            .filter((message) => message.role === 'user' &&
            !message.origin?.hidden &&
            message.threadId === parentThreadId &&
            message.resourceId === parentResourceId)
            .at(-1);
        if (!userInput)
            return { status: 'unavailable', jobs: [] };
        await this.pruneExpiredPausedJobs(parentThreadId);
        await this.releaseStaleResumeReservations(parentAgentId, parentThreadId, parentResourceId, execution.startedAt ?? execution.createdAt);
        const jobs = (await this.jobRepository.findByParentThread(parentThreadId)).filter((job) => job.parentAgentId === parentAgentId &&
            job.parentResourceId === parentResourceId &&
            job.pauseRequestId);
        if (jobs.some((job) => job.status === 'running' ||
            job.status === 'suspended' ||
            !job.notifiedAt ||
            userInput.createdAt <= job.notifiedAt)) {
            return { status: 'stopping', jobs: [] };
        }
        const stoppedGroup = latestStopGroup(jobs);
        const workflowsToRestart = stoppedGroup
            .filter((job) => job.kind === 'workflow' && job.status === 'cancelled')
            .map((job) => ({
            jobId: job.id,
            title: job.title,
            workflowId: job.workflowId,
            previousExecutionId: job.childExecutionId,
        }));
        const paused = stoppedGroup.filter((job) => job.kind === 'subagent' && job.status === 'paused');
        const latestId = paused[0]?.pauseRequestId;
        const timeoutAt = new Date(Date.now() + exports.SUB_AGENT_BACKGROUND_TIMEOUT_MS);
        if (!latestId) {
            if (workflowsToRestart.length === 0 &&
                stoppedGroup.some((job) => job.error === exports.EXPIRED_BACKGROUND_CHECKPOINT_ERROR))
                return { status: 'expired', jobs: [] };
            return { status: 'ready', jobs: [], timeoutAt, workflowsToRestart };
        }
        const admission = await this.jobRepository.reservePausedGroup(parentThreadId, latestId, paused.map((job) => job.id), timeoutAt, exports.MAX_RUNNING_JOBS_PER_THREAD);
        if (admission === 'limit-reached')
            return { status: 'limit-reached', jobs: [] };
        if (admission !== 'reserved')
            return { status: 'stopping', jobs: [] };
        return { status: 'ready', jobs: paused, timeoutAt, workflowsToRestart };
    }
    async releaseStaleResumeReservations(parentAgentId, parentThreadId, parentResourceId, executionStartedAt) {
        const requested = await this.jobRepository.findRequestedPauses(parentThreadId);
        let restored = false;
        for (const job of requested) {
            if (job.parentAgentId === parentAgentId &&
                job.parentResourceId === parentResourceId &&
                job.status === 'suspended' &&
                job.pauseRequestId &&
                job.notifiedAt &&
                job.timeoutAt &&
                job.updatedAt < executionStartedAt)
                restored = (await this.releaseResumeReservations([job], job.timeoutAt)) || restored;
        }
        if (restored)
            await this.pruneExpiredPausedJobs(parentThreadId);
    }
    async releaseResumeReservations(jobs, timeoutAt) {
        let released = false;
        for (const job of jobs) {
            if (!job.pauseRequestId)
                continue;
            try {
                if (await this.jobRepository.releasePausedResume(job.id, job.pauseRequestId, timeoutAt)) {
                    this.notifyJobUpdate(job);
                    released = true;
                }
            }
            catch (error) {
                this.logger.warn('Failed to release background resume capacity', { jobId: job.id, error });
            }
        }
        return released;
    }
    async pruneExpiredPausedJobs(parentThreadId, signal) {
        const cutoff = new Date(Date.now() - this.agentsConfig.checkpointTtlSeconds * constants_1.Time.seconds.toMilliseconds);
        for (const job of await this.jobRepository.findPausedWithoutCheckpoint(cutoff, parentThreadId)) {
            if (signal?.aborted) {
                return;
            }
            await this.settle(job.id, { status: 'failed', error: exports.EXPIRED_BACKGROUND_CHECKPOINT_ERROR }, { status: 'paused', pauseRequestId: job.pauseRequestId });
        }
    }
    async retainLatestStopGroup(job) {
        const replaced = await this.jobRepository.retainLatestStopGroup(job.parentAgentId, job.parentThreadId, job.parentResourceId, background_job_messages_1.REPLACED_PAUSE_GROUP_NOTICE);
        for (const previous of replaced)
            await this.clearChildCheckpoint(previous);
    }
    async notifyResumed(jobId) {
        const job = await this.findJob(jobId);
        if (!job)
            return;
        this.notifyJobUpdate(job);
        if (job.status === 'suspended')
            await this.requestWakeSafely(job.parentThreadId);
    }
    async pause(jobId) {
        const job = await this.jobRepository.findById(jobId);
        if (!job?.pauseRequestId ||
            job.notifiedAt ||
            (job.status !== 'running' && job.status !== 'suspended'))
            return false;
        let suspension = await this.getCheckpoint(job);
        if (!suspension || !job.subAgentId)
            return false;
        if (suspension.checkpoint.finishReason !== 'paused') {
            if (!(await this.getApproval(job)))
                return false;
            if (!(await this.checkpointStorage.markUserPaused(job.subAgentId, suspension)))
                return false;
            suspension = await this.getCheckpoint(job);
            if (!suspension)
                return false;
        }
        const paused = await this.jobRepository.pauseIfRequested(job, (0, background_job_messages_1.formatPauseHandoff)(suspension.checkpoint), suspension.runId, suspension.serializedState);
        if (paused) {
            await this.retainLatestStopGroup(job);
            this.notifyJobUpdate(job);
            await this.requestWakeSafely(job.parentThreadId);
        }
        return paused;
    }
    async suspend(jobId) {
        if (await this.pause(jobId))
            return true;
        const job = await this.jobRepository.findById(jobId);
        if (!job)
            return false;
        if (job.status !== 'running') {
            if (job.status !== 'suspended' && job.status !== 'paused')
                await this.clearChildCheckpoint(job);
            return false;
        }
        const approval = await this.getApproval(job);
        if (!approval)
            return false;
        if (!(await this.jobRepository.suspendIfRunning(jobId, approval.expiresAt, approval.runId, approval.serializedState))) {
            const latest = await this.jobRepository.findById(jobId);
            if (latest &&
                latest.status !== 'running' &&
                latest.status !== 'suspended' &&
                latest.status !== 'paused')
                await this.clearChildCheckpoint(latest);
            return false;
        }
        this.notifyJobUpdate(job);
        await this.requestWakeSafely(job.parentThreadId);
        return true;
    }
    async settlePausedSubAgent(jobId, expected) {
        if (await this.suspend(jobId))
            return;
        const job = await this.jobRepository.findById(jobId);
        if (job?.kind !== 'subagent' || job.status !== expected.status || !job.childThreadId)
            return;
        if (await this.executionRepository.existsRunningByThread(job.childThreadId))
            return;
        if (await this.getCheckpoint(job))
            return;
        await this.settle(jobId, { status: 'failed', error: exports.EXPIRED_BACKGROUND_CHECKPOINT_ERROR }, expected);
    }
    async resume(jobId, timeoutAt) {
        const resumed = await this.jobRepository.resumeIfSuspended(jobId, timeoutAt);
        if (resumed)
            await this.notifyJobUpdateById(jobId);
        return resumed;
    }
    async clearChildCheckpoint(job) {
        if (job.kind !== 'subagent' || !job.subAgentId || !job.childThreadId)
            return;
        try {
            await this.checkpointStorage.deleteDelegatedForThread(job.subAgentId, job.childThreadId);
        }
        catch (error) {
            this.logger.warn('Failed to clear background child checkpoints', { jobId: job.id, error });
        }
    }
    async markMailConsumed(parentThreadId, jobIds, includePauseReports = false) {
        if (this.agentsConfig.backgroundTasksEnabled) {
            const { AgentWakeService } = await import('./agent-wake.service.js');
            if (di_1.Container.get(AgentWakeService).isWakeActive(parentThreadId))
                return 0;
        }
        return await this.consumeMail(parentThreadId, jobIds, includePauseReports);
    }
    async consumeMail(parentThreadId, jobIds, includePauseReports = false) {
        const count = await this.jobRepository.markMailConsumed(parentThreadId, jobIds, includePauseReports);
        if (count > 0 && jobIds[0])
            await this.notifyJobUpdateById(jobIds[0]);
        return count;
    }
    registerAbortController(jobId, controller) {
        this.abortControllers.set(jobId, controller);
    }
    unregisterAbortController(jobId, controller) {
        if (this.abortControllers.get(jobId) === controller)
            this.abortControllers.delete(jobId);
    }
    async listForThread(parentThreadId, ids) {
        await this.pruneExpiredPausedJobs(parentThreadId);
        let jobs = await this.jobRepository.findByParentThread(parentThreadId, ids);
        const settledSubAgents = await this.failOrphanedSubAgentJobs(jobs);
        const settledWorkflows = await this.settleFinishedWorkflowJobs(jobs);
        if (settledSubAgents || settledWorkflows) {
            jobs = await this.jobRepository.findByParentThread(parentThreadId, ids);
        }
        return jobs.map((job) => this.toJobView(job));
    }
    toJobView(job) {
        return {
            id: job.id,
            kind: job.kind,
            title: job.title,
            status: job.status,
            result: job.result,
            error: job.error,
            createdAt: job.createdAt,
            timeoutAt: job.timeoutAt,
            settledAt: job.settledAt,
            notifiedAt: job.notifiedAt,
            childExecutionId: job.childExecutionId,
            pauseRequestId: job.pauseRequestId,
        };
    }
    async listCurrentGroupForThread(parentAgentId, parentThreadId) {
        const candidates = await this.jobRepository.findGroupCandidates(parentAgentId, parentThreadId);
        const stoppingRequests = new Set(candidates
            .filter((job) => job.pauseRequestId &&
            !job.notifiedAt &&
            (job.status === 'running' || job.status === 'suspended'))
            .map((job) => job.pauseRequestId));
        const jobs = candidates
            .filter((job) => job.pauseRequestId ? stoppingRequests.has(job.pauseRequestId) : job.status !== 'paused')
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id));
        let group = [];
        let groupEndsAt = Number.NEGATIVE_INFINITY;
        for (const job of jobs) {
            const startedAt = job.createdAt.getTime();
            if (startedAt > groupEndsAt)
                group = [];
            group.push(job);
            groupEndsAt = Math.max(groupEndsAt, job.status === 'running' || job.status === 'suspended'
                ? Number.POSITIVE_INFINITY
                : (job.settledAt?.getTime() ?? startedAt));
        }
        if (!group.some((job) => job.status === 'running' || job.status === 'suspended' || !job.notifiedAt))
            return [];
        return await Promise.all(group.map(async (job) => {
            if (job.status !== 'suspended' || job.pauseRequestId)
                return job;
            const row = await this.jobRepository.findById(job.id);
            const approval = row && (await this.getApproval(row));
            if (!approval)
                return job;
            return {
                ...job,
                approval: {
                    runId: `${sub_agent_background_state_1.BACKGROUND_APPROVAL_RUN_PREFIX}${job.id}`,
                    toolCallId: approval.token,
                    suspendPayload: approval.pending.suspendPayload,
                },
            };
        }));
    }
    async cancel(parentThreadId, jobId, expected) {
        const [job] = await this.jobRepository.findByParentThread(parentThreadId, [jobId]);
        if (!job)
            return 'not-found';
        if (job.status !== 'running' && job.status !== 'suspended' && job.status !== 'paused')
            return 'already-settled';
        if (job.kind === 'workflow')
            return await this.cancelWorkflowJob(job);
        const claimed = await this.jobRepository.settleIfActive(jobId, { status: 'cancelled' }, expected);
        if (!claimed)
            return 'already-settled';
        this.updateBroadcaster.notifyBackgroundJobsUpdated(job.parentAgentId, job.parentThreadId);
        const controller = this.abortControllers.get(jobId);
        if (controller) {
            controller.abort();
            this.abortControllers.delete(jobId);
        }
        try {
            await this.publisher.publishCommand({
                command: 'cancel-agent-background-job',
                payload: { jobId },
            });
        }
        catch (error) {
            this.logger.warn('Failed to relay background job cancellation', { jobId, error });
        }
        await this.clearChildCheckpoint(job);
        await this.consumeCancelledMail(parentThreadId, jobId);
        return 'cancelled';
    }
    async cancelForParent(parentAgentId, parentThreadId, parentResourceId) {
        const jobs = await this.jobRepository.findByParentThread(parentThreadId);
        for (const job of jobs) {
            if (job.kind === 'subagent' &&
                job.parentAgentId === parentAgentId &&
                job.parentResourceId === parentResourceId &&
                (job.status === 'running' || job.status === 'suspended')) {
                await this.cancel(parentThreadId, job.id, { status: job.status });
            }
        }
    }
    async findJob(jobId) {
        try {
            return await this.jobRepository.findById(jobId);
        }
        catch (error) {
            this.logger.warn('Failed to resolve background job update', { jobId, error });
            return null;
        }
    }
    notifyJobUpdate(job) {
        try {
            this.updateBroadcaster.notifyBackgroundJobsUpdated(job.parentAgentId, job.parentThreadId);
        }
        catch (error) {
            this.logger.warn('Failed to notify background job update', { jobId: job.id, error });
        }
    }
    async notifyJobUpdateById(jobId) {
        const job = await this.findJob(jobId);
        if (job)
            this.notifyJobUpdate(job);
    }
    async requestWakeSafely(parentThreadId) {
        if (!this.agentsConfig.backgroundTasksEnabled)
            return;
        try {
            const { AgentWakeService } = await import('./agent-wake.service.js');
            await di_1.Container.get(AgentWakeService).requestWake(parentThreadId);
        }
        catch (error) {
            this.logger.warn('Failed to request a parent wake for a settled background job', {
                parentThreadId,
                error,
            });
        }
    }
    handleCancelRelay({ jobId }) {
        const controller = this.abortControllers.get(jobId);
        if (!controller)
            return;
        controller.abort();
        this.abortControllers.delete(jobId);
        this.logger.debug('Aborted background job after relayed cancellation', { jobId });
    }
    async reconcile(signal) {
        if (signal?.aborted)
            return;
        for (const job of await this.jobRepository.findSettledSubAgentsWithCheckpoints()) {
            if (signal?.aborted)
                return;
            await this.clearChildCheckpoint(job);
        }
        for (const job of await this.jobRepository.findRequestedPauses()) {
            if (signal?.aborted)
                return;
            if (job.status === 'suspended' && job.notifiedAt && job.timeoutAt) {
                if ((await this.executionRepository.findRunningByThread(job.parentThreadId, {})).length === 0)
                    await this.releaseResumeReservations([job], job.timeoutAt);
            }
            else if (job.status === 'paused') {
                await this.retainLatestStopGroup(job);
            }
            else {
                await this.pause(job.id);
            }
        }
        if (signal?.aborted)
            return;
        await this.failJobsPastTimeout(signal);
        if (signal?.aborted)
            return;
        await this.pruneExpiredPausedJobs();
        if (signal?.aborted)
            return;
        await this.failOrphanedSubAgentJobs(await this.jobRepository.findRunningJobs('subagent'), signal);
        if (signal?.aborted)
            return;
        await this.reconcileWorkflowJobs(signal);
    }
    async reconcileWorkflowJobs(signal) {
        if (signal?.aborted)
            return;
        const jobs = await this.jobRepository.findRunningJobs('workflow');
        await this.settleFinishedWorkflowJobs(jobs, signal);
        for (const job of jobs) {
            if (signal?.aborted)
                return;
            if (!job.pauseRequestId)
                continue;
            try {
                await this.cancelWorkflowJob(job);
            }
            catch (error) {
                this.logger.warn('Failed to finish a requested workflow stop', { jobId: job.id, error });
            }
        }
        if (signal?.aborted)
            return;
        await this.jobRepository.deleteSettledBefore(new Date(Date.now() - exports.SETTLED_JOB_RETENTION_MS));
    }
    async cancelWorkflowJob(job) {
        if (!(await this.stopWorkflowJobExecution(job))) {
            if (job.pauseRequestId)
                await this.settleFinishedWorkflowJobs([job]);
            return 'already-settled';
        }
        if (job.pauseRequestId) {
            await this.settle(job.id, {
                status: 'cancelled',
                result: job.childExecutionId
                    ? await this.loadExecutionResult(job.childExecutionId, true)
                    : null,
            });
            return 'cancelled';
        }
        const settled = await this.jobRepository.settleIfActive(job.id, { status: 'cancelled' });
        if (settled) {
            this.updateBroadcaster.notifyBackgroundJobsUpdated(job.parentAgentId, job.parentThreadId);
        }
        await this.consumeCancelledMail(job.parentThreadId, job.id);
        return 'cancelled';
    }
    async consumeCancelledMail(parentThreadId, jobId) {
        try {
            await this.consumeMail(parentThreadId, [jobId]);
        }
        catch (error) {
            this.logger.warn('Failed to mark the cancelled job result as delivered', { jobId, error });
        }
    }
    async settleFinishedWorkflowJobs(jobs, signal) {
        const candidates = jobs.filter((job) => job.kind === 'workflow' && job.status === 'running' && job.childExecutionId !== null);
        if (candidates.length === 0)
            return false;
        let statuses;
        try {
            const rows = await this.executionPersistence.findStatusesByIds(candidates.map((job) => job.childExecutionId));
            statuses = new Map(rows.map((row) => [row.id, row.status]));
        }
        catch (error) {
            this.logger.error('Failed to read execution statuses for workflow background jobs', {
                error,
            });
            return false;
        }
        let settledAny = false;
        for (const job of candidates) {
            if (signal?.aborted)
                break;
            settledAny =
                (await this.settleFinishedWorkflowJob(job, statuses.get(job.childExecutionId))) ||
                    settledAny;
        }
        return settledAny;
    }
    async loadExecutionResult(executionId, allOutputs = false) {
        try {
            const execution = await this.executionPersistence.findSingleExecution(executionId, {
                includeData: true,
                unflattenData: true,
            });
            const runData = execution?.data?.resultData?.runData;
            if (!runData)
                return null;
            return serializeWorkflowJobResult(collectResultData(runData, allOutputs));
        }
        catch (error) {
            this.logger.warn('Failed to read a finished execution’s data for its job result', {
                executionId,
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }
    async failJobsPastTimeout(signal) {
        const timedOut = await this.jobRepository.findActivePastTimeout(new Date());
        for (const job of timedOut) {
            if (signal?.aborted)
                return;
            if (job.status !== 'running' && job.status !== 'suspended')
                continue;
            if (job.status === 'suspended' && job.pauseRequestId && job.notifiedAt && job.timeoutAt) {
                await this.releaseResumeReservations([job], job.timeoutAt);
                continue;
            }
            if (job.status === 'running' && (await this.suspend(job.id)))
                continue;
            const controller = job.status === 'running' ? this.abortControllers.get(job.id) : undefined;
            let abort = true;
            try {
                const settled = await this.settle(job.id, {
                    status: 'failed',
                    error: job.status === 'suspended'
                        ? 'Approval expired'
                        : `Timed out after ${Math.round(exports.SUB_AGENT_BACKGROUND_TIMEOUT_MS / 60_000)} minutes`,
                }, { status: job.status, timeoutAt: job.timeoutAt });
                abort = settled;
                if (settled) {
                    this.logger.debug('Failed background job past its timeout', { jobId: job.id });
                }
            }
            catch (error) {
                this.logger.error('Failed to settle background job past its timeout', {
                    jobId: job.id,
                    error,
                });
            }
            finally {
                if (abort)
                    controller?.abort();
            }
        }
    }
    async failOrphanedSubAgentJobs(jobs, signal) {
        const orphans = jobs.flatMap((job) => job.kind === 'subagent' &&
            job.status === 'running' &&
            job.childThreadId !== null &&
            !this.abortControllers.has(job.id)
            ? [{ job, childThreadId: job.childThreadId }]
            : []);
        if (orphans.length === 0)
            return false;
        const statuses = await this.executionRepository.findLatestStatusesByThreadIds(orphans.map(({ childThreadId }) => childThreadId));
        let settledAny = false;
        for (const { job, childThreadId } of orphans) {
            if (signal?.aborted)
                break;
            const childStatus = statuses.get(childThreadId);
            if (childStatus !== 'running' && (await this.suspend(job.id))) {
                settledAny = true;
                continue;
            }
            if (childStatus !== 'interrupted' && childStatus !== 'error')
                continue;
            const settled = await this.settle(job.id, {
                status: 'failed',
                error: `Sub-agent run ended with status "${childStatus}" and its result was not recovered`,
            }, { status: 'running', timeoutAt: job.timeoutAt });
            settledAny ||= settled;
        }
        return settledAny;
    }
    async stopWorkflowJobExecution(job) {
        if (job.childExecutionId === null || job.workflowId === null)
            return true;
        const { ExecutionService } = await import('../../../executions/execution.service.js');
        const { MissingExecutionStopError } = await import('../../../errors/missing-execution-stop.error.js');
        try {
            await di_1.Container.get(ExecutionService).stop(job.childExecutionId, [job.workflowId]);
        }
        catch (error) {
            if (error instanceof MissingExecutionStopError || error instanceof n8n_workflow_1.WorkflowOperationError) {
                this.logger.debug('Workflow job execution was already beyond stopping', {
                    jobId: job.id,
                    executionId: job.childExecutionId,
                });
                return false;
            }
            this.logger.error('Failed to stop a workflow job execution — it may still be running', {
                jobId: job.id,
                executionId: job.childExecutionId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
        return true;
    }
    async settleFinishedWorkflowJob(job, executionStatus) {
        const executionId = job.childExecutionId;
        try {
            if (executionStatus === undefined) {
                return await this.settle(job.id, {
                    status: 'failed',
                    error: exports.EXECUTION_OUTCOME_UNKNOWN_ERROR,
                });
            }
            if (!(0, n8n_workflow_1.isTerminalExecutionStatus)(executionStatus))
                return false;
            const status = settlementStatusForExecution(executionStatus);
            return await this.settle(job.id, {
                status,
                result: status === 'completed' || job.pauseRequestId
                    ? await this.loadExecutionResult(executionId, Boolean(job.pauseRequestId))
                    : null,
                error: executionStatus === 'success' ? null : `Execution ${executionStatus}`,
            });
        }
        catch (error) {
            this.logger.error('Failed to reconcile workflow background job', {
                jobId: job.id,
                executionId,
                error,
            });
            return false;
        }
    }
};
exports.AgentBackgroundJobService = AgentBackgroundJobService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('cancel-agent-background-job', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AgentBackgroundJobService.prototype, "handleCancelRelay", null);
exports.AgentBackgroundJobService = AgentBackgroundJobService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_background_job_repository_1.AgentBackgroundJobRepository, agent_execution_repository_1.AgentExecutionRepository, execution_persistence_1.ExecutionPersistence, publisher_service_1.Publisher, backend_common_1.Logger, config_1.AgentsConfig, agent_execution_update_broadcaster_1.AgentExecutionUpdateBroadcaster, n8n_checkpoint_storage_1.N8NCheckpointStorage, agent_message_repository_1.AgentMessageRepository])
], AgentBackgroundJobService);
//# sourceMappingURL=agent-background-job.service.js.map