/**
 * Keap - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { KeapV1ContactDeleteNode } from './operation_delete';
import type { KeapV1ContactGetNode } from './operation_get';
import type { KeapV1ContactGetAllNode } from './operation_get_all';
import type { KeapV1ContactUpsertNode } from './operation_upsert';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_upsert';

export type KeapV1ContactNode =
  | KeapV1ContactDeleteNode
  | KeapV1ContactGetNode
  | KeapV1ContactGetAllNode
  | KeapV1ContactUpsertNode
  ;