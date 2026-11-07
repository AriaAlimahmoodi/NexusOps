import type { PushType } from '@n8n/api-types';
import type { JSONSchema7 } from 'json-schema';
import type { ExecuteAgentData, ExecuteAgentInvocationContext, ExecuteAgentSource, ExecuteAgentWorkflowContext, ExecuteWorkflowData, ExecuteWorkflowOptions, ExecutionStatus, IDataObject, IExecuteWorkflowInfo, INode, INodeExecutionData, INodeParameters, IRun, IWorkflowBase, IWorkflowExecuteAdditionalData, IWorkflowExecutionDataProcess, IWorkflowSettings, RelatedExecution, WorkflowExecuteMode } from 'n8n-workflow';
import type { PrepareWorkflowAgentForEval } from './modules/agents/agent-runtime-instrumentation';
export declare function getRunData(workflowData: IWorkflowBase, inputData?: INodeExecutionData[], parentExecution?: RelatedExecution): IWorkflowExecutionDataProcess;
export declare function getDraftWorkflowData(workflowInfo: IExecuteWorkflowInfo, parentWorkflowId: string, parentWorkflowSettings?: IWorkflowSettings): Promise<IWorkflowBase>;
export declare function getPublishedWorkflowData(workflowInfo: IExecuteWorkflowInfo, parentWorkflowId: string, parentWorkflowSettings?: IWorkflowSettings): Promise<IWorkflowBase>;
export declare function executeWorkflow(workflowInfo: IExecuteWorkflowInfo, additionalData: IWorkflowExecuteAdditionalData, options: ExecuteWorkflowOptions): Promise<ExecuteWorkflowData>;
export declare function executeAgent(source: ExecuteAgentSource, message: string, executionId: string, threadId: string, additionalData: IWorkflowExecuteAdditionalData, executionMode: WorkflowExecuteMode, outputSchema?: JSONSchema7, workflowContext?: ExecuteAgentWorkflowContext, invocationContext?: ExecuteAgentInvocationContext, prepareForEval?: PrepareWorkflowAgentForEval): Promise<ExecuteAgentData>;
export declare function triggerReturnsLastRunOnly(nodes: INode[]): boolean;
export declare function buildSubWorkflowOutput(data: IRun, workflowNodes: INode[], callerReturnsLastRunOnly: boolean): Array<INodeExecutionData[] | null>;
export declare function setExecutionStatus(this: {
    executionId?: string;
}, status: ExecutionStatus): void;
export declare function sendDataToUI(this: {
    pushRef?: string;
}, type: PushType, data: IDataObject | IDataObject[]): void;
export declare function getBase({ userId, workflowId, projectId, currentNodeParameters, executionTimeoutTimestamp, workflowSettings, }?: {
    userId?: string;
    workflowId?: string;
    projectId?: string;
    currentNodeParameters?: INodeParameters;
    executionTimeoutTimestamp?: number;
    workflowSettings?: IWorkflowSettings;
}): Promise<IWorkflowExecuteAdditionalData>;
