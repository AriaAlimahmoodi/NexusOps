import { NotFoundError } from '@n8n/errors';
export declare class DataTableNotFoundError extends NotFoundError {
    constructor(dataTableId: string);
}
