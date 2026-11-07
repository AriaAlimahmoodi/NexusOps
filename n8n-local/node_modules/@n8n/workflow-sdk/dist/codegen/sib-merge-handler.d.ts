import type { BuildContext } from './composite-handlers/build-utils';
import type { ExplicitConnectionsNode } from './composite-tree';
import type { SemanticNode } from './types';
export interface SibMergePattern {
    sibNode: SemanticNode;
    mergeNode: SemanticNode;
    connections: Array<{
        sibOutput: string;
        sibOutputIndex: number;
        mergeInputSlot: string;
        mergeInputIndex: number;
    }>;
    mergeOutputs: Array<{
        target: string;
        inputSlot: string;
        inputIndex: number;
    }>;
}
export declare function detectSibMergePattern(sibNode: SemanticNode, ctx: BuildContext): SibMergePattern | null;
export declare function buildSibMergeExplicitConnections(pattern: SibMergePattern, ctx: BuildContext): ExplicitConnectionsNode;
