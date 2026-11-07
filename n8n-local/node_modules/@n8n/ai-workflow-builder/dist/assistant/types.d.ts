import type { StreamChunk } from '../types/streaming';
import type { SimpleWorkflow } from '../types/workflow';
export type { SimpleWorkflow };
export interface AssistantSdkClient {
    chat(payload: {
        payload: object;
        sessionId?: string;
    }, user: {
        id: string;
    }): Promise<Response>;
}
export type StreamWriter = (chunk: StreamChunk) => void | Promise<void>;
export interface AssistantContext {
    query: string;
    workflowJSON?: SimpleWorkflow;
    errorContext?: {
        nodeName: string;
        errorMessage: string;
        errorDescription?: string;
    };
    credentialContext?: {
        credentialType: string;
        displayName?: string;
    };
    sdkSessionId?: string;
    userName?: string;
}
export interface AssistantResult {
    responseText: string;
    summary: string;
    sdkSessionId?: string;
    hasCodeDiff: boolean;
    suggestionIds: string[];
}
export interface SdkTextMessage {
    role: 'assistant';
    type: 'message';
    text: string;
    codeSnippet?: string;
    quickReplies?: unknown[];
    step?: string;
}
export interface SdkCodeDiffMessage {
    role: 'assistant';
    type: 'code-diff';
    description: string;
    codeDiff: string;
    suggestionId?: string;
    quickReplies?: unknown[];
}
export interface SdkSummaryMessage {
    role: 'assistant';
    type: 'summary';
    title: string;
    content: string;
}
export interface SdkAgentSuggestionMessage {
    role: 'assistant';
    type: 'agent-suggestion';
    title: string;
    text: string;
    suggestionId?: string;
}
export interface SdkIntermediateStep {
    role: 'assistant';
    type: 'intermediate-step';
    text: string;
    step: string;
}
export interface SdkEndSessionEvent {
    type: 'event';
    eventName: 'end-session' | 'session-timeout';
}
export interface SdkErrorMessage {
    role: 'assistant';
    type: 'error';
    text: string;
}
export type SdkMessageResponse = SdkTextMessage | SdkCodeDiffMessage | SdkSummaryMessage | SdkAgentSuggestionMessage | SdkIntermediateStep | SdkEndSessionEvent | SdkErrorMessage;
export interface SdkStreamChunk {
    sessionId?: string;
    messages: SdkMessageResponse[];
}
