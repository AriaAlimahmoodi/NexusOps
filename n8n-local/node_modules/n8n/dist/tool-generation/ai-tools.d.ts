import type { Types } from 'n8n-core';
import type { INodeProperties, INodeTypeBaseDescription, INodeTypeDescription, KnownNodesAndCredentials } from 'n8n-workflow';
export declare function findLastCalloutIndex(properties: INodeProperties[]): number;
export declare function convertNodeToAiTool<T extends object & {
    description: INodeTypeDescription | INodeTypeBaseDescription;
}>(item: T): T;
export declare function createAiTools(types: Types, known: KnownNodesAndCredentials): void;
