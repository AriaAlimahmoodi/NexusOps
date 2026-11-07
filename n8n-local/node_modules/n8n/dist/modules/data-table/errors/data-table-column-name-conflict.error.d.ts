import { UserError } from 'n8n-workflow';
export declare class DataTableColumnNameConflictError extends UserError {
    constructor(columnName: string, dataTableName: string);
}
