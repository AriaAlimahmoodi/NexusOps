/**
 * Merge Node - Version 2.1
 * Re-exports all discriminator combinations.
 */

import type { MergeV21AppendNode } from './mode_append';
import type { MergeV21ChooseBranchNode } from './mode_choose_branch';
import type { MergeV21CombineNode } from './mode_combine';

export * from './mode_append';
export * from './mode_choose_branch';
export * from './mode_combine';

export type MergeV21Node =
  | MergeV21AppendNode
  | MergeV21ChooseBranchNode
  | MergeV21CombineNode
  ;