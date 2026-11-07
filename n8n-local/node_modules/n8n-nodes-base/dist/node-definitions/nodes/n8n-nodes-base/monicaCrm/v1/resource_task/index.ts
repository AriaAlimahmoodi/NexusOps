/**
 * Monica CRM - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { MonicaCrmV1TaskCreateNode } from './operation_create';
import type { MonicaCrmV1TaskDeleteNode } from './operation_delete';
import type { MonicaCrmV1TaskGetNode } from './operation_get';
import type { MonicaCrmV1TaskGetAllNode } from './operation_get_all';
import type { MonicaCrmV1TaskUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MonicaCrmV1TaskNode =
  | MonicaCrmV1TaskCreateNode
  | MonicaCrmV1TaskDeleteNode
  | MonicaCrmV1TaskGetNode
  | MonicaCrmV1TaskGetAllNode
  | MonicaCrmV1TaskUpdateNode
  ;