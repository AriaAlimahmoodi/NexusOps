import { type DeferredInputConnection, type DeferredMergeDownstream } from './composite-handlers/build-utils';
import type { CompositeNode } from './composite-tree';
import type { SemanticNode } from './types';
export type { DeferredInputConnection, DeferredMergeDownstream, } from './composite-handlers/build-utils';
interface DeferredConnectionContext {
    deferredConnections: DeferredInputConnection[];
    deferredMergeDownstreams: DeferredMergeDownstream[];
    deferredMergeNodes: Set<string>;
}
export interface DeferredConnectionParams {
    targetNode: SemanticNode;
    targetInputIndex: number;
    sourceNodeName: string;
    sourceOutputIndex: number;
}
export declare function createDeferredConnection(params: DeferredConnectionParams, ctx: DeferredConnectionContext): void;
export declare function findMergeInputIndex(mergeNode: SemanticNode, sourceName: string, sourceOutputSlot?: string): number;
export declare function registerDeferredMerge(mergeNode: SemanticNode, ctx: DeferredConnectionContext): void;
export declare function isDeferredMerge(mergeName: string, ctx: DeferredConnectionContext): boolean;
export declare function addDeferredMergeDownstream(mergeNode: SemanticNode, downstreamChain: CompositeNode | null, ctx: DeferredConnectionContext): void;
