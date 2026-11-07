import type { IExecutionResponse } from '@n8n/db';
import type { ChatNodeMessage, IExecuteData, INode, Workflow } from 'n8n-workflow';
export declare function findResumeNode(executionData: IExecuteData, workflow: Workflow): INode | null;
export declare function redirectIfToolExecutor(execution: IExecutionResponse, executionData: IExecuteData, workflow: Workflow): INode | null;
export declare function getMessage(execution: IExecutionResponse): ChatNodeMessage | undefined;
export declare function getLastNodeExecuted(execution: IExecutionResponse): INode | undefined;
export declare function shouldResumeImmediately(lastNode: INode): boolean;
export declare function getLastNodeMessage(execution: IExecutionResponse, lastNode: INode): string;
