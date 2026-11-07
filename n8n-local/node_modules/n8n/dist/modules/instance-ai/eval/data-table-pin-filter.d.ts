import type { INode, INodeExecutionData } from 'n8n-workflow';
export interface PinnedReadFilterResult {
    items: INodeExecutionData[];
    warnings: string[];
    flags: string[];
}
export declare function applyDataTableReadParameters(node: INode, items: INodeExecutionData[]): PinnedReadFilterResult;
