import type { INode, INodeTypeDescription } from 'n8n-workflow';
export declare const POSITIONING_CONFIG: {
    readonly HORIZONTAL_GAP: 280;
    readonly MAIN_NODE_Y: 300;
    readonly SUB_NODE_Y: 450;
    readonly VERTICAL_SPACING: 120;
    readonly INITIAL_X: 250;
    readonly X_PROXIMITY_THRESHOLD: 50;
    readonly SUB_NODE_HORIZONTAL_OFFSET: 0.8;
};
export declare function calculateNodePosition(existingNodes: INode[], isSubNodeType: boolean, nodeTypes: INodeTypeDescription[]): [number, number];
export declare function categorizeNodes(nodes: INode[], nodeTypes: INodeTypeDescription[]): {
    mainNodes: INode[];
    subNodes: INode[];
};
export declare function getNodesAtPosition(nodes: INode[], position: [number, number], tolerance?: number): INode[];
export declare function calculateConnectedNodePosition(sourceNode: INode, isTargetSubNode: boolean, existingNodes: INode[], _nodeTypes: INodeTypeDescription[]): [number, number];
