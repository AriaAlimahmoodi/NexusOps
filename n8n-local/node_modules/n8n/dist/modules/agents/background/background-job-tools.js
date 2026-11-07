"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBackgroundSubAgentHandler = createBackgroundSubAgentHandler;
exports.createCheckBackgroundJobsTool = createCheckBackgroundJobsTool;
exports.createResumeBackgroundJobsTool = createResumeBackgroundJobsTool;
exports.createCancelBackgroundJobTool = createCancelBackgroundJobTool;
const agents_1 = require("@n8n/agents");
const tool_1 = require("@n8n/agents/tool");
const zod_1 = require("zod");
const agent_sandbox_principal_1 = require("../agent-sandbox-principal");
const integration_message_context_1 = require("../integrations/integration-message-context");
const agent_memory_scope_1 = require("../utils/agent-memory-scope");
const agent_background_job_service_1 = require("./agent-background-job.service");
const sub_agent_background_state_1 = require("./sub-agent-background-state");
const agent_queued_message_1 = require("../types/agent-queued-message");
const RESULT_ECHO_MAX_CHARS = 8000;
function threadIdOf(ctx) {
    return ctx.persistence?.threadId;
}
function createBackgroundSubAgentHandler(options) {
    return async (input, ctx) => {
        if (input.taskName.length > 255) {
            return { status: 'rejected', note: 'Background task names must not exceed 255 characters.' };
        }
        const parentThreadId = threadIdOf(ctx);
        const parentResourceId = ctx.persistence?.resourceId;
        if (!parentThreadId || !parentResourceId) {
            return {
                status: 'rejected',
                note: 'Background jobs need a persisted conversation thread; none is active.',
            };
        }
        if ((0, agent_memory_scope_1.isTaskRunMemoryResourceId)(parentResourceId)) {
            return {
                status: 'rejected',
                note: 'Background jobs are unavailable in task sessions.',
            };
        }
        const isSelfDelegation = input.subAgentId === agents_1.INLINE_SUB_AGENT_ID;
        const source = isSelfDelegation
            ? { agentId: options.parentAgentId }
            : options.sourcesById[input.subAgentId];
        if (!source) {
            const ids = [...options.availableSubAgents.map((agent) => agent.id), 'inline'].join(', ');
            return {
                status: 'rejected',
                note: `No sub-agent matched "${input.subAgentId}". Available: ${ids}.`,
            };
        }
        const sandboxScope = (0, agent_sandbox_principal_1.decodeAgentSandboxHostMetadata)(ctx.persistence?.hostMetadata);
        if (!sandboxScope || sandboxScope.projectId !== options.projectId) {
            return {
                status: 'rejected',
                note: 'Background jobs need a valid parent identity; none is active.',
            };
        }
        const receipt = await options.backgroundRunner.spawn({
            subAgentId: source.agentId,
            source,
            taskName: input.taskName,
            goal: input.goal,
            context: input.context,
            expectedOutput: input.expectedOutput,
            ...(isSelfDelegation && input.difficulty !== undefined
                ? { difficulty: input.difficulty }
                : {}),
            parentThreadId,
            parentResourceId,
            parentSandboxPrincipalHash: sandboxScope.principalHash,
            parentMessageContext: (0, integration_message_context_1.readIntegrationMessageContext)(ctx.persistence) ?? null,
        }, {
            projectId: options.projectId,
            parentAgentId: options.parentAgentId,
            ...options.runContext,
        });
        if (receipt.status === 'started') {
            if (ctx.abortSignal?.reason === sub_agent_background_state_1.PARENT_TASK_CANCELLED_REASON) {
                await options.jobService.cancel(parentThreadId, receipt.jobId);
            }
            return {
                status: 'started',
                jobId: receipt.jobId,
                note: 'Job dispatched. Continue independent work or end this turn with a short progress message. Completion triggers a follow-up. Do not wait, sleep, or poll for completion.',
            };
        }
        return {
            status: 'limit-reached',
            note: 'This conversation already has the maximum number of running background jobs. Wait for one to finish or cancel one.',
        };
    };
}
function createCheckBackgroundJobsTool(jobService) {
    return new tool_1.Tool('check_background_jobs')
        .description('List the background jobs of this conversation with their status and, once settled, ' +
        'their result or error. Pass an empty object {} to list all jobs (required — do not pass null). ' +
        'Call this at most once per turn. Collect all relevant jobs in that call, rather than ' +
        'checking each job separately.')
        .systemInstruction('Call check_background_jobs at most once per turn, including calls made together. ' +
        'Omit jobIds to check all jobs, or include all relevant job IDs in one call. Use the ' +
        'results already available and continue independent work. If further progress depends ' +
        'on running jobs, end your turn with a short progress message. Completion triggers a ' +
        'follow-up. Do not wait, sleep, or call this tool again in the same turn to see whether ' +
        'a job has finished. A user status request or a completion hint can justify one check ' +
        'in a later turn. Do not claim that running jobs are complete.')
        .input(zod_1.z.object({
        jobIds: zod_1.z.array(zod_1.z.string()).max(50).optional().describe('Limit the check to these job ids'),
    }))
        .handler(async (input, ctx) => {
        const parentThreadId = threadIdOf(ctx);
        if (!parentThreadId) {
            return { jobs: [], note: 'No persisted conversation thread is active.' };
        }
        const jobs = await jobService.listForThread(parentThreadId, input.jobIds);
        await jobService.markMailConsumed(parentThreadId, jobs
            .filter((job) => job.status !== 'running' && job.status !== 'suspended' && !job.pauseRequestId)
            .map((job) => job.id));
        return {
            jobs: jobs.map((job) => ({
                jobId: job.id,
                kind: job.kind,
                title: job.title,
                status: job.status,
                ...(job.pauseRequestId ? { userStopped: true } : {}),
                ...(job.result !== null ? { result: truncateResult(job.result) } : {}),
                ...(job.error !== null ? { error: truncateResult(job.error) } : {}),
                startedAt: job.createdAt.toISOString(),
                ...(job.timeoutAt !== null ? { timeoutAt: job.timeoutAt.toISOString() } : {}),
                ...(job.childExecutionId !== null ? { executionId: job.childExecutionId } : {}),
            })),
            runningCount: jobs.filter((job) => job.status === 'running').length,
            note: 'You have checked background jobs for this turn. User-stopped jobs must wait for the combined report and a new explicit request to continue. Do not replace or resume their work automatically. Use other available results. Do not wait, sleep, or check again in this turn.',
        };
    })
        .build();
}
function createResumeBackgroundJobsTool(options) {
    return new tool_1.Tool('resume_background_jobs')
        .description('Resume paused sub-agents and identify cancelled workflows from the latest stop group in this conversation.')
        .systemInstruction('Call resume_background_jobs first when the latest user message explicitly asks to continue stopped tasks. Continue applies only to the latest stop group. Do not restart tasks from older stop groups unless the user explicitly asks for that work. Do not call this tool for an unrelated message or an automatic notification. Never replace paused sub-agents with new jobs. If stopping is still in progress, ask the user to wait for the combined report and ask again. Do not poll or remember an early request for automatic continuation. The tool returns cancelled workflow references separately. It does not restart those workflows. Check conversation history and current jobs before repeating a workflow call, including repeated Continue requests. Call the normal workflow tool with inputs from the conversation only when a new execution is still needed. A new execution uses current configuration and starts from the beginning. Earlier actions can repeat and webhook URLs change. Continuing does not approve pending tools or bypass permissions.')
        .input(zod_1.z.object({}))
        .handler(async (_input, ctx) => {
        const { persistence } = ctx;
        const executionId = persistence?.hostMetadata?.[agent_queued_message_1.EXECUTION_METADATA_KEY];
        const scope = (0, agent_sandbox_principal_1.decodeAgentSandboxHostMetadata)(persistence?.hostMetadata);
        if (!persistence ||
            persistence.hostMetadata?.[sub_agent_background_state_1.BACKGROUND_PAUSE_USER_TURN_KEY] !== true ||
            typeof executionId !== 'string' ||
            scope?.projectId !== options.projectId) {
            return {
                status: 'unavailable',
                note: 'Resuming needs an explicit user request in this conversation.',
            };
        }
        const candidates = await options.jobService.preparePausedResume(options.parentAgentId, persistence.threadId, persistence.resourceId, executionId);
        if (candidates.status === 'limit-reached') {
            return {
                status: candidates.status,
                note: 'There are not enough active task slots for the stopped group. Wait for active tasks to finish, then ask to continue again.',
            };
        }
        if (candidates.status === 'expired')
            return { status: candidates.status, note: agent_background_job_service_1.EXPIRED_BACKGROUND_CHECKPOINT_ERROR };
        if (candidates.status !== 'ready') {
            return {
                status: candidates.status,
                note: 'Wait for the combined status report, then ask to continue again.',
            };
        }
        try {
            const results = await Promise.allSettled(candidates.jobs.map(async (job) => await options.backgroundRunner.resumePaused(job, {
                ...options.runContext,
                projectId: options.projectId,
                parentAgentId: options.parentAgentId,
            }, candidates.timeoutAt)));
            return {
                status: candidates.jobs.length > 0 ? 'resumed' : 'ready',
                jobs: results.map((result, index) => ({
                    jobId: candidates.jobs[index].id,
                    status: result.status === 'fulfilled' ? 'resumed' : 'failed',
                    ...(result.status === 'rejected' ? { error: String(result.reason) } : {}),
                })),
                workflowsToRestart: candidates.workflowsToRestart,
            };
        }
        finally {
            await options.jobService.releaseResumeReservations(candidates.jobs, candidates.timeoutAt);
        }
    })
        .build();
}
function createCancelBackgroundJobTool(jobService) {
    return new tool_1.Tool('cancel_background_job')
        .description('Cancel a running background job of this conversation by its job id.')
        .input(zod_1.z.object({ jobId: zod_1.z.string() }))
        .output(zod_1.z.object({ status: zod_1.z.enum(['cancelled', 'not-found', 'already-settled']) }))
        .handler(async (input, ctx) => {
        const parentThreadId = threadIdOf(ctx);
        if (!parentThreadId)
            return { status: 'not-found' };
        return { status: await jobService.cancel(parentThreadId, input.jobId) };
    })
        .build();
}
function truncateResult(result) {
    if (result.length <= RESULT_ECHO_MAX_CHARS)
        return result;
    return `${result.slice(0, RESULT_ECHO_MAX_CHARS)}\n[... truncated, ${result.length} characters total]`;
}
//# sourceMappingURL=background-job-tools.js.map