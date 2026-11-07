import type { WorkflowEntity } from '@n8n/db';
import type { Scope } from '@n8n/permissions';
import type { WorkflowSettings } from 'n8n-workflow';
import type { OwnershipService } from '../services/ownership.service';
export declare function getRequiredRedactionScopes(oldPolicy: WorkflowSettings.RedactionPolicy | undefined, newPolicy: WorkflowSettings.RedactionPolicy): Scope[];
export declare function getErrorNodeId(error: unknown): string | undefined;
export declare function getErrorDescription(error: unknown): string | undefined;
export declare function dropRedactionPolicy(newWorkflow: WorkflowEntity): void;
export declare function getWorkflowProjectDetailsSafe(ownershipService: OwnershipService, workflowId: string): Promise<{
    projectId: string;
    projectName: string;
}>;
