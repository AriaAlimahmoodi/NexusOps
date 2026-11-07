/**
 * Todoist - Reminder Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV21ReminderCreateNode } from './operation_create';
import type { TodoistV21ReminderDeleteNode } from './operation_delete';
import type { TodoistV21ReminderGetAllNode } from './operation_get_all';
import type { TodoistV21ReminderUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';
export * from './operation_update';

export type TodoistV21ReminderNode =
  | TodoistV21ReminderCreateNode
  | TodoistV21ReminderDeleteNode
  | TodoistV21ReminderGetAllNode
  | TodoistV21ReminderUpdateNode
  ;