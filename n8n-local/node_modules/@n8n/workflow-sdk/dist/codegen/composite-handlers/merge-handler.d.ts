import type { VariableReference } from '../composite-tree';
import type { SemanticNode } from '../types';
import { type BuildContext } from './build-utils';
export type { BuildContext } from './build-utils';
export declare function buildMergeComposite(node: SemanticNode, ctx: BuildContext): VariableReference;
