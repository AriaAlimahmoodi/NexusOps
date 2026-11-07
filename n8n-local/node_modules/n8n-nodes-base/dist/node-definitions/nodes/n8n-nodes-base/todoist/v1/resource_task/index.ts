/**
 * Todoist - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV1TaskCloseNode } from './operation_close';
import type { TodoistV1TaskCreateNode } from './operation_create';
import type { TodoistV1TaskDeleteNode } from './operation_delete';
import type { TodoistV1TaskGetNode } from './operation_get';
import type { TodoistV1TaskGetAllNode } from './operation_get_all';
import type { TodoistV1TaskMoveNode } from './operation_move';
import type { TodoistV1TaskReopenNode } from './operation_reopen';
import type { TodoistV1TaskUpdateNode } from './operation_update';

export * from './operation_close';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_move';
export * from './operation_reopen';
export * from './operation_update';

export type TodoistV1TaskNode =
  | TodoistV1TaskCloseNode
  | TodoistV1TaskCreateNode
  | TodoistV1TaskDeleteNode
  | TodoistV1TaskGetNode
  | TodoistV1TaskGetAllNode
  | TodoistV1TaskMoveNode
  | TodoistV1TaskReopenNode
  | TodoistV1TaskUpdateNode
  ;