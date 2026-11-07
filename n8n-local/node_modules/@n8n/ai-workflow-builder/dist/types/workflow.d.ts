import type { IWorkflowBase, INode, IConnections } from 'n8n-workflow';
export type SimpleWorkflow = Pick<IWorkflowBase, 'name' | 'nodes' | 'connections'>;
export type WorkflowOperation = {
    type: 'clear';
} | {
    type: 'removeNode';
    nodeIds: string[];
} | {
    type: 'addNodes';
    nodes: INode[];
} | {
    type: 'updateNode';
    nodeId: string;
    updates: Partial<INode>;
} | {
    type: 'setConnections';
    connections: IConnections;
} | {
    type: 'mergeConnections';
    connections: IConnections;
} | {
    type: 'removeConnection';
    sourceNode: string;
    targetNode: string;
    connectionType: string;
    sourceOutputIndex: number;
    targetInputIndex: number;
} | {
    type: 'setName';
    name: string;
} | {
    type: 'renameNode';
    nodeId: string;
    oldName: string;
    newName: string;
};
