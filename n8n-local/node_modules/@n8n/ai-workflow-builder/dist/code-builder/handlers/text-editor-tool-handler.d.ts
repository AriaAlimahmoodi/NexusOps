import type { BaseMessage } from '@langchain/core/messages';
import type { WorkflowJSON } from '@n8n/workflow-sdk';
import type { StreamOutput } from '../../types/streaming';
import type { WarningTracker } from '../state/warning-tracker';
import type { ParseAndValidateResult } from '../types';
type TextEditorExecuteFn = (args: Record<string, unknown>) => string;
type TextEditorGetCodeFn = () => string | null;
type ParseAndValidateFn = (code: string, currentWorkflow?: WorkflowJSON) => Promise<ParseAndValidateResult>;
type GetErrorContextFn = (code: string, errorMessage: string) => string;
export interface TextEditorToolHandlerConfig {
    textEditorExecute: TextEditorExecuteFn;
    textEditorGetCode: TextEditorGetCodeFn;
    parseAndValidate: ParseAndValidateFn;
    getErrorContext: GetErrorContextFn;
}
export interface TextEditorToolParams {
    toolCallId: string;
    args: Record<string, unknown>;
    currentWorkflow: WorkflowJSON | undefined;
    iteration: number;
    messages: BaseMessage[];
    warningTracker?: WarningTracker;
}
export interface TextEditorToolResult {
    workflowReady?: boolean;
    workflow?: WorkflowJSON;
}
export interface PreviewParseResult {
    chunk?: StreamOutput;
    parseError?: string;
}
export declare class TextEditorToolHandler {
    private textEditorExecute;
    private textEditorGetCode;
    private parseAndValidate;
    private getErrorContext;
    constructor(config: TextEditorToolHandlerConfig);
    execute(params: TextEditorToolParams): AsyncGenerator<StreamOutput, TextEditorToolResult | undefined, unknown>;
    private autoValidateAfterCreate;
    tryParseForPreview(currentWorkflow?: WorkflowJSON): Promise<PreviewParseResult>;
    private createToolProgressChunk;
    private createWorkflowUpdateChunk;
}
export {};
