import type { NodeInstance } from '../types/base';
export declare function isSplitInBatchesBuilder(value: unknown): boolean;
export interface SplitInBatchesBuilderShape {
    sibNode: NodeInstance<'n8n-nodes-base.splitInBatches', string, unknown>;
    _doneNodes: Array<NodeInstance<string, string, unknown>>;
    _eachNodes: Array<NodeInstance<string, string, unknown>>;
    _doneBatches: Array<NodeInstance<string, string, unknown> | Array<NodeInstance<string, string, unknown>>>;
    _eachBatches: Array<NodeInstance<string, string, unknown> | Array<NodeInstance<string, string, unknown>>>;
    _hasLoop: boolean;
    _doneTarget?: unknown;
    _eachTarget?: unknown;
}
export declare function extractSplitInBatchesBuilder(value: unknown): SplitInBatchesBuilderShape;
export declare function isSwitchCaseComposite(value: unknown): boolean;
export declare function isIfElseComposite(value: unknown): boolean;
