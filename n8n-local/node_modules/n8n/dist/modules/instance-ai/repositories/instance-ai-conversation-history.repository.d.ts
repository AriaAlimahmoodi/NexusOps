import { DataSource } from '@n8n/typeorm';
import { InstanceAiMessage } from '../entities/instance-ai-message.entity';
import { InstanceAiThread } from '../entities/instance-ai-thread.entity';
export interface ConversationThreadSearchRow {
    id: string;
    title: string;
    updatedAt: Date;
}
export interface ConversationThreadScope {
    userId: string;
    projectId: string;
    excludeThreadId: string;
}
export interface ConversationWindowAnchor {
    createdAt: Date;
    id: string;
}
export interface ConversationWindowParams<T> {
    threadId: string;
    anchor?: ConversationWindowAnchor;
    before: number;
    after: number;
    project: (row: InstanceAiMessage) => T | undefined;
}
export interface ConversationWindow<T> {
    rows: T[];
    hasMoreBefore: boolean;
    hasMoreAfter: boolean;
}
export declare class InstanceAiConversationHistoryRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    searchProjectThreadsForUser(params: ConversationThreadScope & {
        query: string;
        limit: number;
    }): Promise<ConversationThreadSearchRow[]>;
    listRecentProjectThreadsForUser(params: ConversationThreadScope & {
        limit: number;
    }): Promise<ConversationThreadSearchRow[]>;
    countProjectThreadsForUser(scope: ConversationThreadScope): Promise<number>;
    findOwnedThread(threadId: string, userId: string, projectId: string): Promise<InstanceAiThread | null>;
    findSearchMatchRows(threadIds: string[], query: string, maxRowsPerThread: number): Promise<Map<string, InstanceAiMessage[]>>;
    findFirstUserMessages(threadIds: string[]): Promise<Map<string, InstanceAiMessage>>;
    findMessageInThread(threadId: string, messageId: string): Promise<InstanceAiMessage | null>;
    getConversationWindow<T>(params: ConversationWindowParams<T>): Promise<ConversationWindow<T>>;
    private pageByRecency;
    private scopedThreads;
    private buildSearchQuery;
    private fetchWindowSide;
    private conversationRows;
    private orderMessages;
    private threads;
    private messages;
}
