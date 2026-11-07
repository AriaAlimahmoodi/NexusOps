import { OperationalError } from 'n8n-workflow';
export declare class TaskRunnerUnreachableError extends OperationalError {
    constructor(taskId: string, runnerId: string);
}
