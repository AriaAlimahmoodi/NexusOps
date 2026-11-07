/**
 * Monica CRM - Reminder Resource
 * Re-exports all operation types for this resource.
 */

import type { MonicaCrmV1ReminderCreateNode } from './operation_create';
import type { MonicaCrmV1ReminderDeleteNode } from './operation_delete';
import type { MonicaCrmV1ReminderGetNode } from './operation_get';
import type { MonicaCrmV1ReminderGetAllNode } from './operation_get_all';
import type { MonicaCrmV1ReminderUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MonicaCrmV1ReminderNode =
  | MonicaCrmV1ReminderCreateNode
  | MonicaCrmV1ReminderDeleteNode
  | MonicaCrmV1ReminderGetNode
  | MonicaCrmV1ReminderGetAllNode
  | MonicaCrmV1ReminderUpdateNode
  ;