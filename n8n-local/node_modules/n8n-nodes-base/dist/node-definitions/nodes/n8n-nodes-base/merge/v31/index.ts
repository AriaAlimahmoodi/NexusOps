/**
 * Merge Node - Version 3.1
 * Re-exports all discriminator combinations.
 */

import type { MergeV31AppendNode } from './mode_append';
import type { MergeV31ChooseBranchNode } from './mode_choose_branch';
import type { MergeV31CombineNode } from './mode_combine';
import type { MergeV31CombineBySqlNode } from './mode_combine_by_sql';

export * from './mode_append';
export * from './mode_choose_branch';
export * from './mode_combine';
export * from './mode_combine_by_sql';

export type MergeV31Node =
  | MergeV31AppendNode
  | MergeV31ChooseBranchNode
  | MergeV31CombineNode
  | MergeV31CombineBySqlNode
  ;