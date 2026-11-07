import type { IConnections, INode, INodeType, INodeTypes } from 'n8n-workflow';
export type WorkflowTriggerVersion = {
    nodes: INode[];
    connections: IConnections;
};
export declare function isTriggerLikeNodeType(nodeType: INodeType): boolean;
export declare function getEnabledTriggerNodes(version: WorkflowTriggerVersion | null, nodeTypes: INodeTypes): INode[];
