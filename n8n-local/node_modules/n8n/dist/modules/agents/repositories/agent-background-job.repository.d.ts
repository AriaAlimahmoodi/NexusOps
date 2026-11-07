import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { AgentBackgroundJob, type AgentBackgroundJobKind, type AgentBackgroundJobStatus } from '../entities/agent-background-job.entity';
import { AgentExecutionThreadRepository } from './agent-execution-thread.repository';
type NewAgentBackgroundJobBase = {
    id: string;
    parentAgentId: string;
    parentThreadId: string;
    parentResourceId: string;
    parentPrincipalHash: string;
    title: string;
};
export type NewSubAgentJob = NewAgentBackgroundJobBase & {
    kind: 'subagent';
    subAgentId: string;
    childThreadId: string;
    timeoutAt: Date;
};
export type NewWorkflowJob = NewAgentBackgroundJobBase & {
    kind: 'workflow';
    workflowId: string;
    childExecutionId: string;
};
export type AgentBackgroundJobSettlement = {
    status: Exclude<AgentBackgroundJobStatus, 'running' | 'suspended' | 'paused'>;
    result?: string | null;
    error?: string | null;
};
export type ExpectedBackgroundJobState = {
    status: 'running' | 'suspended' | 'paused';
    timeoutAt?: Date | null;
    pauseRequestId?: string | null;
};
export type BackgroundJobGroupItem = Pick<AgentBackgroundJob, 'id' | 'kind' | 'title' | 'status' | 'createdAt' | 'settledAt' | 'notifiedAt' | 'pauseRequestId'>;
export declare class AgentBackgroundJobRepository extends BaseRepository<AgentBackgroundJob> {
    private readonly threadRepository;
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner, threadRepository: AgentExecutionThreadRepository);
    insertSubAgentJobIfCapacity(job: NewSubAgentJob, limit: number): Promise<boolean>;
    insertWorkflowJobOrGetExisting(job: NewWorkflowJob): Promise<{
        inserted: true;
    } | {
        inserted: false;
        existing: AgentBackgroundJob;
    }>;
    countActiveSubAgentsByParentThread(parentThreadId: string, ctx?: OperationContext): Promise<number>;
    findByParentThread(parentThreadId: string, ids?: string[]): Promise<AgentBackgroundJob[]>;
    findGroupCandidates(parentAgentId: string, parentThreadId: string): Promise<BackgroundJobGroupItem[]>;
    findById(id: string): Promise<AgentBackgroundJob | null>;
    findWakeableUnconsumed(parentThreadId: string): Promise<AgentBackgroundJob[]>;
    private activePauseGroup;
    markMailConsumed(parentThreadId: string, ids: string[], includePauseReports?: boolean): Promise<number>;
    markApprovalDelivered(id: string, runId: string, state: string): Promise<void>;
    private matchCheckpoint;
    findThreadsWithUnconsumedMail(): Promise<string[]>;
    findRunningWorkflowJobByExecutionId(executionId: string): Promise<AgentBackgroundJob | null>;
    findRunningJobs(kind?: AgentBackgroundJobKind): Promise<AgentBackgroundJob[]>;
    findRequestedPauses(parentThreadId?: string): Promise<AgentBackgroundJob[]>;
    hasRequestedStop(parentThreadId: string, parentResourceId: string): Promise<boolean>;
    findSettledSubAgentsWithCheckpoints(): Promise<AgentBackgroundJob[]>;
    findPausedWithoutCheckpoint(updatedAfter: Date, parentThreadId?: string): Promise<AgentBackgroundJob[]>;
    findActivePastTimeout(now: Date): Promise<AgentBackgroundJob[]>;
    suspendIfRunning(id: string, timeoutAt: Date, runId: string, state: string): Promise<boolean>;
    resumeIfSuspended(id: string, timeoutAt: Date): Promise<boolean>;
    requestPause(parentAgentId: string, parentThreadId: string, parentResourceId: string, pauseRequestId: string): Promise<void>;
    pauseIfRequested(job: AgentBackgroundJob, resultText: string, runId: string, state: string): Promise<boolean>;
    resumeIfPaused(id: string, pauseRequestId: string, status: 'running' | 'suspended', timeoutAt: Date, reservationTimeoutAt?: Date): Promise<boolean>;
    reservePausedGroup(parentThreadId: string, pauseRequestId: string, ids: string[], timeoutAt: Date, limit: number): Promise<'reserved' | 'limit-reached' | 'changed'>;
    releasePausedResume(id: string, pauseRequestId: string, timeoutAt: Date): Promise<boolean>;
    retainLatestStopGroup(parentAgentId: string, parentThreadId: string, parentResourceId: string, replacementNotice: string): Promise<AgentBackgroundJob[]>;
    settleIfActive(id: string, settlement: AgentBackgroundJobSettlement, expected?: ExpectedBackgroundJobState): Promise<boolean>;
    deleteSettledBefore(cutoff: Date): Promise<void>;
}
export {};
