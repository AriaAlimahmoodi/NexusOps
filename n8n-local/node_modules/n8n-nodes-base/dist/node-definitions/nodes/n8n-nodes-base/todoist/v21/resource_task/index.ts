/**
 * Todoist - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV21TaskCloseNode } from './operation_close';
import type { TodoistV21TaskCreateNode } from './operation_create';
import type { TodoistV21TaskDeleteNode } from './operation_delete';
import type { TodoistV21TaskGetNode } from './operation_get';
import type { TodoistV21TaskGetAllNode } from './operation_get_all';
import type { TodoistV21TaskMoveNode } from './operation_move';
import type { TodoistV21TaskQuickAddNode } from './operation_quick_add';
import type { TodoistV21TaskReopenNode } from './operation_reopen';
import type { TodoistV21TaskUpdateNode } from './operation_update';

export * from './operation_close';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_move';
export * from './operation_quick_add';
export * from './operation_reopen';
export * from './operation_update';

export type TodoistV21TaskNode =
  | TodoistV21TaskCloseNode
  | TodoistV21TaskCreateNode
  | TodoistV21TaskDeleteNode
  | TodoistV21TaskGetNode
  | TodoistV21TaskGetAllNode
  | TodoistV21TaskMoveNode
  | TodoistV21TaskQuickAddNode
  | TodoistV21TaskReopenNode
  | TodoistV21TaskUpdateNode
  ;