import type { EvalLlmMockHandler } from 'n8n-core';
export interface LlmCompletionMockOptions {
    scenarioHints?: string;
    globalContext?: string;
    nodeHints?: Record<string, string>;
}
export declare function unwrapProviderEnvelope(text: string): string;
export declare function createLlmCompletionMockHandler(options?: LlmCompletionMockOptions): EvalLlmMockHandler;
