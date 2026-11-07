import type { Logger } from '@n8n/backend-common';
import type ivm from 'isolated-vm';
export declare class PoolDisposedError extends Error {
    constructor();
}
export declare class PoolExhaustedError extends Error {
    constructor();
}
export declare class AgentIsolateSlot {
    readonly isolate: ivm.Isolate;
    private bundleScript;
    constructor(ivmModule: typeof ivm, memoryLimit: number, libraryBundle: string);
    get isHealthy(): boolean;
    createContext(): ivm.Context;
    dispose(): void;
}
export interface AgentIsolatePoolOptions {
    size?: number;
    memoryLimit?: number;
    highWaterMarkRatio?: number;
    maxQueueDepth?: number;
    logger?: Logger;
}
export declare class AgentIsolatePool {
    private readonly ivmModule;
    private readonly libraryBundle;
    private slots;
    private waitQueue;
    private disposed;
    private warming;
    private replenishPromises;
    private readonly size;
    private readonly memoryLimit;
    private readonly highWaterMarkRatio;
    private readonly maxQueueDepth;
    private readonly logger;
    private static readonly MAX_REPLENISH_RETRIES;
    private static readonly REPLENISH_RETRY_BASE_MS;
    constructor(ivmModule: typeof ivm, libraryBundle: string, options?: AgentIsolatePoolOptions);
    initialize(): Promise<void>;
    acquire(): Promise<AgentIsolateSlot>;
    release(slot: AgentIsolateSlot): void;
    tryAcquireSync(): AgentIsolateSlot | null;
    dispose(): Promise<void>;
    private isOverHighWaterMark;
    private createSlot;
    private replenish;
}
