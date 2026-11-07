import { UserError } from '@n8n/errors';
export declare class InvalidConcurrencyLimitError extends UserError {
    constructor(value: number);
}
