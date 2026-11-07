import type { NodeInstance } from '../../../types/base';
import type { CompositeHandlerPlugin } from '../types';
type NodeBatch = NodeInstance<string, string, unknown> | Array<NodeInstance<string, string, unknown>>;
interface SplitInBatchesBuilderShape {
    sibNode: NodeInstance<string, string, unknown>;
    _doneNodes: Array<NodeInstance<string, string, unknown>>;
    _eachNodes: Array<NodeInstance<string, string, unknown>>;
    _doneTarget?: NodeInstance<string, string, unknown> | Array<NodeInstance<string, string, unknown>> | null;
    _eachTarget?: NodeInstance<string, string, unknown> | Array<NodeInstance<string, string, unknown>> | null;
    _doneBatches?: NodeBatch[];
    _eachBatches?: NodeBatch[];
    _hasLoop?: boolean;
}
export declare const splitInBatchesHandler: CompositeHandlerPlugin<SplitInBatchesBuilderShape>;
export {};
