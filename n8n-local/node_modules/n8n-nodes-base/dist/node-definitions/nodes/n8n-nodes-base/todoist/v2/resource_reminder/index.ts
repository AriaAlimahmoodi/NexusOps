/**
 * Todoist - Reminder Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV2ReminderCreateNode } from './operation_create';
import type { TodoistV2ReminderDeleteNode } from './operation_delete';
import type { TodoistV2ReminderGetAllNode } from './operation_get_all';
import type { TodoistV2ReminderUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';
export * from './operation_update';

export type TodoistV2ReminderNode =
  | TodoistV2ReminderCreateNode
  | TodoistV2ReminderDeleteNode
  | TodoistV2ReminderGetAllNode
  | TodoistV2ReminderUpdateNode
  ;