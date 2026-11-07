import type { AIMessage } from '@langchain/core/messages';
export interface ToolCall {
    id: string;
    name: string;
    args: Record<string, unknown>;
}
export interface LlmResponseResult {
    inputTokens: number;
    outputTokens: number;
    thinkingContent: string | null;
    textContent: string | null;
    hasToolCalls: boolean;
    toolCalls: ToolCall[];
}
export declare function processLlmResponse(response: AIMessage): LlmResponseResult;
