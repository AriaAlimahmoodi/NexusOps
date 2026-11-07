import type { RequestHandler } from 'express';
export interface JitterOptions {
    minMs?: number;
    maxMs?: number;
}
export declare const createJitterMiddleware: (options?: JitterOptions) => RequestHandler;
