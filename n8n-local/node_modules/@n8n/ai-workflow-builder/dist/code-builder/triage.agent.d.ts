import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Logger } from '@n8n/backend-common';
import type { AssistantHandler } from '../assistant/assistant-handler';
import type { StreamOutput } from '../types/streaming';
import type { ChatPayload } from '../workflow-builder-agent';
type TriageConversationEntry = {
    type: 'build-request';
    message: string;
} | {
    type: 'assistant-exchange';
    userQuery: string;
    assistantSummary: string;
} | {
    type: 'plan';
    userQuery: string;
    plan: string;
};
export interface TriageAgentConfig {
    llm: BaseChatModel;
    assistantHandler: AssistantHandler;
    buildWorkflow: (payload: ChatPayload, userId: string, abortSignal?: AbortSignal) => AsyncIterable<StreamOutput>;
    logger?: Logger;
}
export interface TriageAgentParams {
    payload: ChatPayload;
    userId: string;
    abortSignal?: AbortSignal;
    sdkSessionId?: string;
    conversationHistory?: TriageConversationEntry[];
}
export interface TriageAgentOutcome {
    sdkSessionId?: string;
    assistantSummary?: string;
    buildExecuted?: boolean;
}
export declare class TriageAgent {
    private readonly llm;
    private readonly assistantHandler;
    private readonly buildWorkflow;
    private readonly logger?;
    constructor(config: TriageAgentConfig);
    run(params: TriageAgentParams): AsyncGenerator<StreamOutput, TriageAgentOutcome>;
    private executeToolWithStreaming;
    private executeTool;
    private getOutcome;
    private wrapChunk;
}
export {};
