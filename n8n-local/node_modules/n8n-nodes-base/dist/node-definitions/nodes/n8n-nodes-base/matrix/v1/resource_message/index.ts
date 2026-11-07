/**
 * Matrix - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { MatrixV1MessageCreateNode } from './operation_create';
import type { MatrixV1MessageGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_get_all';

export type MatrixV1MessageNode =
  | MatrixV1MessageCreateNode
  | MatrixV1MessageGetAllNode
  ;