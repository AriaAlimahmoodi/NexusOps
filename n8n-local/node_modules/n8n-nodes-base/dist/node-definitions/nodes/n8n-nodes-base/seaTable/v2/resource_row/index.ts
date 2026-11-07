/**
 * SeaTable - Row Resource
 * Re-exports all operation types for this resource.
 */

import type { SeaTableV2RowCreateNode } from './operation_create';
import type { SeaTableV2RowGetNode } from './operation_get';
import type { SeaTableV2RowListNode } from './operation_list';
import type { SeaTableV2RowLockNode } from './operation_lock';
import type { SeaTableV2RowRemoveNode } from './operation_remove';
import type { SeaTableV2RowSearchNode } from './operation_search';
import type { SeaTableV2RowUnlockNode } from './operation_unlock';
import type { SeaTableV2RowUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_list';
export * from './operation_lock';
export * from './operation_remove';
export * from './operation_search';
export * from './operation_unlock';
export * from './operation_update';

export type SeaTableV2RowNode =
  | SeaTableV2RowCreateNode
  | SeaTableV2RowGetNode
  | SeaTableV2RowListNode
  | SeaTableV2RowLockNode
  | SeaTableV2RowRemoveNode
  | SeaTableV2RowSearchNode
  | SeaTableV2RowUnlockNode
  | SeaTableV2RowUpdateNode
  ;