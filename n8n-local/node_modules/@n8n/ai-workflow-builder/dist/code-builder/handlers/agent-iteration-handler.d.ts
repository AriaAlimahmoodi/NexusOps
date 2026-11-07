import type { Callbacks } from '@langchain/core/callbacks/manager';
import type { BaseChatModelCallOptions } from '@langchain/core/language_models/chat_models';
import type { BaseMessage, AIMessage } from '@langchain/core/messages';
import type { Runnable } from '@langchain/core/runnables';
import type { StreamOutput } from '../../types/streaming';
import type { TokenUsage } from '../types';
export interface AgentIterationHandlerConfig {
    onTokenUsage?: (usage: TokenUsage) => void;
    callbacks?: Callbacks;
    runMetadata?: Record<string, unknown>;
}
export interface IterationParams {
    llmWithTools: Runnable<BaseMessage[], AIMessage, BaseChatModelCallOptions>;
    messages: BaseMessage[];
    abortSignal?: AbortSignal;
    iteration: number;
    callbacks?: Callbacks;
}
export interface LlmInvocationResult {
    response: AIMessage;
    inputTokens: number;
    outputTokens: number;
    llmDurationMs: number;
    textContent: string | null;
    thinkingContent: string | null;
    hasToolCalls: boolean;
}
export declare class AgentIterationHandler {
    private onTokenUsage?;
    private callbacks?;
    private runMetadata?;
    constructor(config?: AgentIterationHandlerConfig);
    getCallbacks(): Callbacks | undefined;
    getRunMetadata(): Record<string, unknown> | undefined;
    invokeLlm(params: IterationParams): AsyncGenerator<StreamOutput, LlmInvocationResult, unknown>;
}
