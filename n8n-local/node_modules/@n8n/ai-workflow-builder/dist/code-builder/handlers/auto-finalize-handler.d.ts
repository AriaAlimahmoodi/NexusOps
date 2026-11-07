import type { BaseMessage } from '@langchain/core/messages';
import type { WorkflowJSON } from '@n8n/workflow-sdk';
import type { StreamOutput } from '../../types/streaming';
import type { WarningTracker } from '../state/warning-tracker';
import type { ParseAndValidateResult } from '../types';
type ParseAndValidateFn = (code: string, currentWorkflow?: WorkflowJSON) => Promise<ParseAndValidateResult>;
type GetErrorContextFn = (code: string, errorMessage: string) => string;
export interface AutoFinalizeHandlerConfig {
    parseAndValidate: ParseAndValidateFn;
    getErrorContext: GetErrorContextFn;
}
export interface AutoFinalizeParams {
    code: string;
    currentWorkflow: WorkflowJSON | undefined;
    messages: BaseMessage[];
    warningTracker?: WarningTracker;
}
export interface AutoFinalizeResult {
    success: boolean;
    workflow?: WorkflowJSON;
    parseDuration?: number;
}
export declare class AutoFinalizeHandler {
    private parseAndValidate;
    private getErrorContext;
    constructor(config: AutoFinalizeHandlerConfig);
    execute(params: AutoFinalizeParams): AsyncGenerator<StreamOutput, AutoFinalizeResult, unknown>;
}
export {};
