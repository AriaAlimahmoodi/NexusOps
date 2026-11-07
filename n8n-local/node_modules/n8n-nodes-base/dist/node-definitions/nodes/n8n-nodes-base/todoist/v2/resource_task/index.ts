/**
 * Todoist - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV2TaskCloseNode } from './operation_close';
import type { TodoistV2TaskCreateNode } from './operation_create';
import type { TodoistV2TaskDeleteNode } from './operation_delete';
import type { TodoistV2TaskGetNode } from './operation_get';
import type { TodoistV2TaskGetAllNode } from './operation_get_all';
import type { TodoistV2TaskMoveNode } from './operation_move';
import type { TodoistV2TaskQuickAddNode } from './operation_quick_add';
import type { TodoistV2TaskReopenNode } from './operation_reopen';
import type { TodoistV2TaskUpdateNode } from './operation_update';

export * from './operation_close';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_move';
export * from './operation_quick_add';
export * from './operation_reopen';
export * from './operation_update';

export type TodoistV2TaskNode =
  | TodoistV2TaskCloseNode
  | TodoistV2TaskCreateNode
  | TodoistV2TaskDeleteNode
  | TodoistV2TaskGetNode
  | TodoistV2TaskGetAllNode
  | TodoistV2TaskMoveNode
  | TodoistV2TaskQuickAddNode
  | TodoistV2TaskReopenNode
  | TodoistV2TaskUpdateNode
  ;