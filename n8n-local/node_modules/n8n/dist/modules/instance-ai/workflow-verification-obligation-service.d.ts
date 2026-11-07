import { type PlannedTaskGraph, type PlannedWorkflowVerification, type WorkflowBuildOutcome, type WorkflowLoopWorkItemRecord, type WorkflowVerificationObligation, type WorkflowVerificationObligationSource } from '@n8n/instance-ai';
import type { TypeORMAgentMemory } from './storage/typeorm-agent-memory';
export declare function parseWorkflowBuildOutcome(outcome: Record<string, unknown> | undefined): WorkflowBuildOutcome | undefined;
export declare class WorkflowVerificationObligationService {
    private readonly agentMemory;
    private readonly isSetupPanelEnabled;
    constructor(agentMemory: TypeORMAgentMemory, isSetupPanelEnabled?: (threadId: string) => boolean);
    private storage;
    isPlannedRecord(record: WorkflowLoopWorkItemRecord): boolean;
    getObligation(threadId: string, workItemId: string, options: {
        source: WorkflowVerificationObligationSource;
        plannedTaskId?: string;
    }): Promise<WorkflowVerificationObligation | undefined>;
    obligationFromRecord(threadId: string, record: WorkflowLoopWorkItemRecord, options: {
        source: WorkflowVerificationObligationSource;
        plannedTaskId?: string;
    }): WorkflowVerificationObligation;
    findPendingPlannedWorkflowVerification(threadId: string, graph: PlannedTaskGraph): Promise<PlannedWorkflowVerification | undefined>;
    revalidatePlannedWorkflowVerification(threadId: string, verification: PlannedWorkflowVerification): Promise<PlannedWorkflowVerification | undefined>;
    private pendingPlannedWorkflowVerificationFromTask;
}
