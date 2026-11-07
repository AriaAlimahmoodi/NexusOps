import type { Types } from 'n8n-core';
import type { INodeTypeBaseDescription, INodeTypeDescription, KnownNodesAndCredentials } from 'n8n-workflow';
export declare function hasSendAndWaitOperation(nodeType: INodeTypeDescription): boolean;
export declare function convertNodeToHitlTool<T extends object & {
    description: INodeTypeDescription | INodeTypeBaseDescription;
}>(item: T): T;
export declare function createHitlTools(types: Types, known: KnownNodesAndCredentials): void;
