import type { CompositeNode } from '../composite-tree';
import type { SemanticNode } from '../types';
import { type BuildContext, hasErrorOutput as checkHasErrorOutput, getErrorOutputTargets as getErrorTargets } from './build-utils';
export declare const hasErrorOutput: typeof checkHasErrorOutput;
export declare const getErrorOutputTargets: typeof getErrorTargets;
export declare function buildErrorHandler(node: SemanticNode, ctx: BuildContext): CompositeNode | undefined;
