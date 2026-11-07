/**
 * n8n - Execution Resource
 * Re-exports all operation types for this resource.
 */

import type { N8nV1ExecutionDeleteNode } from './operation_delete';
import type { N8nV1ExecutionGetNode } from './operation_get';
import type { N8nV1ExecutionGetAllNode } from './operation_get_all';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type N8nV1ExecutionNode =
  | N8nV1ExecutionDeleteNode
  | N8nV1ExecutionGetNode
  | N8nV1ExecutionGetAllNode
  ;