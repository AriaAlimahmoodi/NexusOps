/**
 * Monica CRM - JournalEntry Resource
 * Re-exports all operation types for this resource.
 */

import type { MonicaCrmV1JournalEntryCreateNode } from './operation_create';
import type { MonicaCrmV1JournalEntryDeleteNode } from './operation_delete';
import type { MonicaCrmV1JournalEntryGetNode } from './operation_get';
import type { MonicaCrmV1JournalEntryGetAllNode } from './operation_get_all';
import type { MonicaCrmV1JournalEntryUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MonicaCrmV1JournalEntryNode =
  | MonicaCrmV1JournalEntryCreateNode
  | MonicaCrmV1JournalEntryDeleteNode
  | MonicaCrmV1JournalEntryGetNode
  | MonicaCrmV1JournalEntryGetAllNode
  | MonicaCrmV1JournalEntryUpdateNode
  ;