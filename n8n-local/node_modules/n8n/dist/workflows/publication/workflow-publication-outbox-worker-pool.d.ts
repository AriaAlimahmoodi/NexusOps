interface OutboxWorkerPoolOptions {
    runPass: () => Promise<void>;
    shouldRun: () => boolean;
    concurrency: number;
    onWorkerError: (error: Error) => void;
}
export declare class WorkflowPublicationOutboxWorkerPool {
    private readonly options;
    private readonly activeWorkers;
    private wakeRequested;
    constructor(options: OutboxWorkerPoolOptions);
    topUp(): void;
    awaitIdle(): Promise<Error | null>;
    private spawnWorker;
}
export {};
