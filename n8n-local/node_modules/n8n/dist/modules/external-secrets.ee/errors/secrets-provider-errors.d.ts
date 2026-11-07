import type { Logger } from '@n8n/backend-common';
export type SafeContextValue = string | number | boolean | undefined;
type AggregateContextValue = Record<string, number> | string[];
type LogContextValue = SafeContextValue | AggregateContextValue;
export type LogContext = Record<string, LogContextValue>;
export type SecretsProviderOperation = 'initialize' | 'connect' | 'disconnect' | 'update' | 'test' | 'tokenRefresh';
export type HttpProviderErrorLogContext = LogContext & {
    errorCode?: SafeContextValue;
    statusCode?: number;
};
export declare const UPDATE_FAILURE_SAMPLE_SIZE = 5;
export declare function buildHttpProviderErrorContext(error: unknown): HttpProviderErrorLogContext;
export declare function buildFailureSummaryLogContext(failures: Array<{
    name: string;
    errorCode: SafeContextValue;
}>): {
    failedCount: number;
    errorCodes: Record<string, number>;
    sampleSecretNames: string[];
} | null;
type LogSecretsProviderOperationFailureParams = {
    logger: Logger;
    message: string;
    providerName: string;
    providerDisplayName: string;
} & SecretsProviderOperationFailureParams;
export type SecretsProviderOperationFailureParams = {
    operation: SecretsProviderOperation;
    error: unknown;
    context?: LogContext;
};
export declare function logSecretsProviderOperationFailure({ logger, message, providerName, providerDisplayName, operation, error, context, }: LogSecretsProviderOperationFailureParams): void;
export {};
