import { Workflow } from 'n8n-workflow';
import type { CodeExecutionMode, IDataObject, INodeExecutionData, INodeParameters, WorkflowExecuteMode, WorkflowParameters, ITaskDataConnections, INode, IRunExecutionData, EnvProviderState, IExecuteData, IWorkflowDataProxyData } from 'n8n-workflow';
import { type Context } from 'node:vm';
import type { MainConfig } from '../config/main-config';
import type { InputDataChunkDefinition, PartialAdditionalData, TaskResultData } from '../runner-types';
import type { TaskParams } from '../task-runner';
import { TaskRunner } from '../task-runner';
export interface RpcCallObject {
    [name: string]: ((...args: unknown[]) => Promise<unknown>) | RpcCallObject;
}
export type RunnerExecutionMode = 'runCode' | CodeExecutionMode;
export interface JSExecSettings {
    code: string;
    additionalProperties?: Record<string, unknown>;
    nodeMode: RunnerExecutionMode;
    workflowMode: WorkflowExecuteMode;
    continueOnFail: boolean;
    chunk?: InputDataChunkDefinition;
}
export interface JsTaskData {
    workflow: Omit<WorkflowParameters, 'nodeTypes'>;
    inputData: ITaskDataConnections;
    connectionInputData: INodeExecutionData[];
    node: INode;
    runExecutionData: IRunExecutionData;
    runIndex: number;
    itemIndex: number;
    activeNodeName: string;
    siblingParameters: INodeParameters;
    mode: WorkflowExecuteMode;
    envProviderState: EnvProviderState;
    executeData?: IExecuteData;
    defaultReturnRunIndex: number;
    selfData: IDataObject;
    contextNodeName: string;
    additionalData: PartialAdditionalData;
}
export declare class JsTaskRunner extends TaskRunner {
    private static readonly CONSOLE_METHODS;
    private readonly requireResolver;
    private readonly builtInsParser;
    private readonly taskDataReconstruct;
    private readonly mode;
    constructor(config: MainConfig, name?: string);
    private preventPrototypePollution;
    executeTask(taskParams: TaskParams<JSExecSettings>, abortSignal: AbortSignal): Promise<TaskResultData>;
    private validateTaskSettings;
    private getNativeVariables;
    runCode(settings: JSExecSettings, abortSignal: AbortSignal): Promise<unknown>;
    private runForAllItems;
    private runForEachItem;
    private createDataProxy;
    private extractJsonData;
    private toExecutionErrorIfNeeded;
    private reconstructTaskData;
    private requestNodeTypeIfNeeded;
    private buildRpcCallObject;
    private buildCustomConsole;
    buildContext(taskId: string, workflow: Workflow, node: INode, dataProxy?: IWorkflowDataProxyData, additionalProperties?: Record<string, unknown>): Context;
    private createVmExecutableCode;
    private runDirectly;
}
