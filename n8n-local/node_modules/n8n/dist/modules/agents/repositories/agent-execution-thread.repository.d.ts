import type { AgentSessionQueryFilters } from '@n8n/api-types';
import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { AgentExecution } from '../entities/agent-execution.entity';
import { AgentExecutionThread, type AgentThreadAccess } from '../entities/agent-execution-thread.entity';
import { type AgentSessionMode } from '../utils/agent-thread-access';
export interface AgentExecutionThreadMetadata {
    parentThreadId?: string;
    parentAgentId?: string;
}
export interface AgentExecutionThreadPage {
    threads: AgentExecutionThread[];
    nextCursor: string | null;
}
export interface AgentExecutionThreadKeyset {
    updatedAt: Date;
    id: string;
}
export interface AgentExecutionThreadKeysetPage {
    threads: AgentExecutionThread[];
    hasMore: boolean;
}
interface AgentSessionDeletionRefs {
    attachmentBinaryDataIds: string[];
    executionLogs: Array<Pick<AgentExecution, 'id' | 'storedAt'>>;
}
export declare class AgentExecutionThreadRepository extends BaseRepository<AgentExecutionThread> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    lockById(threadId: string, ctx: OperationContext): Promise<AgentExecutionThread | null>;
    findOrCreate(threadId: string, agentId: string, agentName: string, projectId: string, access: AgentThreadAccess, ctx: OperationContext, metadata?: AgentExecutionThreadMetadata, taskId?: string | null, taskVersionId?: string | null, sessionMode?: AgentSessionMode): Promise<{
        thread: AgentExecutionThread;
        created: boolean;
    }>;
    findByProjectIdPaginated(projectId: string, agentId: string, userId: string, limit: number, cursor?: string, filters?: AgentSessionQueryFilters): Promise<AgentExecutionThreadPage>;
    findN8nChatThreadsForOwner(userId: string, agentIds: string[], options: {
        limit: number;
        cursor?: string;
        search?: string;
    }): Promise<AgentExecutionThreadPage>;
    findN8nChatThreadForOwner(userId: string, agentIds: string[], threadId: string): Promise<AgentExecutionThread | null>;
    private n8nChatThreadsQuery;
    countN8nChatThreadsByAgent(userId: string, projectIds: string[] | null): Promise<Map<string, number>>;
    private updatedAtExpression;
    private paginateByUpdatedAt;
    private applyListFilters;
    private applyStatusFilter;
    private applyPreviewFilter;
    private latestExecutionStatusSubquery;
    private normalizedFirstSource;
    private applyOriginFilter;
    findOwnedByAgent(agentId: string, ownerId: string, options?: {
        limit?: number;
    }): Promise<AgentExecutionThread[]>;
    findOwnedById(agentId: string, ownerId: string, threadId: string): Promise<AgentExecutionThread | null>;
    renameOwned(agentId: string, ownerId: string, threadId: string, title: string, ctx: OperationContext): Promise<boolean>;
    moveOwned(agentId: string, ownerId: string, threadId: string, projectId: string, ctx: OperationContext): Promise<boolean>;
    findOwnedHistoryPage(agentId: string, ownerId: string, limit: number, search?: string, before?: AgentExecutionThreadKeyset): Promise<AgentExecutionThreadKeysetPage>;
    findByAgentUpdatedBefore(agentId: string, cutoff: Date, limit: number): Promise<AgentExecutionThread[]>;
    findByParentThreadId(parentThreadId: string, projectId: string): Promise<AgentExecutionThread[]>;
    bumpUpdatedAt(threadId: string, ctx?: OperationContext): Promise<void>;
    incrementUsage(threadId: string, promptTokens: number, completionTokens: number, cost: number, duration: number, ctx?: OperationContext): Promise<void>;
    deleteSession(projectId: string, agentId: string, threadId: string, userId: string, ctx: OperationContext): Promise<{
        status: 'deleted';
        refs: AgentSessionDeletionRefs;
    } | {
        status: 'busy';
    } | null>;
    private findSessionCheckpointRunIds;
    private findCheckpointRows;
    private findExternalRefs;
}
export {};
