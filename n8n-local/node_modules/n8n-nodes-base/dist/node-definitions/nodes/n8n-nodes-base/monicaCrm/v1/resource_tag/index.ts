/**
 * Monica CRM - Tag Resource
 * Re-exports all operation types for this resource.
 */

import type { MonicaCrmV1TagCreateNode } from './operation_create';
import type { MonicaCrmV1TagDeleteNode } from './operation_delete';
import type { MonicaCrmV1TagGetNode } from './operation_get';
import type { MonicaCrmV1TagGetAllNode } from './operation_get_all';
import type { MonicaCrmV1TagUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MonicaCrmV1TagNode =
  | MonicaCrmV1TagCreateNode
  | MonicaCrmV1TagDeleteNode
  | MonicaCrmV1TagGetNode
  | MonicaCrmV1TagGetAllNode
  | MonicaCrmV1TagUpdateNode
  ;