import { OperationalError } from 'n8n-workflow';
export declare class TaskCancelledError extends OperationalError {
    constructor(reason: string);
}
