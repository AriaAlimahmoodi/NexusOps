import type { NodeConfigurationsMap, WorkflowMetadata } from '../../types';
export interface MermaidWorkflowInput {
    workflow: {
        name?: string;
        nodes: WorkflowMetadata['workflow']['nodes'];
        connections: WorkflowMetadata['workflow']['connections'];
    };
}
export interface MermaidOptions {
    includeNodeType?: boolean;
    includeNodeParameters?: boolean;
    includeNodeName?: boolean;
    includeNodeId?: boolean;
    collectNodeConfigurations?: boolean;
}
export interface MermaidResult {
    mermaid: string;
    nodeConfigurations: NodeConfigurationsMap;
}
export declare function mermaidStringify(input: WorkflowMetadata | MermaidWorkflowInput, options?: MermaidOptions): string;
export declare function processWorkflowExamples(workflows: WorkflowMetadata[], options?: Omit<MermaidOptions, 'collectNodeConfigurations'>): MermaidResult[];
