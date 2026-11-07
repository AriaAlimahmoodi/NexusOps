import type { AIMessage, BaseMessage } from '@langchain/core/messages';
import type { WorkflowJSON } from '@n8n/workflow-sdk';
import type { WarningTracker } from '../state/warning-tracker';
import type { ParseAndValidateResult } from '../types';
type ParseAndValidateFn = (code: string, currentWorkflow?: WorkflowJSON) => Promise<ParseAndValidateResult>;
export interface FinalResponseHandlerConfig {
    parseAndValidate: ParseAndValidateFn;
}
export interface FinalResponseParams {
    response: AIMessage;
    currentWorkflow: WorkflowJSON | undefined;
    messages: BaseMessage[];
    warningTracker: WarningTracker;
}
export interface FinalResponseResult {
    success: boolean;
    workflow?: WorkflowJSON;
    sourceCode?: string;
    parseDuration?: number;
    isParseError?: boolean;
    shouldContinue?: boolean;
}
export declare class FinalResponseHandler {
    private parseAndValidate;
    constructor(config: FinalResponseHandlerConfig);
    process(params: FinalResponseParams): Promise<FinalResponseResult>;
    private parseStructuredOutput;
}
export {};
