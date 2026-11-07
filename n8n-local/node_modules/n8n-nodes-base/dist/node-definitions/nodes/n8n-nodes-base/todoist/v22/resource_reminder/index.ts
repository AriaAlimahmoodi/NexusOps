/**
 * Todoist - Reminder Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV22ReminderCreateNode } from './operation_create';
import type { TodoistV22ReminderDeleteNode } from './operation_delete';
import type { TodoistV22ReminderGetAllNode } from './operation_get_all';
import type { TodoistV22ReminderUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';
export * from './operation_update';

export type TodoistV22ReminderNode =
  | TodoistV22ReminderCreateNode
  | TodoistV22ReminderDeleteNode
  | TodoistV22ReminderGetAllNode
  | TodoistV22ReminderUpdateNode
  ;