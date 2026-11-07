import type { IWorkflowBase, IWorkflowExecutionDataProcess, WorkflowExecuteMode } from 'n8n-workflow';
import { CredentialsPermissionChecker } from '../executions/pre-execution-checks';
import type { ResumableExecution } from '../interfaces';
import { EngineDataPlaneProxyService } from '../services/engine-data-plane-proxy.service';
import { EngineV2PayloadFiles } from '../services/engine-v2-payload-files.service';
import { EngineV2PushRegistry } from '../services/engine-v2-push-registry.service';
export declare class EngineV2Dispatcher {
    private readonly proxy;
    private readonly credentialsPermissionChecker;
    private readonly pushRegistry;
    private readonly payloadFiles;
    constructor(proxy: EngineDataPlaneProxyService, credentialsPermissionChecker: CredentialsPermissionChecker, pushRegistry: EngineV2PushRegistry, payloadFiles: EngineV2PayloadFiles);
    routesToEngineV2(data: IWorkflowExecutionDataProcess, existingExecution?: ResumableExecution): boolean;
    handlesWorkflow(workflowData: IWorkflowBase, executionMode: WorkflowExecuteMode): boolean;
    start(data: IWorkflowExecutionDataProcess): Promise<string>;
    private prepare;
    private registerPushSession;
    private assertSupported;
    private firedTriggerNode;
    private resolveFiredTrigger;
    private triggerMainOutputs;
    private toTriggerOutputs;
}
