import type { BaseMessage } from '@langchain/core/messages';
import { AIMessage } from '@langchain/core/messages';
export type AIMessageWithUsageMetadata = AIMessage & {
    response_metadata: {
        usage: {
            input_tokens: number;
            output_tokens: number;
            cache_read_input_tokens?: number;
            cache_creation_input_tokens?: number;
        };
    };
};
export interface TokenUsage {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
}
export declare function extractLastTokenUsage(messages: unknown[]): TokenUsage | undefined;
export declare function estimateTokenCountFromString(text: string): number;
export declare function estimateTokenCountFromMessages(messages: BaseMessage[]): number;
