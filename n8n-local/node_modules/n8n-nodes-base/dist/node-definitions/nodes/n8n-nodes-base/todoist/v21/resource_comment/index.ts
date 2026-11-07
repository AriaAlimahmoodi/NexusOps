/**
 * Todoist - Comment Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV21CommentCreateNode } from './operation_create';
import type { TodoistV21CommentDeleteNode } from './operation_delete';
import type { TodoistV21CommentGetNode } from './operation_get';
import type { TodoistV21CommentGetAllNode } from './operation_get_all';
import type { TodoistV21CommentUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type TodoistV21CommentNode =
  | TodoistV21CommentCreateNode
  | TodoistV21CommentDeleteNode
  | TodoistV21CommentGetNode
  | TodoistV21CommentGetAllNode
  | TodoistV21CommentUpdateNode
  ;