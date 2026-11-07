import { ResponseError } from '@n8n/errors';
export declare class LicenseEulaRequiredError extends ResponseError {
    readonly meta: {
        eulaUrl: string;
    };
    constructor(message: string, meta: {
        eulaUrl: string;
    });
}
