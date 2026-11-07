/**
 * Taiga - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { TaigaV1TaskCreateNode } from './operation_create';
import type { TaigaV1TaskDeleteNode } from './operation_delete';
import type { TaigaV1TaskGetNode } from './operation_get';
import type { TaigaV1TaskGetAllNode } from './operation_get_all';
import type { TaigaV1TaskUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type TaigaV1TaskNode =
  | TaigaV1TaskCreateNode
  | TaigaV1TaskDeleteNode
  | TaigaV1TaskGetNode
  | TaigaV1TaskGetAllNode
  | TaigaV1TaskUpdateNode
  ;