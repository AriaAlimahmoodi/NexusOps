import { UserError } from 'n8n-workflow';
import { CredentialResolutionError } from './credential-resolution.error';
export declare class DynamicCredentialResolverNotFoundError extends UserError {
    constructor(resolverId: string);
}
export declare class CredentialResolverNotFoundError extends CredentialResolutionError {
    constructor(credentialName: string, resolverId: string);
}
