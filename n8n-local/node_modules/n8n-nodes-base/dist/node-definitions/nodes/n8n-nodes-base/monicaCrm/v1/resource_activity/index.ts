/**
 * Monica CRM - Activity Resource
 * Re-exports all operation types for this resource.
 */

import type { MonicaCrmV1ActivityCreateNode } from './operation_create';
import type { MonicaCrmV1ActivityDeleteNode } from './operation_delete';
import type { MonicaCrmV1ActivityGetNode } from './operation_get';
import type { MonicaCrmV1ActivityGetAllNode } from './operation_get_all';
import type { MonicaCrmV1ActivityUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MonicaCrmV1ActivityNode =
  | MonicaCrmV1ActivityCreateNode
  | MonicaCrmV1ActivityDeleteNode
  | MonicaCrmV1ActivityGetNode
  | MonicaCrmV1ActivityGetAllNode
  | MonicaCrmV1ActivityUpdateNode
  ;