import { Logger } from '@n8n/backend-common';
import { StorageConfig } from 'n8n-core';
import type { ExecutionStorageLocation, IPinData, IRun, IWorkflowExecuteAdditionalData, IWorkflowExecutionDataProcess, Workflow } from 'n8n-workflow';
import type PCancelable from 'p-cancelable';
export declare class ManualExecutionService {
    private readonly logger;
    private readonly storageConfig;
    constructor(logger: Logger, storageConfig: StorageConfig);
    getExecutionStartNode(data: IWorkflowExecutionDataProcess, workflow: Workflow): import("n8n-workflow").INode | undefined;
    runManually(data: IWorkflowExecutionDataProcess, workflow: Workflow, additionalData: IWorkflowExecuteAdditionalData, executionId: string, pinData?: IPinData, storedAt?: ExecutionStorageLocation): PCancelable<IRun>;
}
