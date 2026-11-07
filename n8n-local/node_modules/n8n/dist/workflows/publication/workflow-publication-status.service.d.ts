import type { WorkflowPublicationStatus, WorkflowListPublicationStatus } from '@n8n/api-types';
import { WorkflowPublicationOutboxRepository, type OperationContext, WorkflowPublicationTriggerStatusRepository } from '@n8n/db';
import type { INode } from 'n8n-workflow';
export declare class WorkflowPublicationStatusService {
    private readonly outboxRepository;
    private readonly triggerStatusRepository;
    constructor(outboxRepository: WorkflowPublicationOutboxRepository, triggerStatusRepository: WorkflowPublicationTriggerStatusRepository);
    getStatus(workflowId: string, ctx?: OperationContext): Promise<WorkflowPublicationStatus>;
    getListStatusesByWorkflowIds(workflowIds: string[]): Promise<Map<string, WorkflowListPublicationStatus>>;
    getFailedActivationError(workflowId: string, nodes: Array<Pick<INode, 'id' | 'name'>>): Promise<string | null>;
    private deriveStatus;
    private deriveSettledStatus;
}
