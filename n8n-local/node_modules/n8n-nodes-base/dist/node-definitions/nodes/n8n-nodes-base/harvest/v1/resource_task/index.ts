/**
 * Harvest - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { HarvestV1TaskCreateNode } from './operation_create';
import type { HarvestV1TaskDeleteNode } from './operation_delete';
import type { HarvestV1TaskGetNode } from './operation_get';
import type { HarvestV1TaskGetAllNode } from './operation_get_all';
import type { HarvestV1TaskUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type HarvestV1TaskNode =
  | HarvestV1TaskCreateNode
  | HarvestV1TaskDeleteNode
  | HarvestV1TaskGetNode
  | HarvestV1TaskGetAllNode
  | HarvestV1TaskUpdateNode
  ;