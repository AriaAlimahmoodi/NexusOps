/**
 * Data table - Row Resource
 * Re-exports all operation types for this resource.
 */

import type { DataTableV11RowDeleteRowsNode } from './operation_delete_rows';
import type { DataTableV11RowGetNode } from './operation_get';
import type { DataTableV11RowInsertNode } from './operation_insert';
import type { DataTableV11RowRowExistsNode } from './operation_row_exists';
import type { DataTableV11RowRowNotExistsNode } from './operation_row_not_exists';
import type { DataTableV11RowUpdateNode } from './operation_update';
import type { DataTableV11RowUpsertNode } from './operation_upsert';

export * from './operation_delete_rows';
export * from './operation_get';
export * from './operation_insert';
export * from './operation_row_exists';
export * from './operation_row_not_exists';
export * from './operation_update';
export * from './operation_upsert';

export type DataTableV11RowNode =
  | DataTableV11RowDeleteRowsNode
  | DataTableV11RowGetNode
  | DataTableV11RowInsertNode
  | DataTableV11RowRowExistsNode
  | DataTableV11RowRowNotExistsNode
  | DataTableV11RowUpdateNode
  | DataTableV11RowUpsertNode
  ;