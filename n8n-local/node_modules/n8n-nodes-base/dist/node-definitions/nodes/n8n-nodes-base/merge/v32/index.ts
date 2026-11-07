/**
 * Merge Node - Version 3.2
 * Re-exports all discriminator combinations.
 */

import type { MergeV32AppendNode } from './mode_append';
import type { MergeV32ChooseBranchNode } from './mode_choose_branch';
import type { MergeV32CombineNode } from './mode_combine';
import type { MergeV32CombineBySqlNode } from './mode_combine_by_sql';

export * from './mode_append';
export * from './mode_choose_branch';
export * from './mode_combine';
export * from './mode_combine_by_sql';

export type MergeV32Node =
  | MergeV32AppendNode
  | MergeV32ChooseBranchNode
  | MergeV32CombineNode
  | MergeV32CombineBySqlNode
  ;