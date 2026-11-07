import { type INodeTypeDescription, type IParameterBuilderHint, type Logger } from 'n8n-workflow';
export interface OperationInfo {
    value: string;
    displayName: string;
    description?: string;
    builderHint?: IParameterBuilderHint;
}
export interface ResourceInfo {
    value: string;
    displayName: string;
    description?: string;
    builderHint?: IParameterBuilderHint;
    operations: OperationInfo[];
}
export interface ResourceOperationInfo {
    resources: ResourceInfo[];
}
export interface ExtractOptions {
    fields?: {
        description?: boolean;
        builderHint?: boolean;
    };
}
export declare function extractResourceOperations(nodeType: INodeTypeDescription, nodeVersion: number, logger?: Logger, options?: ExtractOptions): ResourceOperationInfo | null;
export declare function createResourceCacheKey(nodeName: string, version: number): string;
export declare function formatResourceOperationsForPrompt(info: ResourceOperationInfo): string;
