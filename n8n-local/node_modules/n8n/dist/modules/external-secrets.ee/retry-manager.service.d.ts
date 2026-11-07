import { Logger } from '@n8n/backend-common';
export type RetryOperation = () => Promise<{
    success: boolean;
    error?: Error;
}>;
export declare class ExternalSecretsRetryManager {
    private retries;
    private readonly logger;
    constructor(logger: Logger);
    runWithRetry(key: string, operation: RetryOperation): Promise<{
        success: boolean;
        error?: Error;
    }>;
    private scheduleRetry;
    cancelRetry(key: string): boolean;
    cancelAll(): void;
    isRetrying(key: string): boolean;
    getRetryInfo(key: string): {
        attempt: number;
        nextBackoff: number;
    } | undefined;
}
