import { UserError } from 'n8n-workflow';
export declare class WorkflowToolUnavailableError extends UserError {
    readonly reason: 'not_found' | 'not_published' | 'incompatible';
    constructor(reason: 'not_found' | 'not_published' | 'incompatible', message: string);
}
