import { UserError } from '@n8n/errors';
export declare class CredentialNotFoundError extends UserError {
    constructor(credentialId: string, credentialType?: string);
}
