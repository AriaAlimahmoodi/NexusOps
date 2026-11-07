import { ForbiddenError } from '@n8n/errors';
export declare class InvalidMfaCodeError extends ForbiddenError {
    constructor(hint?: string);
}
