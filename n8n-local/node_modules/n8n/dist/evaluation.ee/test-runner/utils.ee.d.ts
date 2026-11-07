import type { NodeParameterValueType, IRunData } from 'n8n-workflow';
type TokenUsageValues = {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
};
type TokenUsageInfo = Record<`${string}__${number}` | 'total', TokenUsageValues>;
export declare function checkNodeParameterNotEmpty(value: NodeParameterValueType): boolean;
export declare function extractTokenUsage(executionRunData: IRunData): TokenUsageInfo;
export {};
