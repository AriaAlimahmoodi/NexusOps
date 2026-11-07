import { ResponseError } from '@n8n/errors';
export declare class IncompatibleNodesApiVersionError extends ResponseError {
    readonly meta: {
        requiredNodesApiVersion: string | null;
        supportedNodesApiVersion: string;
    };
    constructor(message: string, meta: {
        requiredNodesApiVersion: string | null;
        supportedNodesApiVersion: string;
    }, cause?: unknown);
}
