import type { RunningJobSummary } from '@n8n/api-types';
import type Bull from 'bull';
import type { ExecutionError, ExecutionStatus, IDataObject, IExecuteResponsePromiseData, IRun, StructuredChunk } from 'n8n-workflow';
import type PCancelable from 'p-cancelable';
export type JobQueue = Bull.Queue<JobData>;
export type Job = Bull.Job<JobData>;
export type JobId = Job['id'];
export type JobData = {
    workflowId: string;
    executionId: string;
    loadStaticData: boolean;
    pushRef?: string;
    streamingEnabled?: boolean;
    callerAwaitsOutcome?: 'none' | 'response' | 'completion';
    restartExecutionId?: string;
    projectId?: string;
    projectName?: string;
    poolName?: string;
    encryptedRunnerIdentity?: string;
    isMcpExecution?: boolean;
    mcpType?: 'service' | 'trigger';
    mcpSessionId?: string;
    mcpMessageId?: string;
    mcpToolCall?: {
        toolName: string;
        arguments: Record<string, unknown>;
        sourceNodeName?: string;
    };
    mcpToolInput?: IDataObject;
};
export type JobResult = {
    success: boolean;
};
export type JobStatus = Bull.JobStatus;
export type JobOptions = Bull.JobOptions;
export type JobMessage = RespondToWebhookMessage | JobFinishedMessage | JobFailedMessage | AbortJobMessage | SendChunkMessage | McpResponseMessage;
export type RespondToWebhookMessage = {
    kind: 'respond-to-webhook';
    executionId: string;
    response: IExecuteResponsePromiseData;
    workerId: string;
};
export type JobFinishedProps = {
    success: boolean;
    error?: ExecutionError;
    status: ExecutionStatus;
    lastNodeExecuted?: string;
    usedDynamicCredentials?: boolean;
    metadata?: Record<string, string>;
    waitTill?: Date | null;
    startedAt: Date;
    stoppedAt: Date;
    nodeTimeSavedMinutes?: number;
};
export type JobFinishedMessage = JobFinishedMessageV1 | JobFinishedMessageV2;
type JobFinishedMessageV1 = {
    kind: 'job-finished';
    version?: undefined;
    executionId: string;
    workerId: string;
    success: boolean;
};
type JobFinishedMessageV2 = {
    kind: 'job-finished';
    version: 2;
    executionId: string;
    workerId: string;
} & JobFinishedProps;
export type SendChunkMessage = {
    kind: 'send-chunk';
    executionId: string;
    chunkText: StructuredChunk;
    workerId: string;
};
export type McpResponseMessage = {
    kind: 'mcp-response';
    executionId: string;
    mcpType: 'service' | 'trigger';
    sessionId: string;
    messageId: string;
    response: unknown;
    workerId: string;
};
export type JobFailedMessage = {
    kind: 'job-failed';
    executionId: string;
    workerId: string;
    errorMsg: string;
    errorStack: string;
};
export type AbortJobMessage = {
    kind: 'abort-job';
};
export type RunningJob = RunningJobSummary & {
    run: PCancelable<IRun>;
    suspend?: () => boolean;
};
export type QueueRecoveryContext = {
    timeout?: NodeJS.Timeout;
    batchSize: number;
    waitMs: number;
};
export {};
