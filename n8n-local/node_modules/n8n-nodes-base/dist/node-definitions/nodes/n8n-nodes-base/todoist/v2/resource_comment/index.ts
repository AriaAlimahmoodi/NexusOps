/**
 * Todoist - Comment Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV2CommentCreateNode } from './operation_create';
import type { TodoistV2CommentDeleteNode } from './operation_delete';
import type { TodoistV2CommentGetNode } from './operation_get';
import type { TodoistV2CommentGetAllNode } from './operation_get_all';
import type { TodoistV2CommentUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type TodoistV2CommentNode =
  | TodoistV2CommentCreateNode
  | TodoistV2CommentDeleteNode
  | TodoistV2CommentGetNode
  | TodoistV2CommentGetAllNode
  | TodoistV2CommentUpdateNode
  ;