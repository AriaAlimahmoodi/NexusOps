import type { INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
export declare class UninspectableSubworkflowSourceError extends NodeOperationError {
    constructor(node: INode);
}
