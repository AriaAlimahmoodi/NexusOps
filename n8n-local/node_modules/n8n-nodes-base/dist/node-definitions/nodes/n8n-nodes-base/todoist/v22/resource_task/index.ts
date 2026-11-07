/**
 * Todoist - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV22TaskCloseNode } from './operation_close';
import type { TodoistV22TaskCreateNode } from './operation_create';
import type { TodoistV22TaskDeleteNode } from './operation_delete';
import type { TodoistV22TaskGetNode } from './operation_get';
import type { TodoistV22TaskGetAllNode } from './operation_get_all';
import type { TodoistV22TaskMoveNode } from './operation_move';
import type { TodoistV22TaskQuickAddNode } from './operation_quick_add';
import type { TodoistV22TaskReopenNode } from './operation_reopen';
import type { TodoistV22TaskUpdateNode } from './operation_update';

export * from './operation_close';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_move';
export * from './operation_quick_add';
export * from './operation_reopen';
export * from './operation_update';

export type TodoistV22TaskNode =
  | TodoistV22TaskCloseNode
  | TodoistV22TaskCreateNode
  | TodoistV22TaskDeleteNode
  | TodoistV22TaskGetNode
  | TodoistV22TaskGetAllNode
  | TodoistV22TaskMoveNode
  | TodoistV22TaskQuickAddNode
  | TodoistV22TaskReopenNode
  | TodoistV22TaskUpdateNode
  ;