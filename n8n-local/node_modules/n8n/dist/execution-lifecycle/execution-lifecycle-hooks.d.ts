import { ExecutionLifecycleHooks } from 'n8n-core';
import type { IWorkflowBase, IWorkflowExecutionDataProcess, RelatedExecution, WorkflowExecuteMode } from 'n8n-workflow';
export declare function getLifecycleHooksForSubExecutions(mode: WorkflowExecuteMode, executionId: string, workflowData: IWorkflowBase, userId?: string, parentExecution?: RelatedExecution, projectId?: string, projectName?: string): ExecutionLifecycleHooks;
export declare function getLifecycleHooksForScalingWorker(data: IWorkflowExecutionDataProcess, executionId: string): ExecutionLifecycleHooks;
export declare function getLifecycleHooksForScalingMain(data: IWorkflowExecutionDataProcess, executionId: string): ExecutionLifecycleHooks;
export declare function getLifecycleHooksForRegularMain(data: IWorkflowExecutionDataProcess, executionId: string): ExecutionLifecycleHooks;
