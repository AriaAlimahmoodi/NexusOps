import type { ExpressionString, INodeInputConfiguration, NodeConnectionType } from 'n8n-workflow';
import type { NodeResolvedConnectionTypesInfo } from '../types';
export declare function resolveConnections<T = INodeInputConfiguration>(connections: Array<NodeConnectionType | T> | ExpressionString, parameters: Record<string, unknown>, nodeVersion: number): Array<NodeConnectionType | T>;
export declare function resolveNodeOutputs(nodeInfo: NodeResolvedConnectionTypesInfo): Set<NodeConnectionType>;
export declare function resolveNodeInputs(nodeInfo: NodeResolvedConnectionTypesInfo): Array<{
    type: NodeConnectionType;
    required: boolean;
}>;
