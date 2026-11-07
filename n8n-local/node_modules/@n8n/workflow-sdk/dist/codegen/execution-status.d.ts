import type { IRunExecutionData } from 'n8n-workflow';
type ExecutionResultData = IRunExecutionData['resultData'];
export interface NodeExecutionStatus {
    status: 'success' | 'error' | 'not_executed';
    errorMessage?: string;
}
export declare function buildNodeExecutionStatus(data?: ExecutionResultData): Map<string, NodeExecutionStatus>;
export declare function formatExecutionStatusJSDoc(data?: ExecutionResultData): string;
export {};
