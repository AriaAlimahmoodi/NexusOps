import { UserError } from '@n8n/errors';
export declare class WebhookResponseTooLargeError extends UserError {
    constructor(message: string, options: {
        description: string;
        cause?: unknown;
    });
}
