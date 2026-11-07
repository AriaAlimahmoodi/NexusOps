import type { Workflow, IWorkflowBase } from 'n8n-workflow';
import { UnexpectedError } from '@n8n/errors';
export declare class WorkflowMissingIdError extends UnexpectedError {
    constructor(workflow: Workflow | IWorkflowBase);
}
