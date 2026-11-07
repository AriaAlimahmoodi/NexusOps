import { OperationalError } from 'n8n-workflow';
export declare class CredentialResolutionError extends OperationalError {
    constructor(message: string, options?: {
        cause?: unknown;
    });
}
