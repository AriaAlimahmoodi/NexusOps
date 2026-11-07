import type { EvalMockHttpResponse } from 'n8n-core';
import type { IHttpRequestOptions } from 'n8n-workflow';
export declare function reverseTranslateOpenAiResponsesRequest(body: unknown): IHttpRequestOptions;
export declare function extractResponsesRequestModel(body: unknown): string;
export declare function isResponsesStreamRequested(body: unknown): boolean;
export declare function forwardTranslateToResponsesEnvelope(mockResponse: EvalMockHttpResponse | undefined, model: string): Record<string, unknown>;
export declare function forwardTranslateToResponsesSseEvents(mockResponse: EvalMockHttpResponse | undefined, model: string): Array<{
    event: string;
    data: Record<string, unknown>;
}>;
export declare function isOpenAiResponsesUrl(url: string): boolean;
export declare function normalizeOpenAiResponsesMockResponse(mockResponse: EvalMockHttpResponse, model: string): EvalMockHttpResponse;
export declare function buildResponsesErrorEnvelope(message: string): Record<string, unknown>;
