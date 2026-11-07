import type { INodeTypeDescription, IParameterBuilderHint, NodeConnectionType } from 'n8n-workflow';
export interface ModeInfo {
    value: string;
    displayName: string;
    outputConnectionType?: NodeConnectionType;
    description?: string;
    builderHint?: IParameterBuilderHint;
}
export interface ModeDiscriminatorInfo {
    modes: ModeInfo[];
}
export declare function extractModeDiscriminator(nodeType: INodeTypeDescription, nodeVersion: number): ModeDiscriminatorInfo | null;
export interface OperationOnlyInfo {
    value: string;
    displayName: string;
    description?: string;
    builderHint?: IParameterBuilderHint;
}
export interface OperationOnlyDiscriminatorInfo {
    operations: OperationOnlyInfo[];
}
export declare function extractOperationOnlyDiscriminator(nodeType: INodeTypeDescription, nodeVersion: number): OperationOnlyDiscriminatorInfo | null;
