import { ForbiddenError } from '@n8n/errors';
export declare class InvalidMfaRecoveryCodeError extends ForbiddenError {
    constructor(hint?: string);
}
