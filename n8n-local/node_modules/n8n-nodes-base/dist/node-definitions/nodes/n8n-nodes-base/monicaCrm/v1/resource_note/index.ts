/**
 * Monica CRM - Note Resource
 * Re-exports all operation types for this resource.
 */

import type { MonicaCrmV1NoteCreateNode } from './operation_create';
import type { MonicaCrmV1NoteDeleteNode } from './operation_delete';
import type { MonicaCrmV1NoteGetNode } from './operation_get';
import type { MonicaCrmV1NoteGetAllNode } from './operation_get_all';
import type { MonicaCrmV1NoteUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MonicaCrmV1NoteNode =
  | MonicaCrmV1NoteCreateNode
  | MonicaCrmV1NoteDeleteNode
  | MonicaCrmV1NoteGetNode
  | MonicaCrmV1NoteGetAllNode
  | MonicaCrmV1NoteUpdateNode
  ;