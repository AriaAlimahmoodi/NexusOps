import type { INodeTypeBaseDescription, INodeTypeDescription, KnownNodesAndCredentials } from 'n8n-workflow';
export declare function isFullDescription(obj: unknown): obj is INodeTypeDescription;
export declare function copyCredentialSupport(known: KnownNodesAndCredentials, originalNodeName: string, newNodeName: string): void;
export declare function setToolCodex(description: INodeTypeDescription | INodeTypeBaseDescription, toolSubcategory: string, preserveExisting?: boolean): void;
