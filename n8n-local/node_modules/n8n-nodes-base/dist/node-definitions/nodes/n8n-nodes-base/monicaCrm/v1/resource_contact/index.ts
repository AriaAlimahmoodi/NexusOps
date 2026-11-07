/**
 * Monica CRM - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { MonicaCrmV1ContactCreateNode } from './operation_create';
import type { MonicaCrmV1ContactDeleteNode } from './operation_delete';
import type { MonicaCrmV1ContactGetNode } from './operation_get';
import type { MonicaCrmV1ContactGetAllNode } from './operation_get_all';
import type { MonicaCrmV1ContactUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MonicaCrmV1ContactNode =
  | MonicaCrmV1ContactCreateNode
  | MonicaCrmV1ContactDeleteNode
  | MonicaCrmV1ContactGetNode
  | MonicaCrmV1ContactGetAllNode
  | MonicaCrmV1ContactUpdateNode
  ;