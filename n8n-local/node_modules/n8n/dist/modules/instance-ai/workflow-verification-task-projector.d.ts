import type { TaskList } from '@n8n/api-types';
import type { Logger } from '@n8n/backend-common';
import { type ManagedBackgroundTask, type PlannedTaskGraph } from '@n8n/instance-ai';
import type { InProcessEventBus } from './event-bus/in-process-event-bus';
import type { TypeORMAgentMemory } from './storage/typeorm-agent-memory';
import { type WorkflowVerificationObligationService } from './workflow-verification-obligation-service';
export declare class WorkflowVerificationTaskProjector {
    private readonly agentMemory;
    private readonly eventBus;
    private readonly logger;
    private readonly obligations;
    constructor(agentMemory: TypeORMAgentMemory, eventBus: InProcessEventBus, logger: Logger, obligations: WorkflowVerificationObligationService);
    projectPlannedTaskList(threadId: string, graph: PlannedTaskGraph): Promise<TaskList>;
    private projectPlannedVerifyRow;
    syncFromBackgroundTask(task: ManagedBackgroundTask): Promise<void>;
    private directItemsFromTask;
    private directItemsFromCompletedTask;
    syncFromWorkflowLoop(threadId: string, runId: string): Promise<void>;
    private upsertItems;
    private saveAndPublish;
}
