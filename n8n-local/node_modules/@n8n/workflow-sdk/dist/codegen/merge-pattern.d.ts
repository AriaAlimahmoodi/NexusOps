import type { BuildContext } from './composite-handlers/build-utils';
import type { SemanticNode } from './types';
export declare function hasOutputsOutsideMerge(node: SemanticNode, mergeNode: SemanticNode): boolean;
export declare function findDirectMergeInFanOut(targetNames: string[], ctx: BuildContext): {
    mergeNode: SemanticNode;
    nonMergeTargets: string[];
} | null;
export declare function detectMergePattern(targetNames: string[], ctx: BuildContext): {
    mergeNode: SemanticNode;
    branches: string[];
} | null;
export declare function findMergeInputIndex(mergeNode: SemanticNode, sourceName: string, sourceOutputSlot?: string): number;
