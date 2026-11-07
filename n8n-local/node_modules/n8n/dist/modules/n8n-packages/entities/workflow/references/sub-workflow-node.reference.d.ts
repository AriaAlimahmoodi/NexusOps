import { type INode } from 'n8n-workflow';
import type { EntityReference } from '../../reference';
import type { WorkflowSubWorkflowRequirement } from '../workflow.types';
export declare const subWorkflowNodeReference: EntityReference<WorkflowSubWorkflowRequirement>;
export declare function getStaticSubworkflowId(node: {
    type: string;
    parameters: Record<string, unknown>;
}): string | undefined;
export declare function setStaticSubworkflowId(node: INode, workflowId: string): void;
