import { NotFoundError } from '@n8n/errors';
export declare const webhookNotFoundErrorMessage: ({ path, httpMethod, webhookMethods, }: {
    path: string;
    httpMethod?: string;
    webhookMethods?: string[];
}) => string;
export declare class WebhookNotFoundError extends NotFoundError {
    constructor({ path, httpMethod, webhookMethods, }: {
        path: string;
        httpMethod?: string;
        webhookMethods?: string[];
    }, { hint }?: {
        hint: 'default' | 'production';
    });
}
