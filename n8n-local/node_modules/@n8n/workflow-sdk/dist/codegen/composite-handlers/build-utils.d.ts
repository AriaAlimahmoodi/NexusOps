import type { CompositeNode, LeafNode, VariableReference, DeferredInputConnection, DeferredMergeDownstream } from '../composite-tree';
import type { SemanticGraph, SemanticNode } from '../types';
export { toVarName } from '../variable-names';
export type { DeferredInputConnection, DeferredMergeDownstream } from '../composite-tree';
export interface BuildContext {
    graph: SemanticGraph;
    visited: Set<string>;
    variables: Map<string, SemanticNode>;
    isBranchContext: boolean;
    deferredConnections: DeferredInputConnection[];
    deferredMergeDownstreams: DeferredMergeDownstream[];
    deferredMergeNodes: Set<string>;
}
export declare function createLeaf(node: SemanticNode, errorHandler?: CompositeNode): LeafNode;
export declare function createVarRef(nodeName: string): VariableReference;
export declare function shouldBeVariable(node: SemanticNode): boolean;
export declare function isMergeType(type: string): boolean;
export declare function isSwitchType(type: string): boolean;
export declare function extractInputIndex(slotName: string): number;
export declare function getOutputIndex(outputName: string): number;
export declare function getOutputSlotName(outputIndex: number, isSwitch?: boolean): string;
export declare function getAllFirstOutputTargets(node: SemanticNode): string[];
export declare function hasErrorOutput(node: SemanticNode): boolean;
export declare function getErrorOutputTargets(node: SemanticNode): string[];
