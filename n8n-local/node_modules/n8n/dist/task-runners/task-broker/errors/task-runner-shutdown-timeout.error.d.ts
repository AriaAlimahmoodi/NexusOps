import { OperationalError } from 'n8n-workflow';
export declare class TaskRunnerShutdownTimeoutError extends OperationalError {
    description: string;
    constructor();
}
