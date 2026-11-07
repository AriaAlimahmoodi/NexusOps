import { type AgentDbMessage, type BuiltObservationLogStore, type BuiltObservationLogTaskLockStore, type NewObservationLogEntry, type ObservationCursor, type ObservationLogEntry, type ObservationLogReadOptions, type ObservationLogReflection, type ObservationLogReflectionResult, type ObservationLogScope, type ObservationLogTaskKind, type ObservationLogTaskLockHandle } from '@n8n/agents';
import type { InstanceAiMessage } from '../entities/instance-ai-message.entity';
import type { InstanceAiMessageRepository } from '../repositories/instance-ai-message.repository';
import type { InstanceAiObservationCursorRepository } from '../repositories/instance-ai-observation-cursor.repository';
import type { InstanceAiObservationLockRepository } from '../repositories/instance-ai-observation-lock.repository';
import type { InstanceAiObservationRepository } from '../repositories/instance-ai-observation.repository';
export declare class TypeORMObservationLogStore implements BuiltObservationLogStore, BuiltObservationLogTaskLockStore {
    private readonly observationRepo;
    private readonly observationCursorRepo;
    private readonly observationLockRepo;
    private readonly messageRepo;
    private readonly toAgentMessage;
    constructor(observationRepo: InstanceAiObservationRepository, observationCursorRepo: InstanceAiObservationCursorRepository, observationLockRepo: InstanceAiObservationLockRepository, messageRepo: InstanceAiMessageRepository, toAgentMessage: (entity: InstanceAiMessage) => AgentDbMessage | undefined);
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
}
