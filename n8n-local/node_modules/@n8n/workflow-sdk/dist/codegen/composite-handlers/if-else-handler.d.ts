import type { IfElseCompositeNode } from '../composite-tree';
import type { SemanticNode } from '../types';
import { type BuildContext } from './build-utils';
export type { BuildContext } from './build-utils';
export declare function buildIfElseComposite(node: SemanticNode, ctx: BuildContext): IfElseCompositeNode;
