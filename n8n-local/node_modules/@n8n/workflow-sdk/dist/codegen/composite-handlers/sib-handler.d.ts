import type { SplitInBatchesCompositeNode } from '../composite-tree';
import type { SemanticNode } from '../types';
import { type BuildContext } from './build-utils';
export type { BuildContext } from './build-utils';
export declare function buildSplitInBatchesComposite(node: SemanticNode, ctx: BuildContext): SplitInBatchesCompositeNode;
