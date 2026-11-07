import { OperationalError } from '@n8n/errors';
export declare class DuplicateExecutionError extends OperationalError {
    readonly deduplicationKey: string;
    constructor(deduplicationKey: string, cause?: Error);
}
