import type { IConnections, INode, IWorkflowGroup } from 'n8n-workflow';
export type TopLevelItemsWarning = {
    code: string;
    message: string;
};
type CanvasShape = {
    nodes: INode[];
    connections: IConnections;
    nodeGroups?: IWorkflowGroup[];
};
export declare function summarizeUngroupedNodeNames(workflow: CanvasShape): string[];
export declare function topLevelItemsWarning(workflow: CanvasShape): TopLevelItemsWarning | undefined;
export {};
