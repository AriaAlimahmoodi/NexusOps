import type { Project } from '@n8n/db';
import { WorkflowOperationError } from 'n8n-workflow';
import type { INode } from 'n8n-workflow';
type CallerType = 'workflow' | 'agent';
type Options = {
    subworkflowId: string;
    subworkflowProject: Project;
    hasReadAccess: boolean;
    instanceUrl: string;
    ownerName?: string;
    node?: INode;
    callerType?: CallerType;
};
export declare const SUBWORKFLOW_DENIAL_BASE_DESCRIPTION = "The sub-workflow you\u2019re trying to execute limits which workflows it can be called by.";
export declare const SUBWORKFLOW_AGENT_DENIAL_BASE_DESCRIPTION = "The sub-workflow you\u2019re trying to execute doesn\u2019t allow this agent to call it.";
export declare class SubworkflowPolicyDenialError extends WorkflowOperationError {
    constructor({ subworkflowId, subworkflowProject, instanceUrl, hasReadAccess, ownerName, node, callerType, }: Options);
}
export {};
