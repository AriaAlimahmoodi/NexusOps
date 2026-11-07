import { UserError } from 'n8n-workflow';
export declare class DataTableSystemColumnNameConflictError extends UserError {
    constructor(columnName: string, type?: string);
}
