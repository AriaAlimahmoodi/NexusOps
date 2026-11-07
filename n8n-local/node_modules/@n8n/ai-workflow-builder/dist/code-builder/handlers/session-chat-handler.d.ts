import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { MemorySaver } from '@langchain/langgraph';
import type { Logger } from '@n8n/backend-common';
import type { StreamOutput } from '../../types/streaming';
import type { ChatPayload } from '../../workflow-builder-agent';
import type { HistoryContext } from '../prompts';
type AgentChatFn = (payload: ChatPayload, userId: string, abortSignal?: AbortSignal, historyContext?: HistoryContext) => AsyncGenerator<StreamOutput, void, unknown>;
export interface SessionChatHandlerConfig {
    checkpointer: MemorySaver;
    llm: BaseChatModel;
    logger?: Logger;
    onGenerationSuccess?: () => Promise<void>;
}
export interface SessionChatParams {
    payload: ChatPayload;
    userId: string;
    abortSignal?: AbortSignal;
    agentChat: AgentChatFn;
}
export declare class SessionChatHandler {
    private checkpointer;
    private llm;
    private logger?;
    private onGenerationSuccess?;
    constructor(config: SessionChatHandlerConfig);
    private buildHistoryContext;
    private processChunk;
    execute(params: SessionChatParams): AsyncGenerator<StreamOutput, void, unknown>;
}
export {};
