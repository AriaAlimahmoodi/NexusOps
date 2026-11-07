import type { EvalLlmMockHandler, EvalMockHttpResponse } from 'n8n-core';
export { buildDateAnchors } from './date-anchors';
interface MockHandlerOptions {
    scenarioHints?: string;
    globalContext?: string;
    nodeHints?: Record<string, string>;
    pinnedOutputs?: string;
    maxRetries?: number;
    signal?: AbortSignal;
}
export declare function createLlmMockHandler(options?: MockHandlerOptions): EvalLlmMockHandler;
export declare function isMockErrorSentinel(response: EvalMockHttpResponse): boolean;
interface DateFilterConstraint {
    label: string;
    min?: number;
    max?: number;
}
export declare function extractDateFilterConstraints(body: unknown, qs?: Record<string, unknown>): DateFilterConstraint[];
export declare function findDateFilterViolations(body: unknown, constraints: DateFilterConstraint[]): string[];
export declare function substituteBinaryMimeParts(rfc822: string): string;
