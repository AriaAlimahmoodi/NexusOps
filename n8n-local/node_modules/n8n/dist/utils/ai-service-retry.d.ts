type RetryLogger = {
    warn: (message: string, metadata?: Record<string, unknown>) => void;
};
type RetryErrorReporter = {
    warn: (error: Error | string) => void;
};
type RetryOptions = {
    retryOnTimeout?: boolean;
};
export declare function callAiServiceWithRetry<T>(label: string, call: () => Promise<T>, logger?: RetryLogger, errorReporter?: RetryErrorReporter, options?: RetryOptions): Promise<T>;
export {};
