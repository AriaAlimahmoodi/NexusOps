import type { INode, INodeParameters } from 'n8n-workflow';
export declare function extractNodeParameters(node: INode): INodeParameters;
export declare function mergeParameters(existingParams: INodeParameters, newParams: INodeParameters): INodeParameters;
export declare function updateNodeWithParameters(node: INode, newParameters: INodeParameters): INode;
export declare function formatChangesForPrompt(changes: string[]): string;
export declare function fixExpressionPrefixes<T>(value: T): T;
