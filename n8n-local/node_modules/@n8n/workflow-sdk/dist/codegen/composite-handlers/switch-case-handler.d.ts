import type { SwitchCaseCompositeNode } from '../composite-tree';
import type { SemanticNode } from '../types';
import { type BuildContext } from './build-utils';
export type { BuildContext } from './build-utils';
export declare function buildSwitchCaseComposite(node: SemanticNode, ctx: BuildContext): SwitchCaseCompositeNode;
