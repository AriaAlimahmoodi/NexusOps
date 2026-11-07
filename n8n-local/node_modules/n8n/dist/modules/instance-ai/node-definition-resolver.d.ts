export interface NodeTypeDefinitionResult {
    content: string;
    version?: string;
    error?: string;
}
export interface NodeDiscriminators {
    resources: Array<{
        name: string;
        operations: string[];
    }>;
}
export declare function listNodeDiscriminators(nodeId: string, nodeDefinitionDirs: string[]): NodeDiscriminators | null;
export declare function resolveNodeTypeDefinition(nodeId: string, nodeDefinitionDirs: string[], options?: {
    version?: string;
    resource?: string;
    operation?: string;
    mode?: string;
}): NodeTypeDefinitionResult;
