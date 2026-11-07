import type { EvalMockHttpResponse } from 'n8n-core';
import type { IHttpRequestOptions } from 'n8n-workflow';
export interface NormalizedToolCall {
    id: string;
    name: string;
    arguments: string;
}
export declare function reverseTranslateOpenAiRequest(body: unknown): IHttpRequestOptions;
export declare function extractRequestModel(body: unknown): string;
export declare function isStreamRequested(body: unknown): boolean;
export declare function forwardTranslateToChatCompletion(mockResponse: EvalMockHttpResponse | undefined, model: string): Record<string, unknown>;
export declare function forwardTranslateToSseChunks(mockResponse: EvalMockHttpResponse | undefined, model: string): Array<Record<string, unknown>>;
export declare function buildOpenAiErrorEnvelope(message: string): Record<string, unknown>;
export declare function extractToolCalls(body: unknown): NormalizedToolCall[];
