import { UserError } from '@n8n/errors';
export declare class PreExecuteBlockedError extends UserError {
    readonly cause: Error;
    constructor(cause: Error);
    static unwrap(error: unknown): unknown;
}
