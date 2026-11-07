/**
 * Monica CRM - ContactField Resource
 * Re-exports all operation types for this resource.
 */

import type { MonicaCrmV1ContactFieldCreateNode } from './operation_create';
import type { MonicaCrmV1ContactFieldDeleteNode } from './operation_delete';
import type { MonicaCrmV1ContactFieldGetNode } from './operation_get';
import type { MonicaCrmV1ContactFieldUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_update';

export type MonicaCrmV1ContactFieldNode =
  | MonicaCrmV1ContactFieldCreateNode
  | MonicaCrmV1ContactFieldDeleteNode
  | MonicaCrmV1ContactFieldGetNode
  | MonicaCrmV1ContactFieldUpdateNode
  ;