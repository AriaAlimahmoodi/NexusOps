import { type AgentDbMessage, type AgentMessage } from '@n8n/agents';
import type { AgentMessageAuthor } from '@n8n/api-types';
import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { UserError } from 'n8n-workflow';
import { AgentMessageEntity, type AgentMessageOrigin } from '../entities/agent-message.entity';
interface RuntimeMessageScope {
    threadId: string;
    resourceId?: string;
}
export declare class AgentMessageIdConflictError extends UserError {
    readonly messageId: string;
    constructor(messageId: string);
}
export declare class AgentMessageRepository extends BaseRepository<AgentMessageEntity> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    createInput(params: {
        id?: string;
        threadId: string;
        resourceId: string;
        content: AgentMessage;
        modelContent?: AgentMessage;
        author?: AgentMessageAuthor;
        origin: AgentMessageOrigin;
    }, ctx: OperationContext): Promise<AgentMessageEntity>;
    linkExecutionInput(executionId: string, messageId: string, scope: {
        threadId: string;
        resourceId: string;
    }, ctx: OperationContext): Promise<void>;
    updatePendingInput(id: string, content: AgentMessage, ctx: OperationContext): Promise<void>;
    clearPendingInput(id: string, ctx: OperationContext): Promise<void>;
    copyExecutionInputs(executionId: string, predecessorId: string, threadId: string, ctx: OperationContext): Promise<string[]>;
    findExecutionInputs(executionIds: string[]): Promise<Map<string, AgentMessageEntity[]>>;
    saveRuntimeMessages(params: RuntimeMessageScope & {
        resourceId: string;
        messages: AgentDbMessage[];
        executionId?: string;
    }, ctx?: OperationContext): Promise<void>;
    private runtimeMessageEntity;
    discardRuntimeInput(ids: string[]): Promise<void>;
    findRuntimeMessages(scope: RuntimeMessageScope, opts?: {
        limit?: number;
        before?: Date;
        since?: {
            sinceCreatedAt: Date;
            sinceMessageId: string;
        };
    }): Promise<AgentMessageEntity[]>;
    findRecentThreadIdsByResourceId(agentId: string, resourceId: string, limit: number): Promise<string[]>;
}
export {};
