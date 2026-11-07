import { UnexpectedError } from '@n8n/errors';
export declare class CredentialMissingIdError extends UnexpectedError {
    constructor(credentialName: string, credentialType: string);
}
