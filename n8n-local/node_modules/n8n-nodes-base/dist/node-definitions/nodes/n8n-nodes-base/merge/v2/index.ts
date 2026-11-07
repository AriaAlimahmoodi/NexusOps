/**
 * Merge Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { MergeV2AppendNode } from './mode_append';
import type { MergeV2ChooseBranchNode } from './mode_choose_branch';
import type { MergeV2CombineNode } from './mode_combine';

export * from './mode_append';
export * from './mode_choose_branch';
export * from './mode_combine';

export type MergeV2Node =
  | MergeV2AppendNode
  | MergeV2ChooseBranchNode
  | MergeV2CombineNode
  ;