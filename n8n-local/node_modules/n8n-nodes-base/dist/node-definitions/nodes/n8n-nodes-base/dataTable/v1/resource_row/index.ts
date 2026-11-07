/**
 * Data table - Row Resource
 * Re-exports all operation types for this resource.
 */

import type { DataTableV1RowDeleteRowsNode } from './operation_delete_rows';
import type { DataTableV1RowGetNode } from './operation_get';
import type { DataTableV1RowInsertNode } from './operation_insert';
import type { DataTableV1RowRowExistsNode } from './operation_row_exists';
import type { DataTableV1RowRowNotExistsNode } from './operation_row_not_exists';
import type { DataTableV1RowUpdateNode } from './operation_update';
import type { DataTableV1RowUpsertNode } from './operation_upsert';

export * from './operation_delete_rows';
export * from './operation_get';
export * from './operation_insert';
export * from './operation_row_exists';
export * from './operation_row_not_exists';
export * from './operation_update';
export * from './operation_upsert';

export type DataTableV1RowNode =
  | DataTableV1RowDeleteRowsNode
  | DataTableV1RowGetNode
  | DataTableV1RowInsertNode
  | DataTableV1RowRowExistsNode
  | DataTableV1RowRowNotExistsNode
  | DataTableV1RowUpdateNode
  | DataTableV1RowUpsertNode
  ;