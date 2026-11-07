import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import type { LLMResult } from '@langchain/core/outputs';
export interface AccumulatedTokenUsage {
    inputTokens: number;
    outputTokens: number;
}
export declare class TokenUsageTrackingHandler extends BaseCallbackHandler {
    name: string;
    private totalInputTokens;
    private totalOutputTokens;
    handleLLMEnd(output: LLMResult): Promise<void>;
    getUsage(): AccumulatedTokenUsage;
    reset(): void;
}
