/**
 * NocoDB - Row Resource
 * Re-exports all operation types for this resource.
 */

import type { NocoDbV1RowCreateNode } from './operation_create';
import type { NocoDbV1RowDeleteNode } from './operation_delete';
import type { NocoDbV1RowGetNode } from './operation_get';
import type { NocoDbV1RowGetAllNode } from './operation_get_all';
import type { NocoDbV1RowUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type NocoDbV1RowNode =
  | NocoDbV1RowCreateNode
  | NocoDbV1RowDeleteNode
  | NocoDbV1RowGetNode
  | NocoDbV1RowGetAllNode
  | NocoDbV1RowUpdateNode
  ;