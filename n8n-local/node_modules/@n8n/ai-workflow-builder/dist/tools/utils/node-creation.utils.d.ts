import { type INode, type INodeTypeDescription, type NodeParameterValueType, type OnError } from 'n8n-workflow';
export interface NodeSettings {
    executeOnce?: boolean;
    onError?: OnError;
}
export declare function generateUniqueName(baseName: string, existingNodes: INode[]): string;
export declare function getLatestVersion(nodeType: INodeTypeDescription): number;
export declare function generateNodeId(): string;
export declare function createNodeInstance(nodeType: INodeTypeDescription, typeVersion: number, name: string, position: [number, number], parameters?: Record<string, NodeParameterValueType>, id?: string, nodeSettings?: NodeSettings): INode;
export declare function mergeWithDefaults(parameters: Record<string, NodeParameterValueType>, nodeType: INodeTypeDescription): Record<string, NodeParameterValueType>;
