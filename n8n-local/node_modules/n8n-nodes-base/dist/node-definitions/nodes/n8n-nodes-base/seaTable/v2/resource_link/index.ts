/**
 * SeaTable - Link Resource
 * Re-exports all operation types for this resource.
 */

import type { SeaTableV2LinkAddNode } from './operation_add';
import type { SeaTableV2LinkListNode } from './operation_list';
import type { SeaTableV2LinkRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_list';
export * from './operation_remove';

export type SeaTableV2LinkNode =
  | SeaTableV2LinkAddNode
  | SeaTableV2LinkListNode
  | SeaTableV2LinkRemoveNode
  ;