import type { INode, NodeConnectionType } from 'n8n-workflow';
export interface ConnectionResult {
    sourceNode: string;
    targetNode: string;
    connectionType: string;
    swapped: boolean;
    message: string;
}
export interface ConnectionValidationResult {
    valid: boolean;
    error?: string;
    shouldSwap?: boolean;
    swappedSource?: INode;
    swappedTarget?: INode;
}
export interface ConnectionOperationResult {
    success: boolean;
    sourceNode: string;
    targetNode: string;
    connectionType: string;
    swapped: boolean;
    message: string;
    error?: string;
}
export interface InferConnectionTypeResult {
    connectionType?: NodeConnectionType;
    possibleTypes?: NodeConnectionType[];
    requiresSwap?: boolean;
    error?: string;
}
