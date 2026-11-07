import { OperationalError } from 'n8n-workflow';
export declare class TaskRequestTimeoutError extends OperationalError {
    description: string;
    constructor({ elapsedSeconds, isSelfHosted, }: {
        elapsedSeconds: number;
        isSelfHosted: boolean;
    });
}
