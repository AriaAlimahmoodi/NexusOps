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
exports.SubAgentBackgroundRunner = void 0;
const agents_1 = require("@n8n/agents");
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const deferred_promise_1 = require("@n8n/utils/promise/deferred-promise");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const uuid_1 = require("uuid");
const agent_background_job_service_1 = require("./agent-background-job.service");
const agent_background_job_repository_1 = require("../repositories/agent-background-job.repository");
const agent_workspace_service_1 = require("../agent-workspace.service");
const format_sub_agent_tool_output_1 = require("../sub-agents/format-sub-agent-tool-output");
const sub_agent_runner_1 = require("../sub-agents/sub-agent-runner");
let SubAgentBackgroundRunner = class SubAgentBackgroundRunner {
    constructor(runner, jobService, logger, jobRepository, workspaceService) {
        this.runner = runner;
        this.jobService = jobService;
        this.logger = logger;
        this.jobRepository = jobRepository;
        this.workspaceService = workspaceService;
        this.dispatchCounter = 0;
        this.logger = this.logger.scoped('agents');
    }
    async spawn(request, context) {
        const taskPath = (0, agents_1.createChildSubAgentTaskPath)(request.taskName, this.dispatchCounter++);
        const jobId = (0, uuid_1.v4)();
        const childThreadId = (0, uuid_1.v4)();
        const receipt = await this.jobService.registerSubAgentJob({
            id: jobId,
            parentAgentId: context.parentAgentId,
            parentThreadId: request.parentThreadId,
            parentResourceId: request.parentResourceId,
            parentPrincipalHash: request.parentSandboxPrincipalHash,
            title: request.taskName,
            subAgentId: request.subAgentId,
            childThreadId,
        });
        if (receipt.status !== 'started')
            return receipt;
        const abortController = new AbortController();
        const expected = { status: 'running' };
        this.jobService.registerAbortController(jobId, abortController);
        void this.dispatch(jobId, abortController, expected, async () => {
            const job = await this.jobRepository.findById(jobId);
            if (job?.status !== 'running') {
                abortController.abort();
                abortController.signal.throwIfAborted();
            }
            expected.timeoutAt = job?.timeoutAt;
            return await this.runner.run({
                goal: request.goal,
                source: request.source,
                ...(request.context !== undefined ? { context: request.context } : {}),
                ...(request.expectedOutput !== undefined
                    ? { expectedOutput: request.expectedOutput }
                    : {}),
                parentThreadId: request.parentThreadId,
                parentResourceId: request.parentResourceId,
                parentSandboxPrincipalHash: request.parentSandboxPrincipalHash,
                childThreadId,
                taskPath,
            }, {
                projectId: context.projectId,
                parentAgentId: context.parentAgentId,
                credentialProvider: context.credentialProvider,
                runType: context.runType,
                workflowToolExecutionMode: context.workflowToolExecutionMode,
                user: context.user,
                instrumentation: context.instrumentation,
                abortSignal: abortController.signal,
                backgroundJobId: jobId,
                shouldPause: async () => await this.jobService.shouldPause(jobId),
                parentMessageContext: request.parentMessageContext,
                rootSessionId: request.parentThreadId,
                rootSessionCapUsd: context.rootSessionCapUsd,
                budgetForwarded: true,
                ...(request.difficulty !== undefined
                    ? { selfDelegationDifficulty: request.difficulty }
                    : {}),
                ...(context.parentWorkspaceHandle !== undefined
                    ? { parentWorkspaceHandle: context.parentWorkspaceHandle }
                    : {}),
            });
        }).catch((error) => {
            this.logger.error('Failed to settle background sub-agent job', { jobId, error });
        });
        return receipt;
    }
    async resume(job, response, context) {
        const approval = job.status === 'suspended' && !job.pauseRequestId && (await this.jobService.getApproval(job));
        if (!approval ||
            approval.token !== response.token ||
            approval.scope.projectId !== context.projectId ||
            !job.subAgentId ||
            !job.childThreadId) {
            throw new n8n_workflow_1.UserError('This background approval is no longer available');
        }
        const { metadata, scope } = approval;
        const workspace = metadata.sharedWorkspace
            ? await this.workspaceService.getAgentWorkspace(context.projectId, job.parentAgentId, scope.principalHash)
            : undefined;
        const started = (0, deferred_promise_1.createDeferredPromise)();
        const controller = new AbortController();
        const expected = { status: 'suspended', timeoutAt: job.timeoutAt };
        let claimed = false;
        let admitted = false;
        void this.dispatch(job.id, controller, expected, async () => {
            const result = await this.runner.resumeForeground({
                subAgentId: metadata.resumeContext.agentId,
                childThreadId: job.childThreadId ?? undefined,
                parentThreadId: job.parentThreadId,
                childRunId: approval.runId,
                childToolCallId: approval.pending.toolCallId,
                resumeData: response.resumeData,
                taskPath: metadata.taskPath,
                resumeContext: metadata.resumeContext,
            }, {
                ...context,
                shouldPause: async () => await this.jobService.shouldPause(job.id),
                abortSignal: controller.signal,
                selfDelegationDifficulty: metadata.difficulty,
                runtimeSnapshot: metadata.runtimeSnapshot,
                parentWorkspaceHandle: workspace?.handle,
                beforeResume: async () => {
                    const currentJob = await this.jobRepository.findById(job.id);
                    const currentApproval = currentJob?.status === 'suspended' &&
                        !currentJob.pauseRequestId &&
                        (await this.jobService.getApproval(currentJob));
                    if (!currentApproval || currentApproval.token !== response.token) {
                        throw new n8n_workflow_1.UserError('This background approval is no longer available');
                    }
                },
                onResumeClaimed: async () => {
                    this.jobService.registerAbortController(job.id, controller);
                    const timeoutAt = new Date(Date.now() + agent_background_job_service_1.SUB_AGENT_BACKGROUND_TIMEOUT_MS);
                    if (!(await this.jobService.resume(job.id, timeoutAt))) {
                        throw new n8n_workflow_1.UserError('This background task has already ended');
                    }
                    claimed = true;
                    expected.status = 'running';
                    expected.timeoutAt = timeoutAt;
                    admitted = true;
                    started.resolve();
                },
            });
            if (!admitted)
                throw new n8n_workflow_1.UserError('This background approval could not be resumed');
            return result;
        }, () => claimed)
            .then(() => {
            if (!admitted)
                started.reject(new n8n_workflow_1.UserError('This background approval could not be resumed'));
        })
            .catch((error) => {
            started.reject((0, ensure_error_1.ensureError)(error));
            this.logger.warn('Failed to resume background sub-agent', { jobId: job.id, error });
        });
        await started.promise;
    }
    async resumePaused(job, context, reservationTimeoutAt) {
        if (job.status !== 'paused' || !job.pauseRequestId || !job.notifiedAt) {
            throw new n8n_workflow_1.UserError('Wait for the combined status report, then ask to continue again');
        }
        const suspension = await this.jobService.getCheckpoint(job);
        if (!suspension)
            throw new n8n_workflow_1.UserError(agent_background_job_service_1.EXPIRED_BACKGROUND_CHECKPOINT_ERROR);
        const { metadata, scope, checkpoint } = suspension;
        if (scope.projectId !== context.projectId || job.parentAgentId !== context.parentAgentId) {
            throw new n8n_workflow_1.UserError('This background task is not available');
        }
        if (Object.keys(checkpoint.pendingToolCalls).length > 0) {
            if (!(await this.jobService.getApproval(job)))
                throw new n8n_workflow_1.UserError('This background task cannot be resumed');
            if (!(await this.jobRepository.resumeIfPaused(job.id, job.pauseRequestId, 'suspended', suspension.expiresAt, reservationTimeoutAt))) {
                throw new n8n_workflow_1.UserError('This background task has already resumed');
            }
            await this.jobService.notifyResumed(job.id);
            return;
        }
        const workspace = metadata.sharedWorkspace
            ? await this.workspaceService.getAgentWorkspace(context.projectId, job.parentAgentId, scope.principalHash)
            : undefined;
        const controller = new AbortController();
        const started = (0, deferred_promise_1.createDeferredPromise)();
        const expected = { status: 'running' };
        const pauseRequestId = job.pauseRequestId;
        let claimed = false;
        let admitted = false;
        void this.dispatch(job.id, controller, expected, async () => {
            return await this.runner.resumePaused({
                subAgentId: metadata.resumeContext.agentId,
                childThreadId: job.childThreadId ?? undefined,
                parentThreadId: job.parentThreadId,
                childRunId: suspension.runId,
                taskPath: metadata.taskPath,
                resumeContext: metadata.resumeContext,
            }, {
                ...context,
                abortSignal: controller.signal,
                selfDelegationDifficulty: metadata.difficulty,
                runtimeSnapshot: metadata.runtimeSnapshot,
                parentWorkspaceHandle: workspace?.handle,
                rootSessionId: job.parentThreadId,
                budgetForwarded: true,
                shouldPause: async () => await this.jobService.shouldPause(job.id),
                beforeResume: async () => {
                    const current = await this.jobRepository.findById(job.id);
                    if (current?.status !== 'suspended' ||
                        current.pauseRequestId !== pauseRequestId ||
                        current.timeoutAt?.getTime() !== reservationTimeoutAt.getTime()) {
                        throw new n8n_workflow_1.UserError('This background task has already resumed');
                    }
                },
                onResumeClaimed: async () => {
                    this.jobService.registerAbortController(job.id, controller);
                    const timeoutAt = new Date(Date.now() + agent_background_job_service_1.SUB_AGENT_BACKGROUND_TIMEOUT_MS);
                    if (!(await this.jobRepository.resumeIfPaused(job.id, pauseRequestId, 'running', timeoutAt, reservationTimeoutAt))) {
                        throw new n8n_workflow_1.UserError('This background task has already ended');
                    }
                    claimed = true;
                    expected.timeoutAt = timeoutAt;
                    await this.jobService.notifyResumed(job.id);
                    admitted = true;
                    started.resolve();
                },
            });
        }, () => claimed)
            .then(() => {
            if (!admitted)
                started.reject(new n8n_workflow_1.UserError('This background task could not be resumed'));
        })
            .catch((error) => {
            started.reject((0, ensure_error_1.ensureError)(error));
            this.logger.warn('Failed to resume paused background task', { jobId: job.id, error });
        });
        await started.promise;
    }
    async dispatch(jobId, controller, expected, run, ownsRun = () => true) {
        const timeout = setTimeout(() => {
            if (!ownsRun()) {
                controller.abort();
                return;
            }
            void this.jobService
                .settle(jobId, {
                status: 'failed',
                error: `Timed out after ${Math.round(agent_background_job_service_1.SUB_AGENT_BACKGROUND_TIMEOUT_MS / 60_000)} minutes`,
            }, expected)
                .catch((error) => {
                this.logger.error('Failed to settle timed-out background job', { jobId, error });
            })
                .finally(() => controller.abort());
        }, agent_background_job_service_1.SUB_AGENT_BACKGROUND_TIMEOUT_MS);
        timeout.unref();
        try {
            let result;
            try {
                result = await run();
            }
            catch (error) {
                if (!ownsRun())
                    throw error;
                await this.jobService.settle(jobId, { status: 'failed', error: error instanceof Error ? error.message : String(error) }, expected);
                return;
            }
            clearTimeout(timeout);
            if (result.status === 'paused') {
                await this.jobService.settlePausedSubAgent(jobId, expected);
                return;
            }
            if (result.status === 'suspended' && (await this.jobService.suspend(jobId)))
                return;
            await this.jobService.settle(jobId, settlementFor(result), expected);
        }
        finally {
            clearTimeout(timeout);
            this.jobService.unregisterAbortController(jobId, controller);
        }
    }
};
exports.SubAgentBackgroundRunner = SubAgentBackgroundRunner;
exports.SubAgentBackgroundRunner = SubAgentBackgroundRunner = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [sub_agent_runner_1.SubAgentRunner, agent_background_job_service_1.AgentBackgroundJobService, backend_common_1.Logger, agent_background_job_repository_1.AgentBackgroundJobRepository, agent_workspace_service_1.AgentWorkspaceService])
], SubAgentBackgroundRunner);
function settlementFor(result) {
    const output = (0, format_sub_agent_tool_output_1.formatSubAgentToolOutput)(result);
    if (output.status === 'completed') {
        return { status: 'completed', result: output.answer };
    }
    if (output.status === 'suspended') {
        return {
            status: 'failed',
            error: 'The background task requested an unsupported interaction',
        };
    }
    return {
        status: output.status === 'cancelled' ? 'cancelled' : 'failed',
        error: output.error ?? null,
    };
}
//# sourceMappingURL=sub-agent-background-runner.js.map