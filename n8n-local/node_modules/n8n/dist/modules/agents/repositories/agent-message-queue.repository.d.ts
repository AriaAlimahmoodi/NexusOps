import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { AgentMessageQueue } from '../entities/agent-message-queue.entity';
import type { AgentQueueDispatch, QueuedUserChatMessage } from '../types/agent-queued-message';
export declare class AgentMessageQueueRepository extends BaseRepository<AgentMessageQueue> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    enqueue(threadId: string, messageId: string, payload: AgentQueueDispatch, ctx: OperationContext): Promise<AgentMessageQueue>;
    listPending(threadId: string, ctx?: OperationContext): Promise<AgentMessageQueue[]>;
    hasItems(threadId: string, ctx?: OperationContext): Promise<boolean>;
    findItem(threadId: string, id: string, ctx: OperationContext): Promise<AgentMessageQueue | null>;
    movePending(threadId: string, id: string, targetId: string, expectedIds: string[], kind: QueuedUserChatMessage['kind'], ctx: OperationContext): Promise<boolean>;
    removePending(threadId: string, id: string, ctx: OperationContext): Promise<boolean>;
    findHead(threadId: string, ctx: OperationContext): Promise<AgentMessageQueue | null>;
    reserveSteering(threadId: string, id: string, executionId: string, ctx: OperationContext): Promise<boolean>;
    findSteering(threadId: string, executionId: string, ctx: OperationContext): Promise<AgentMessageQueue[]>;
    hasSteeringFor(threadId: string, executionId: string, ctx?: OperationContext): Promise<boolean>;
    findSteeringExecutionIds(threadId: string, ctx: OperationContext): Promise<string[]>;
    releaseSteering(threadId: string, executionId: string, ctx: OperationContext): Promise<boolean>;
    consumeSteering(threadId: string, executionId: string, ids: string[], ctx: OperationContext): Promise<void>;
    findActive(threadId: string, ctx: OperationContext): Promise<AgentMessageQueue | null>;
    findThreadIds(ctx?: OperationContext): Promise<string[]>;
    linkExecution(id: string, previousId: string | null, executionId: string, ctx: OperationContext): Promise<boolean>;
    removeActive(threadId: string, executionId: string, ctx: OperationContext): Promise<boolean>;
    findDeliveryState(id: string): Promise<AgentMessageQueue | null>;
    findPublishedConnection(agentId: string, projectId: string, source: string, credentialId: string, ctx?: OperationContext): Promise<{
        type: "telegram";
        credentialId: string;
        approval?: {
            mode: "global";
        } | {
            mode: "selected";
            tools: string[];
        } | undefined;
        settings?: {
            accessMode: "private" | "public";
            allowedUsers: string[];
            sessionIdleTimeoutMinutes?: number | null | undefined;
        } | undefined;
    } | {
        type: "slack";
        credentialId: string;
        approval?: {
            mode: "global";
        } | {
            mode: "selected";
            tools: string[];
        } | undefined;
        settings?: {
            messagingExperience: "agent" | "assistant";
            sessionIdleTimeoutMinutes?: number | null | undefined;
        } | undefined;
    } | {
        type: "linear";
        credentialId: string;
        approval?: {
            mode: "global";
        } | {
            mode: "selected";
            tools: string[];
        } | undefined;
        settings?: {
            sessionIdleTimeoutMinutes?: number | null | undefined;
        } | undefined;
    } | {
        type: "discord";
        credentialId: string;
        approval?: {
            mode: "global";
        } | {
            mode: "selected";
            tools: string[];
        } | undefined;
        settings?: {
            sessionIdleTimeoutMinutes?: number | null | undefined;
        } | undefined;
    } | {
        type: "whatsapp";
        credentialId: string;
        approval?: {
            mode: "global";
        } | {
            mode: "selected";
            tools: string[];
        } | undefined;
        settings?: {
            sessionIdleTimeoutMinutes?: number | null | undefined;
            typingIndicator?: boolean | undefined;
            downloadMedia?: boolean | undefined;
            mediaRetentionDays?: number | undefined;
        } | undefined;
    } | {
        type: "teams";
        credentialId: string;
        approval?: {
            mode: "global";
        } | {
            mode: "selected";
            tools: string[];
        } | undefined;
        settings?: {
            sessionIdleTimeoutMinutes?: number | null | undefined;
            displayName?: string | undefined;
            description?: string | undefined;
            teamChannels?: boolean | undefined;
            groupChats?: boolean | undefined;
            readAllChannelMessages?: boolean | undefined;
            readAllGroupMessages?: boolean | undefined;
        } | undefined;
    } | {
        type: "n8n_chat";
        credentialId: "";
    } | undefined>;
}
