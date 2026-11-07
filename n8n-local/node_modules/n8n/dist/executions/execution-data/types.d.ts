import type { ExecutionDataStorageLocation } from '@n8n/db';
import type { WorkflowDocument } from '@n8n/engine';
import type { IWorkflowBase } from 'n8n-workflow';
export type BlobStorageLocation = Exclude<ExecutionDataStorageLocation, 'db'>;
export type ExecutionRef = {
    workflowId: string;
    executionId: string;
};
export declare function createExecutionRef(workflowId: string, executionId: string): ExecutionRef;
export type WorkflowSnapshot = Pick<IWorkflowBase, 'id' | 'name' | 'nodes' | 'connections' | 'settings' | 'nodeGroups'>;
export declare function toWorkflowSnapshot(workflow: WorkflowSnapshot): WorkflowSnapshot;
export declare function toWorkflowDocument(workflow: WorkflowSnapshot): WorkflowDocument;
export type ExecutionDataPayload = BundleWorkflowSnapshot & {
    data: string;
};
export declare function isExecutionDataPayload(x: BundleWorkflowSnapshot): x is ExecutionDataPayload;
export type BundleWorkflowSnapshot = {
    workflowData: WorkflowSnapshot;
    workflowVersionId: string | null;
};
