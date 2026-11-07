import { UserError } from 'n8n-workflow';
export declare class SystemResolverModificationError extends UserError {
    constructor(action: 'create' | 'update' | 'delete');
}
