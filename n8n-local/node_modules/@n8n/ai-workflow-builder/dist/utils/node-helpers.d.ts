import { type INode, type INodeTypeDescription } from 'n8n-workflow';
export declare function isTriggerNodeType(nodeType: string): boolean;
export declare function isSubNode(nodeType: INodeTypeDescription, node?: INode): boolean;
