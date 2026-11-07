import { UnexpectedError } from '@n8n/errors';
export declare class RedactableError extends UnexpectedError {
    constructor(fieldName: string, args: string);
}
