import type { Request } from 'express';
export interface OriginValidationResult {
    isValid: boolean;
    originInfo?: {
        protocol: 'http' | 'https';
        host: string;
    };
    expectedHost?: string;
    expectedProtocol?: 'http' | 'https';
    rawExpectedHost?: string;
    error?: string;
}
export declare function validateWebSocketOrigin(headers: Request['headers']): OriginValidationResult;
export declare function validateSseOrigin(headers: Request['headers']): OriginValidationResult;
