/**
 * Merge Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MergeV1AppendNode } from './mode_append';
import type { MergeV1KeepKeyMatchesNode } from './mode_keep_key_matches';
import type { MergeV1MergeByIndexNode } from './mode_merge_by_index';
import type { MergeV1MergeByKeyNode } from './mode_merge_by_key';
import type { MergeV1MultiplexNode } from './mode_multiplex';
import type { MergeV1PassThroughNode } from './mode_pass_through';
import type { MergeV1RemoveKeyMatchesNode } from './mode_remove_key_matches';
import type { MergeV1WaitNode } from './mode_wait';

export * from './mode_append';
export * from './mode_keep_key_matches';
export * from './mode_merge_by_index';
export * from './mode_merge_by_key';
export * from './mode_multiplex';
export * from './mode_pass_through';
export * from './mode_remove_key_matches';
export * from './mode_wait';

export type MergeV1Node =
  | MergeV1AppendNode
  | MergeV1KeepKeyMatchesNode
  | MergeV1MergeByIndexNode
  | MergeV1MergeByKeyNode
  | MergeV1MultiplexNode
  | MergeV1PassThroughNode
  | MergeV1RemoveKeyMatchesNode
  | MergeV1WaitNode
  ;