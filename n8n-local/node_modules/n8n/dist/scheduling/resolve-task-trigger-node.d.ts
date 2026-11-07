import type { ClaimedTask } from '@n8n/scheduler';
import type { INode, IWorkflowBase } from 'n8n-workflow';
export declare function resolveTaskTriggerNode(workflowData: IWorkflowBase, nodeId: string, task: ClaimedTask, errorMessage: string): INode;
