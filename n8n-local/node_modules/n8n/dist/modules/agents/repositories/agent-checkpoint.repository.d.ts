import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { AgentCheckpoint } from '../entities/agent-checkpoint.entity';
export declare class AgentCheckpointRepository extends BaseRepository<AgentCheckpoint> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    findByRunId(runId: string, ctx?: OperationContext): Promise<AgentCheckpoint | null>;
    findByRunIdAndAgentId(runId: string, agentId: string, ctx?: OperationContext): Promise<AgentCheckpoint | null>;
    findActiveForThread(agentId: string, threadId: string, updatedAfter: Date, ctx?: OperationContext): Promise<AgentCheckpoint[]>;
    saveCheckpoint(checkpoint: AgentCheckpoint, ctx: OperationContext): Promise<void>;
    findRetainedByThreadId(threadId: string): Promise<AgentCheckpoint[]>;
    findForSandboxReconciliation(agentId: string): Promise<AgentCheckpoint[]>;
    claimForResume(runId: string, agentId: string, suspendedState: string, runningState: string, updatedAfter: Date): Promise<boolean>;
    cancelSuspended(runId: string, agentId: string, suspendedState: string, ctx?: OperationContext): Promise<boolean>;
    markUserPaused(runId: string, agentId: string, state: string, pausedState: string, updatedAt: Date): Promise<boolean>;
    expireByRunIdAndAgentId(runId: string, agentId: string, ctx?: OperationContext): Promise<void>;
    markExpired(olderThan: Date): Promise<number>;
}
