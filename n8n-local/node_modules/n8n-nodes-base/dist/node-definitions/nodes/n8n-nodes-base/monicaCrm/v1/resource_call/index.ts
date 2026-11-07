/**
 * Monica CRM - Call Resource
 * Re-exports all operation types for this resource.
 */

import type { MonicaCrmV1CallCreateNode } from './operation_create';
import type { MonicaCrmV1CallDeleteNode } from './operation_delete';
import type { MonicaCrmV1CallGetNode } from './operation_get';
import type { MonicaCrmV1CallGetAllNode } from './operation_get_all';
import type { MonicaCrmV1CallUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MonicaCrmV1CallNode =
  | MonicaCrmV1CallCreateNode
  | MonicaCrmV1CallDeleteNode
  | MonicaCrmV1CallGetNode
  | MonicaCrmV1CallGetAllNode
  | MonicaCrmV1CallUpdateNode
  ;