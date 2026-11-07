import type { ICredentialContext } from 'n8n-workflow';
import { CredentialResolutionError } from '../../errors/credential-resolution.error';
export declare class IdentifierValidationError extends CredentialResolutionError {
    constructor(message: string, options?: ErrorOptions);
}
export interface ITokenIdentifier {
    resolve(context: ICredentialContext, identifierOptions: Record<string, unknown>, executionId?: string): Promise<string>;
    validateOptions(identifierOptions: Record<string, unknown>): Promise<void>;
}
