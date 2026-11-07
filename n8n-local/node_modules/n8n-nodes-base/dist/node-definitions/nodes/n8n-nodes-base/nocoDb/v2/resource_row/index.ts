/**
 * NocoDB - Row Resource
 * Re-exports all operation types for this resource.
 */

import type { NocoDbV2RowCreateNode } from './operation_create';
import type { NocoDbV2RowDeleteNode } from './operation_delete';
import type { NocoDbV2RowGetNode } from './operation_get';
import type { NocoDbV2RowGetAllNode } from './operation_get_all';
import type { NocoDbV2RowUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type NocoDbV2RowNode =
  | NocoDbV2RowCreateNode
  | NocoDbV2RowDeleteNode
  | NocoDbV2RowGetNode
  | NocoDbV2RowGetAllNode
  | NocoDbV2RowUpdateNode
  ;