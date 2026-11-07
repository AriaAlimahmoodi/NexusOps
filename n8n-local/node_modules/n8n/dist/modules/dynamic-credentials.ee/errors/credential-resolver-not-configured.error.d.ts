import { CredentialResolutionError } from './credential-resolution.error';
export declare class CredentialResolverNotConfiguredError extends CredentialResolutionError {
    constructor(credentialName: string);
}
