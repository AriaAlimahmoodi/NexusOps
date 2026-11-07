import { type AgentDbMessage, type BuiltEpisodicMemoryCaptureStore, type BuiltEpisodicMemoryStore, type BuiltMemory, type BuiltObservationLogStore, type BuiltObservationLogTaskLockStore, type MemoryDescriptor, type NewObservationLogEntry, type ObservationCursor, type ObservationLogEntry, type ObservationLogReadOptions, type ObservationLogReflection, type ObservationLogReflectionResult, type ObservationLogScope, type ObservationLogTaskKind, type ObservationLogTaskLockHandle, type Thread } from '@n8n/agents';
import type { OperationContext } from '@n8n/db';
import { AgentMemoryEntryCandidateRepository } from '../repositories/agent-memory-entry-candidate.repository';
import { AgentMemoryEntryLockRepository } from '../repositories/agent-memory-entry-lock.repository';
import { AgentMemoryEntrySourceRepository } from '../repositories/agent-memory-entry-source.repository';
import { AgentMemoryEntryRepository } from '../repositories/agent-memory-entry.repository';
import { AgentMessageRepository } from '../repositories/agent-message.repository';
import { AgentObservationCursorRepository } from '../repositories/agent-observation-cursor.repository';
import { AgentObservationLockRepository } from '../repositories/agent-observation-lock.repository';
import { AgentObservationRepository } from '../repositories/agent-observation.repository';
import { AgentResourceRepository } from '../repositories/agent-resource.repository';
import { AgentThreadRepository } from '../repositories/agent-thread.repository';
export declare class N8nMemory {
    private readonly threadRepository;
    private readonly messageRepository;
    private readonly resourceRepository;
    private readonly observationRepository;
    private readonly observationCursorRepository;
    private readonly observationLockRepository;
    private readonly memoryEntryRepository;
    private readonly memoryEntryCandidateRepository;
    private readonly memoryEntryLockRepository;
    private readonly memoryEntrySourceRepository;
    constructor(threadRepository: AgentThreadRepository, messageRepository: AgentMessageRepository, resourceRepository: AgentResourceRepository, observationRepository: AgentObservationRepository, observationCursorRepository: AgentObservationCursorRepository, observationLockRepository: AgentObservationLockRepository, memoryEntryRepository: AgentMemoryEntryRepository, memoryEntryCandidateRepository: AgentMemoryEntryCandidateRepository, memoryEntryLockRepository: AgentMemoryEntryLockRepository, memoryEntrySourceRepository: AgentMemoryEntrySourceRepository);
    getImplementation(agentId: string): N8nMemoryImpl;
}
export declare class N8nMemoryImpl implements BuiltMemory, BuiltObservationLogStore, BuiltObservationLogTaskLockStore, BuiltEpisodicMemoryStore, BuiltEpisodicMemoryCaptureStore {
    private readonly agentId;
    private readonly threadRepository;
    private readonly messageRepository;
    private readonly resourceRepository;
    private readonly observationRepository;
    private readonly observationCursorRepository;
    private readonly observationLockRepository;
    private readonly memoryEntryRepository;
    private readonly memoryEntryCandidateRepository;
    private readonly memoryEntryLockRepository;
    private readonly memoryEntrySourceRepository;
    constructor(agentId: string, threadRepository: AgentThreadRepository, messageRepository: AgentMessageRepository, resourceRepository: AgentResourceRepository, observationRepository: AgentObservationRepository, observationCursorRepository: AgentObservationCursorRepository, observationLockRepository: AgentObservationLockRepository, memoryEntryRepository: AgentMemoryEntryRepository, memoryEntryCandidateRepository: AgentMemoryEntryCandidateRepository, memoryEntryLockRepository: AgentMemoryEntryLockRepository, memoryEntrySourceRepository: AgentMemoryEntrySourceRepository);
    readonly episodic: BuiltEpisodicMemoryCaptureStore['episodic'];
    getThread(threadId: string): Promise<Thread | null>;
    saveThread(thread: Omit<Thread, 'createdAt' | 'updatedAt'>): Promise<Thread>;
    patchThread(args: {
        threadId: string;
        update: (current: Thread) => {
            title?: string;
            metadata?: Record<string, unknown>;
        } | null | undefined;
    }, ctx?: OperationContext): Promise<Thread | null>;
    deleteThread(threadId: string, ctx?: OperationContext): Promise<void>;
    deleteThreadsByPrefix(threadIdPrefix: string): Promise<void>;
    private dropEpisodicEntriesWithoutSources;
    getMessages(threadId: string, opts?: {
        limit?: number;
        before?: Date;
        resourceId?: string;
    }): Promise<AgentDbMessage[]>;
    saveMessages(args: Parameters<BuiltMemory['saveMessages']>[0]): Promise<void>;
    deleteMessages(messageIds: string[]): Promise<void>;
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
    private releaseScopeLock;
    private enqueueEpisodicMemoryCaptureCandidate;
    private getPendingEpisodicMemoryCaptureCandidates;
    private completeEpisodicMemoryCaptureCandidates;
    private recordEpisodicMemoryCaptureCandidateFailure;
    private acquireEpisodicMemoryTaskLock;
    private releaseEpisodicMemoryTaskLock;
    private saveEpisodicMemoryEntryWithSources;
    private searchEpisodicMemoryEntries;
    private episodicMemoryReadScopeIds;
    private getEpisodicMemoryEntrySources;
    private applyEpisodicMemoryReflection;
    describe(): MemoryDescriptor;
    private toAgentDbMessage;
    private toObservationLogEntry;
    private toEpisodicMemoryEntry;
    private toEpisodicMemoryCaptureCandidate;
    private toEpisodicMemoryEntrySource;
    private mergeThreadMetadata;
    private parseThreadMetadata;
    private toThread;
}
