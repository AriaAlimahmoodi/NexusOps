import { NotFoundError } from '@n8n/errors';
export declare class DataTableColumnNotFoundError extends NotFoundError {
    constructor(dataTableId: string, columnId: string);
}
