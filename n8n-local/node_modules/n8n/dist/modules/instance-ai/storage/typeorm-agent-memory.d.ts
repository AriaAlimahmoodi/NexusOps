import { type AgentDbMessage, type BuiltMemory, type BuiltObservationLogStore, type BuiltObservationLogTaskLockStore, type MemoryDescriptor, type NewObservationLogEntry, type ObservationCursor, type ObservationLogEntry, type ObservationLogReadOptions, type ObservationLogReflection, type ObservationLogReflectionResult, type ObservationLogScope, type ObservationLogTaskKind, type ObservationLogTaskLockHandle, type Thread, type RuntimeSkillStateStore } from '@n8n/agents';
import { Logger } from '@n8n/backend-common';
import { type ThreadPatch } from '@n8n/instance-ai';
import { InstanceAiMessageRepository } from '../repositories/instance-ai-message.repository';
import { InstanceAiObservationCursorRepository } from '../repositories/instance-ai-observation-cursor.repository';
import { InstanceAiObservationLockRepository } from '../repositories/instance-ai-observation-lock.repository';
import { InstanceAiObservationRepository } from '../repositories/instance-ai-observation.repository';
import { InstanceAiResourceRepository } from '../repositories/instance-ai-resource.repository';
import { InstanceAiThreadRepository } from '../repositories/instance-ai-thread.repository';
export declare class TypeORMAgentMemory implements BuiltMemory, BuiltObservationLogStore, BuiltObservationLogTaskLockStore {
    private readonly threadRepo;
    private readonly messageRepo;
    private readonly resourceRepo;
    readonly skillState: RuntimeSkillStateStore;
    private readonly threadMutationQueues;
    private readonly observationLog;
    constructor(threadRepo: InstanceAiThreadRepository, messageRepo: InstanceAiMessageRepository, resourceRepo: InstanceAiResourceRepository, observationRepo: InstanceAiObservationRepository, observationCursorRepo: InstanceAiObservationCursorRepository, observationLockRepo: InstanceAiObservationLockRepository, logger: Logger);
    private readonly logger;
    describe(): MemoryDescriptor;
    getThread(threadId: string): Promise<Thread | null>;
    listThreadHistory(resourceId: string, limit: number, search?: string, before?: {
        updatedAt: Date;
        id: string;
    }): Promise<Thread[]>;
    listThreads(args: {
        filter?: {
            resourceId?: string;
        };
        perPage?: number;
        page?: number;
        orderBy?: {
            field: 'createdAt' | 'updatedAt';
            direction: 'ASC' | 'DESC';
        };
    }): Promise<{
        threads: Thread[];
        total: number;
        page: number;
        hasMore: boolean;
    }>;
    saveThread(thread: Omit<Thread, 'createdAt' | 'updatedAt'>): Promise<Thread>;
    private resolveSubAgentProjectId;
    saveThreadWithProject(thread: Omit<Thread, 'createdAt' | 'updatedAt'>, projectId: string): Promise<Thread>;
    patchThread(args: {
        threadId: string;
        update: (current: Thread) => ThreadPatch | null | undefined;
    }): Promise<Thread | null>;
    deleteThread(threadId: string): Promise<void>;
    getThreadProjectId(threadId: string): Promise<string | null>;
    deleteThreadsByResourceIdPrefix(resourceIdPrefix: string): Promise<void>;
    deleteThreadsByResourceId(resourceId: string): Promise<number>;
    getMessages(threadId: string, opts?: {
        limit?: number;
        before?: Date;
    }): Promise<AgentDbMessage[]>;
    listMessages(args: {
        threadId: string;
        limit?: number;
        page?: number;
        withNewerBoundary?: boolean;
    }): Promise<{
        messages: AgentDbMessage[];
        newerBoundaryAt?: Date;
    }>;
    saveMessages(args: {
        threadId: string;
        resourceId: string;
        messages: AgentDbMessage[];
    }): Promise<void>;
    deleteMessages(messageIds: string[]): Promise<void>;
    getWorkingMemory(params: {
        threadId: string;
        resourceId: string;
        scope: 'resource' | 'thread';
    }): Promise<string | null>;
    saveWorkingMemory(params: {
        threadId: string;
        resourceId: string;
        scope: 'resource' | 'thread';
    }, content: string): Promise<void>;
    appendObservationLogEntries(rows: NewObservationLogEntry[]): Promise<ObservationLogEntry[]>;
    getActiveObservationLog(scope: ObservationLogScope & {
        limit?: number;
        order?: 'asc' | 'desc';
    }): Promise<ObservationLogEntry[]>;
    getObservationLog(opts: ObservationLogReadOptions): Promise<ObservationLogEntry[]>;
    getMessagesForObservationScope(observationScopeId: string, opts?: {
        since?: {
            sinceCreatedAt: Date;
            sinceMessageId: string;
        };
    }): Promise<AgentDbMessage[]>;
    dropObservationLogEntries(ids: string[]): Promise<void>;
    supersedeObservationLogEntries(ids: string[], supersededBy: string): Promise<void>;
    applyObservationLogReflection(scope: ObservationLogScope, reflection: ObservationLogReflection): Promise<ObservationLogReflectionResult>;
    getCursor(observationScopeId: string): Promise<ObservationCursor | null>;
    setCursor(cursor: ObservationCursor): Promise<void>;
    acquireObservationLogTaskLock(observationScopeId: string, taskKind: ObservationLogTaskKind, opts: {
        ttlMs: number;
        holderId: string;
    }): Promise<ObservationLogTaskLockHandle | null>;
    releaseObservationLogTaskLock(handle: ObservationLogTaskLockHandle): Promise<void>;
    private serializeThreadMutation;
    private toAgentMessage;
}
