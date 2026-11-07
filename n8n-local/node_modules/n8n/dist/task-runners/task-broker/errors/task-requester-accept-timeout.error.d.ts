import { OperationalError } from 'n8n-workflow';
export declare class TaskRequesterAcceptTimeoutError extends OperationalError {
    constructor(taskId: string, requesterId: string);
}
