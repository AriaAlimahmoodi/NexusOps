import type { INodeTypeDescription } from 'n8n-workflow';
import type { SimpleWorkflow } from '../../types';
export declare function createNodeTypeMap(nodeTypes: INodeTypeDescription[]): Map<string, INodeTypeDescription>;
export declare function getNodeTypeForNode(node: SimpleWorkflow['nodes'][number], nodeTypeMap: Map<string, INodeTypeDescription>, nodeTypesByName: Map<string, INodeTypeDescription>): INodeTypeDescription | undefined;
export declare function createNodeTypeMaps(nodeTypes: INodeTypeDescription[]): {
    nodeTypeMap: Map<string, INodeTypeDescription>;
    nodeTypesByName: Map<string, INodeTypeDescription>;
};
