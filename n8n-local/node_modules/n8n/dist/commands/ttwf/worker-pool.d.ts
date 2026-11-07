export declare class WorkerPool<T> {
    private maxWorkers;
    private queue;
    private activeWorkers;
    constructor(maxWorkers: number);
    execute(task: () => Promise<T>): Promise<T>;
    private processQueue;
}
