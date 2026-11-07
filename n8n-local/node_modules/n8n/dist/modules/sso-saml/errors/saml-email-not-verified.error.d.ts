import { AuthError } from '@n8n/errors';
export declare class SamlEmailNotVerifiedError extends AuthError {
    readonly email: string;
    constructor(email: string);
}
