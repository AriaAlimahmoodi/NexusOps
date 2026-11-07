import { UserError } from 'n8n-workflow';
export declare class CredentialStorageError extends UserError {
    constructor(message: string, options?: {
        cause?: unknown;
    });
}
