import { UserError } from 'n8n-workflow';
type ReasonId = 'python' | 'venv';
export declare class MissingRequirementsError extends UserError {
    constructor(reasonId: ReasonId);
}
export {};
