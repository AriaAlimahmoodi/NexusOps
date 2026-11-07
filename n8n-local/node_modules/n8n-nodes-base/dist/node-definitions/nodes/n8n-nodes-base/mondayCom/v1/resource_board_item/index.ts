/**
 * Monday.com - BoardItem Resource
 * Re-exports all operation types for this resource.
 */

import type { MondayComV1BoardItemAddUpdateNode } from './operation_add_update';
import type { MondayComV1BoardItemChangeColumnValueNode } from './operation_change_column_value';
import type { MondayComV1BoardItemChangeMultipleColumnValuesNode } from './operation_change_multiple_column_values';
import type { MondayComV1BoardItemCreateNode } from './operation_create';
import type { MondayComV1BoardItemDeleteNode } from './operation_delete';
import type { MondayComV1BoardItemGetNode } from './operation_get';
import type { MondayComV1BoardItemGetAllNode } from './operation_get_all';
import type { MondayComV1BoardItemGetByColumnValueNode } from './operation_get_by_column_value';
import type { MondayComV1BoardItemMoveNode } from './operation_move';

export * from './operation_add_update';
export * from './operation_change_column_value';
export * from './operation_change_multiple_column_values';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_by_column_value';
export * from './operation_move';

export type MondayComV1BoardItemNode =
  | MondayComV1BoardItemAddUpdateNode
  | MondayComV1BoardItemChangeColumnValueNode
  | MondayComV1BoardItemChangeMultipleColumnValuesNode
  | MondayComV1BoardItemCreateNode
  | MondayComV1BoardItemDeleteNode
  | MondayComV1BoardItemGetNode
  | MondayComV1BoardItemGetAllNode
  | MondayComV1BoardItemGetByColumnValueNode
  | MondayComV1BoardItemMoveNode
  ;