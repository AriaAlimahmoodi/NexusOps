import type { InstanceAiConfirmRequest, InstanceAiEnsureThreadResponse } from '@n8n/api-types';
import type { User } from '@n8n/db';
import { Telemetry } from '../../telemetry';
import { DurableEventLog } from './event-bus/durable-event-log';
import { InProcessEventBus } from './event-bus/in-process-event-bus';
import { InstanceAiMemoryService, type InstanceAiThreadLaunchMetadata } from './instance-ai-memory.service';
import { InstanceAiPendingConfirmationRepository } from './repositories/instance-ai-pending-confirmation.repository';
export declare function startsOnboardingFirstTurn(requestId: string, request: InstanceAiConfirmRequest): boolean;
export declare class InstanceAiOnboardingService {
    private readonly memoryService;
    private readonly eventBus;
    private readonly eventLog;
    private readonly pendingConfirmationRepo;
    private readonly telemetry;
    constructor(memoryService: InstanceAiMemoryService, eventBus: InProcessEventBus, eventLog: DurableEventLog, pendingConfirmationRepo: InstanceAiPendingConfirmationRepository, telemetry: Telemetry);
    ensureThread(user: User, threadId: string, projectId: string, launchMetadata: InstanceAiThreadLaunchMetadata): Promise<InstanceAiEnsureThreadResponse>;
    answerCard(userId: string, requestId: string, request: InstanceAiConfirmRequest): Promise<{
        threadId: string;
        runId: string;
    } | {
        threadId: string;
        firstMessage: string;
    } | undefined>;
    private seedTurn;
}
