import type { INode, INodeTypeDescription, IConnections, NodeConnectionType } from 'n8n-workflow';
import type { ConnectionValidationResult, InferConnectionTypeResult } from '../../types/connections';
export declare function validateConnection(sourceNode: INode, targetNode: INode, connectionType: string, nodeTypes: INodeTypeDescription[]): ConnectionValidationResult;
export declare function createConnection(connections: IConnections, sourceNodeName: string, targetNodeName: string, connectionType: NodeConnectionType, sourceOutputIndex?: number, targetInputIndex?: number): IConnections;
export declare function removeConnection(connections: IConnections, sourceNodeName: string, targetNodeName: string, connectionType: string, sourceOutputIndex?: number, targetInputIndex?: number): IConnections;
export declare function getNodeConnections(connections: IConnections, nodeName: string, direction: 'source' | 'target'): Array<{
    node: string;
    type: string;
    sourceIndex?: number;
    targetIndex?: number;
}>;
export declare function formatConnectionMessage(sourceNode: string, targetNode: string, connectionType: string, swapped?: boolean): string;
export declare function inferConnectionType(sourceNode: INode, targetNode: INode, sourceNodeType: INodeTypeDescription, targetNodeType: INodeTypeDescription): InferConnectionTypeResult;
