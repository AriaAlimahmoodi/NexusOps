import type { ZodIssue } from 'zod';
export declare class SyslogClientError extends Error {
    readonly code?: string | undefined;
    readonly cause?: Error | undefined;
    constructor(message: string, code?: string | undefined, cause?: Error | undefined);
}
export declare class ValidationError extends SyslogClientError {
    readonly validationErrors: Array<{
        path: string;
        message: string;
    }>;
    constructor(message: string, validationErrors: Array<{
        path: string;
        message: string;
    }>);
    static fromZod(message: string, zodErrors: ZodIssue[]): ValidationError;
}
export declare class ConnectionError extends SyslogClientError {
    constructor(message: string, cause?: Error);
}
export declare class TransportError extends SyslogClientError {
    readonly transportType: string;
    constructor(message: string, transportType: string, cause?: Error);
}
export declare class TimeoutError extends SyslogClientError {
    constructor(message?: string);
}
