/**
 * Copper - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { CopperV1TaskCreateNode } from './operation_create';
import type { CopperV1TaskDeleteNode } from './operation_delete';
import type { CopperV1TaskGetNode } from './operation_get';
import type { CopperV1TaskGetAllNode } from './operation_get_all';
import type { CopperV1TaskUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type CopperV1TaskNode =
  | CopperV1TaskCreateNode
  | CopperV1TaskDeleteNode
  | CopperV1TaskGetNode
  | CopperV1TaskGetAllNode
  | CopperV1TaskUpdateNode
  ;