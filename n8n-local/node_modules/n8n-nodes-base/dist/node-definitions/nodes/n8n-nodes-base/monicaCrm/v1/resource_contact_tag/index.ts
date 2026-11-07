/**
 * Monica CRM - ContactTag Resource
 * Re-exports all operation types for this resource.
 */

import type { MonicaCrmV1ContactTagAddNode } from './operation_add';
import type { MonicaCrmV1ContactTagRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_remove';

export type MonicaCrmV1ContactTagNode =
  | MonicaCrmV1ContactTagAddNode
  | MonicaCrmV1ContactTagRemoveNode
  ;