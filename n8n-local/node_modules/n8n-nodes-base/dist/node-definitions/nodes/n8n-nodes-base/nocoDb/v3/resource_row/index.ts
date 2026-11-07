/**
 * NocoDB - Row Resource
 * Re-exports all operation types for this resource.
 */

import type { NocoDbV3RowCreateNode } from './operation_create';
import type { NocoDbV3RowDeleteNode } from './operation_delete';
import type { NocoDbV3RowGetNode } from './operation_get';
import type { NocoDbV3RowGetAllNode } from './operation_get_all';
import type { NocoDbV3RowUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type NocoDbV3RowNode =
  | NocoDbV3RowCreateNode
  | NocoDbV3RowDeleteNode
  | NocoDbV3RowGetNode
  | NocoDbV3RowGetAllNode
  | NocoDbV3RowUpdateNode
  ;