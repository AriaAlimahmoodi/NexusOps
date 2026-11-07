export declare const isTransientActivationError: (error: Error) => boolean;
export declare function retryTriggerActivation(activate: () => Promise<void>, maxAttempts: number, signal: AbortSignal): Promise<void>;
