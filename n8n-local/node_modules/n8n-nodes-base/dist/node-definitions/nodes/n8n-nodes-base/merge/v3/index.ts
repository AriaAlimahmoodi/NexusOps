/**
 * Merge Node - Version 3
 * Re-exports all discriminator combinations.
 */

import type { MergeV3AppendNode } from './mode_append';
import type { MergeV3ChooseBranchNode } from './mode_choose_branch';
import type { MergeV3CombineNode } from './mode_combine';
import type { MergeV3CombineBySqlNode } from './mode_combine_by_sql';

export * from './mode_append';
export * from './mode_choose_branch';
export * from './mode_combine';
export * from './mode_combine_by_sql';

export type MergeV3Node =
  | MergeV3AppendNode
  | MergeV3ChooseBranchNode
  | MergeV3CombineNode
  | MergeV3CombineBySqlNode
  ;