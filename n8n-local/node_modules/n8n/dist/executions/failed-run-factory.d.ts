import { StorageConfig } from 'n8n-core';
import { type ExecutionError, type INode, type IRun, type WorkflowExecuteMode } from 'n8n-workflow';
export declare class FailedRunFactory {
    private readonly storageConfig;
    constructor(storageConfig: StorageConfig);
    generateFailedExecutionFromError(mode: WorkflowExecuteMode, error: ExecutionError, node: INode | undefined, startTime?: number): IRun;
}
