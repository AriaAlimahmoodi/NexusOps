interface RunExclusiveOptions<T> {
    workflowId: string;
    fn: () => Promise<T>;
    signal: AbortSignal;
}
export declare class WorkflowPublicationLifecycleLock {
    private readonly stateByWorkflowId;
    isLocked(workflowId: string): boolean;
    runExclusive<T>({ workflowId, fn, signal }: RunExclusiveOptions<T>): Promise<T>;
    private getOrCreateState;
    private acquire;
    private release;
}
export {};
