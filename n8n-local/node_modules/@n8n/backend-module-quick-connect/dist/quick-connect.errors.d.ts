import { OperationalError } from 'n8n-workflow';
export declare class QuickConnectError extends OperationalError {
    readonly credentialType: string;
    constructor(message: string, credentialType: string, cause?: Error);
}
