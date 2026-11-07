type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export declare class CircuitBreakerOpen extends Error {
    constructor(message?: string);
}
export interface CircuitBreakerOptions {
    timeout: number;
    maxFailures: number;
    halfOpenRequests: number;
    failureWindow: number;
    maxConcurrentHalfOpenRequests?: number;
}
export declare class CircuitBreaker {
    private state;
    private halfOpenCount;
    private lastFailureTime;
    private logger;
    private pendingHalfOpenRequests;
    private inflightRequests;
    private slidingWindow;
    private readonly timeoutMs;
    private readonly maxFailures;
    private readonly halfOpenRequests;
    private readonly failureWindowMs;
    private readonly maxConcurrentHalfOpenRequests;
    constructor(options: CircuitBreakerOptions);
    currentState(): CircuitBreakerState;
    private getFailureCount;
    private clearFailures;
    private recordFailure;
    private changeToState;
    private handleOpenState;
    private handleHalfOpenState;
    private handleClosedState;
    execute<T>(fn: () => Promise<T>): Promise<T>;
}
export {};
