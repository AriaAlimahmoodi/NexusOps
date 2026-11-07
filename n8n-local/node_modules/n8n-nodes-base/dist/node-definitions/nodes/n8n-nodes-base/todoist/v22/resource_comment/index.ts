/**
 * Todoist - Comment Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV22CommentCreateNode } from './operation_create';
import type { TodoistV22CommentDeleteNode } from './operation_delete';
import type { TodoistV22CommentGetNode } from './operation_get';
import type { TodoistV22CommentGetAllNode } from './operation_get_all';
import type { TodoistV22CommentUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type TodoistV22CommentNode =
  | TodoistV22CommentCreateNode
  | TodoistV22CommentDeleteNode
  | TodoistV22CommentGetNode
  | TodoistV22CommentGetAllNode
  | TodoistV22CommentUpdateNode
  ;