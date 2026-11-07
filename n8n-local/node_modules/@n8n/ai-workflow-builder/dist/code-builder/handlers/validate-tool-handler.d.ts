import type { BaseMessage } from '@langchain/core/messages';
import type { WorkflowJSON } from '@n8n/workflow-sdk';
import type { StreamOutput } from '../../types/streaming';
import type { WarningTracker } from '../state/warning-tracker';
import type { ParseAndValidateResult } from '../types';
type ParseAndValidateFn = (code: string, currentWorkflow?: WorkflowJSON) => Promise<ParseAndValidateResult>;
type GetErrorContextFn = (code: string, errorMessage: string) => string;
export interface ValidateToolHandlerConfig {
    parseAndValidate: ParseAndValidateFn;
    getErrorContext: GetErrorContextFn;
}
export interface ValidateToolParams {
    toolCallId: string;
    code: string | null;
    currentWorkflow: WorkflowJSON | undefined;
    iteration: number;
    messages: BaseMessage[];
    warningTracker: WarningTracker;
}
export interface ValidateToolResult {
    workflowReady: boolean;
    workflow?: WorkflowJSON;
    parseDuration?: number;
}
export declare class ValidateToolHandler {
    private parseAndValidate;
    private getErrorContext;
    constructor(config: ValidateToolHandlerConfig);
    execute(params: ValidateToolParams): AsyncGenerator<StreamOutput, ValidateToolResult, unknown>;
    private createToolProgressChunk;
    private createWorkflowUpdateChunk;
}
export {};
