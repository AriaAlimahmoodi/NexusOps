import { CredentialResolutionError } from './credential-resolution.error';
export declare class N8nIdentityNotSupportedError extends CredentialResolutionError {
    constructor(credentialName: string);
}
