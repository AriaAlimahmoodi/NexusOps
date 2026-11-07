import type { Logger } from '@n8n/backend-common';
import type { InstanceAiConfig } from '@n8n/config';
import type { DeepPartial } from '@n8n/typeorm';
import type { InstanceAiPendingConfirmation } from './entities/instance-ai-pending-confirmation.entity';
export interface PendingConfirmationStore {
    create(entityLike: DeepPartial<InstanceAiPendingConfirmation>): InstanceAiPendingConfirmation;
    save(entity: InstanceAiPendingConfirmation): Promise<InstanceAiPendingConfirmation>;
    deleteByRequestId(requestId: string): Promise<number>;
    deleteByThreadId(threadId: string): Promise<number>;
    deleteExpired(now: Date): Promise<number>;
}
export interface SuspendedThreadPersistenceServiceOptions {
    logger: Logger;
    config: Pick<InstanceAiConfig, 'confirmationTimeout'>;
    pendingConfirmationRepo: PendingConfirmationStore;
}
export declare class SuspendedThreadPersistenceService {
    private readonly logger;
    private readonly config;
    private readonly pendingConfirmationRepo;
    constructor(options: SuspendedThreadPersistenceServiceOptions);
    pruneStalePendingConfirmations(now: number): Promise<void>;
    private computePendingConfirmationExpiresAt;
    persistPendingConfirmation(params: {
        requestId: string;
        threadId: string;
        userId: string;
        runId: string;
        messageGroupId?: string;
        kind: 'inline' | 'suspended';
        toolCallId?: string;
        checkpointKey?: string;
        checkpointTaskId?: string;
    }): Promise<void>;
    dropPendingConfirmation(requestId: string): Promise<void>;
    dropPendingConfirmationsForThread(threadId: string): Promise<void>;
}
