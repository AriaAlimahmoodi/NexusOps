import type { INode, INodeParameters } from 'n8n-workflow';
export interface LegacyResult {
    typeVersion?: number;
    parameters: INodeParameters;
    notes?: string[];
}
export declare function legacyAggregate(node: INode): LegacyResult;
export declare function legacyRemoveDuplicates(node: INode): LegacyResult;
export declare function legacySplitOut(node: INode): LegacyResult;
export declare function legacySummarize(node: INode): LegacyResult;
