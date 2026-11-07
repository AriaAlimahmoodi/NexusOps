import type { IRunNodeResponse, WorkflowSettingsBinaryMode } from 'n8n-workflow';
export declare function convertBinaryData(workflowId: string, executionId: string | undefined, responseData: IRunNodeResponse, binaryMode: WorkflowSettingsBinaryMode | undefined): Promise<IRunNodeResponse>;
