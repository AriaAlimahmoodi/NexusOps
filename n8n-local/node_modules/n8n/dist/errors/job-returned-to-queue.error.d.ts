import { OperationalError } from '@n8n/errors';
export declare class JobReturnedToQueueError extends OperationalError {
    readonly jobId: string;
    constructor(jobId: string);
}
