import type { AgentBackgroundJobDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { AgentsConfig } from '@n8n/config';
import type { IRunData, TerminalExecutionStatus } from 'n8n-workflow';
import { ExecutionPersistence } from '../../../executions/execution-persistence';
import { Publisher } from '../../../scaling/pubsub/publisher.service';
import { AgentExecutionUpdateBroadcaster } from '../agent-execution-update-broadcaster';
import type { AgentBackgroundJob } from '../entities/agent-background-job.entity';
import { AgentBackgroundJobRepository, type AgentBackgroundJobSettlement, type ExpectedBackgroundJobState, type BackgroundJobGroupItem, type NewSubAgentJob, type NewWorkflowJob } from '../repositories/agent-background-job.repository';
import { AgentExecutionRepository } from '../repositories/agent-execution.repository';
import { AgentMessageRepository } from '../repositories/agent-message.repository';
import { N8NCheckpointStorage } from '../integrations/n8n-checkpoint-storage';
export declare const MAX_RUNNING_JOBS_PER_THREAD = 5;
export declare const SUB_AGENT_BACKGROUND_TIMEOUT_MS: number;
export declare const SETTLED_JOB_RETENTION_MS: number;
export declare const EXPIRED_BACKGROUND_CHECKPOINT_ERROR = "This background task checkpoint has expired and cannot be resumed";
export type BackgroundJobReceipt = {
    status: 'started';
    jobId: string;
} | {
    status: 'limit-reached';
};
export type BackgroundJobView = Pick<AgentBackgroundJob, 'id' | 'kind' | 'title' | 'status' | 'result' | 'error' | 'createdAt' | 'timeoutAt' | 'settledAt' | 'notifiedAt' | 'childExecutionId' | 'pauseRequestId'>;
export declare const WORKFLOW_JOB_RESULT_MAX_CHARS = 8000;
export declare const EXECUTION_OUTCOME_UNKNOWN_ERROR = "The workflow execution was not retained (check the workflow\u2019s save settings), so its outcome is unknown \u2014 it may have completed. Do not run the workflow again without checking for its effects.";
export declare function settlementStatusForExecution(status: TerminalExecutionStatus): 'completed' | 'failed' | 'cancelled';
export declare function collectResultData(runData: IRunData, allOutputs: boolean): Record<string, unknown>;
export declare function serializeWorkflowJobResult(resultData: Record<string, unknown> | undefined): string | null;
export declare class AgentBackgroundJobService {
    private readonly jobRepository;
    private readonly executionRepository;
    private readonly executionPersistence;
    private readonly publisher;
    private readonly logger;
    private readonly agentsConfig;
    private readonly updateBroadcaster;
    private readonly checkpointStorage;
    private readonly messageRepository;
    private readonly abortControllers;
    constructor(jobRepository: AgentBackgroundJobRepository, executionRepository: AgentExecutionRepository, executionPersistence: ExecutionPersistence, publisher: Publisher, logger: Logger, agentsConfig: AgentsConfig, updateBroadcaster: AgentExecutionUpdateBroadcaster, checkpointStorage: N8NCheckpointStorage, messageRepository: AgentMessageRepository);
    registerSubAgentJob(params: Omit<NewSubAgentJob, 'kind' | 'timeoutAt'>): Promise<BackgroundJobReceipt>;
    registerWorkflowJob(params: Omit<NewWorkflowJob, 'kind' | 'childExecutionId'> & {
        executionId: string;
    }): Promise<BackgroundJobReceipt>;
    settleWorkflowJobByExecutionId(executionId: string, settlement: AgentBackgroundJobSettlement, runData?: IRunData): Promise<boolean>;
    settle(jobId: string, settlement: AgentBackgroundJobSettlement, expected?: ExpectedBackgroundJobState): Promise<boolean>;
    getCheckpoint(job: AgentBackgroundJob): Promise<{
        metadata: {
            jobId: string;
            resumeContext: {
                agentId: string;
                versionId?: string | undefined;
            };
            runtimeSnapshot?: string | undefined;
            difficulty?: "high" | "low" | "medium" | undefined;
            sharedWorkspace: boolean;
            messageContext: import("../integrations/integration-tool-types").IntegrationMessageContext | null;
            taskPath: import("@n8n/agents").SubAgentTaskPath;
        };
        scope: import("../agent-sandbox-principal").AgentSandboxPersistenceScope;
        runId: string;
        checkpoint: import("@n8n/agents").SerializableAgentState;
        serializedState: string;
        updatedAt: Date;
        expiresAt: Date;
    } | undefined>;
    getApproval(job: AgentBackgroundJob): Promise<{
        metadata: {
            jobId: string;
            resumeContext: {
                agentId: string;
                versionId?: string | undefined;
            };
            runtimeSnapshot?: string | undefined;
            difficulty?: "high" | "low" | "medium" | undefined;
            sharedWorkspace: boolean;
            messageContext: import("../integrations/integration-tool-types").IntegrationMessageContext | null;
            taskPath: import("@n8n/agents").SubAgentTaskPath;
        };
        scope: import("../agent-sandbox-principal").AgentSandboxPersistenceScope;
        pending: {
            toolCallId: string;
            toolName: string;
            input: import("@n8n/agents").JSONValue;
        } & {
            suspended: true;
            suspendPayload: unknown;
            resumeSchema: import("zod-to-json-schema").JsonSchema7Type;
            continuation?: import("@n8n/agents").JSONValue;
            runId: string;
        };
        token: string;
        runId: string;
        checkpoint: import("@n8n/agents").SerializableAgentState;
        serializedState: string;
        updatedAt: Date;
        expiresAt: Date;
    } | undefined>;
    requestPause(parentAgentId: string, parentThreadId: string, parentResourceId: string): Promise<void>;
    shouldPause(jobId: string): Promise<boolean>;
    preparePausedResume(parentAgentId: string, parentThreadId: string, parentResourceId: string, executionId: string): Promise<{
        status: 'unavailable';
        jobs: never[];
        timeoutAt?: undefined;
        workflowsToRestart?: undefined;
    } | {
        status: 'stopping';
        jobs: never[];
        timeoutAt?: undefined;
        workflowsToRestart?: undefined;
    } | {
        status: 'expired';
        jobs: never[];
        timeoutAt?: undefined;
        workflowsToRestart?: undefined;
    } | {
        status: 'limit-reached';
        jobs: never[];
        timeoutAt?: undefined;
        workflowsToRestart?: undefined;
    } | {
        status: 'ready';
        jobs: AgentBackgroundJob[];
        timeoutAt: Date;
        workflowsToRestart: {
            jobId: string;
            title: string;
            workflowId: string | null;
            previousExecutionId: string | null;
        }[];
    }>;
    private releaseStaleResumeReservations;
    releaseResumeReservations(jobs: AgentBackgroundJob[], timeoutAt: Date): Promise<boolean>;
    pruneExpiredPausedJobs(parentThreadId?: string, signal?: AbortSignal): Promise<void>;
    retainLatestStopGroup(job: AgentBackgroundJob): Promise<void>;
    notifyResumed(jobId: string): Promise<void>;
    pause(jobId: string): Promise<boolean>;
    suspend(jobId: string): Promise<boolean>;
    settlePausedSubAgent(jobId: string, expected: ExpectedBackgroundJobState): Promise<void>;
    resume(jobId: string, timeoutAt: Date): Promise<boolean>;
    private clearChildCheckpoint;
    markMailConsumed(parentThreadId: string, jobIds: string[], includePauseReports?: boolean): Promise<number>;
    private consumeMail;
    registerAbortController(jobId: string, controller: AbortController): void;
    unregisterAbortController(jobId: string, controller: AbortController): void;
    listForThread(parentThreadId: string, ids?: string[]): Promise<BackgroundJobView[]>;
    private toJobView;
    listCurrentGroupForThread(parentAgentId: string, parentThreadId: string): Promise<Array<BackgroundJobGroupItem & Pick<AgentBackgroundJobDto, 'approval'>>>;
    cancel(parentThreadId: string, jobId: string, expected?: ExpectedBackgroundJobState): Promise<'cancelled' | 'not-found' | 'already-settled'>;
    cancelForParent(parentAgentId: string, parentThreadId: string, parentResourceId: string): Promise<void>;
    private findJob;
    private notifyJobUpdate;
    private notifyJobUpdateById;
    private requestWakeSafely;
    handleCancelRelay({ jobId }: {
        jobId: string;
    }): void;
    reconcile(signal?: AbortSignal): Promise<void>;
    reconcileWorkflowJobs(signal?: AbortSignal): Promise<void>;
    private cancelWorkflowJob;
    private consumeCancelledMail;
    private settleFinishedWorkflowJobs;
    private loadExecutionResult;
    private failJobsPastTimeout;
    private failOrphanedSubAgentJobs;
    private stopWorkflowJobExecution;
    private settleFinishedWorkflowJob;
}
