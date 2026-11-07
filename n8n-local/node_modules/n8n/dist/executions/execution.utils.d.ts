import type { IWorkflowBase } from 'n8n-workflow';
export declare function getWorkflowActiveStatusFromWorkflowData(workflowData: IWorkflowBase): boolean;
export declare function isManualOrChatExecution(executionMode?: string): boolean;
