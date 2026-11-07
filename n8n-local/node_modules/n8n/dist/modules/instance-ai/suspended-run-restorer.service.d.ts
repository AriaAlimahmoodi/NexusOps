import type { InstanceAiConfirmResponse } from '@n8n/api-types';
import type { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { type ConfirmationData, type RunStateRegistry, type SuspendedRunState } from '@n8n/instance-ai';
import type { InstanceAiPendingConfirmation } from './entities/instance-ai-pending-confirmation.entity';
import type { InProcessEventBus } from './event-bus/in-process-event-bus';
import type { InstanceAiPendingConfirmationRepository } from './repositories/instance-ai-pending-confirmation.repository';
type ClaimedOrphan = InstanceAiPendingConfirmation;
export type ResumableOrphan = ClaimedOrphan & {
    toolCallId: string;
    checkpointKey: string;
};
export type RebuildSuspendedRunOutcome = {
    kind: 'ready';
    state: SuspendedRunState<User>;
} | {
    kind: 'no-user';
} | {
    kind: 'no-checkpoint';
    error?: unknown;
} | {
    kind: 'env-failure';
    error: unknown;
} | {
    kind: 'agent-failure';
    error: unknown;
};
export interface SuspendedRunRebuilder {
    rebuildSuspendedRun(orphan: ResumableOrphan): Promise<RebuildSuspendedRunOutcome>;
    resumeSuspendedRun(requestingUserId: string, requestId: string, data: ConfirmationData): Promise<InstanceAiConfirmResponse | null>;
}
export type OrphanConfirmationStore = Pick<InstanceAiPendingConfirmationRepository, 'claim'>;
export type SuspendedRunStateRegistry = Pick<RunStateRegistry<User>, 'suspendRun' | 'hasLiveRun'>;
export type RunFinishEventPublisher = Pick<InProcessEventBus, 'publish'>;
export interface SuspendedRunRestorerOptions {
    logger: Logger;
    pendingConfirmationRepo: OrphanConfirmationStore;
    runState: SuspendedRunStateRegistry;
    eventBus: RunFinishEventPublisher;
    rebuilder: SuspendedRunRebuilder;
}
export declare class SuspendedRunRestorer {
    private readonly logger;
    private readonly pendingConfirmationRepo;
    private readonly runState;
    private readonly eventBus;
    private readonly rebuilder;
    constructor(options: SuspendedRunRestorerOptions);
    resolveOrphanedConfirmation(userId: string, requestId: string, data: ConfirmationData): Promise<InstanceAiConfirmResponse | null>;
    private canResumeOrphan;
    private finalizeUnresumableOrphan;
    private publishRunFinish;
    private tryResumeFromOrphan;
}
export {};
