/**
 * TheHive 5 - Comment Resource
 * Re-exports all operation types for this resource.
 */

import type { TheHiveProjectV1CommentAddNode } from './operation_add';
import type { TheHiveProjectV1CommentDeleteCommentNode } from './operation_delete_comment';
import type { TheHiveProjectV1CommentSearchNode } from './operation_search';
import type { TheHiveProjectV1CommentUpdateNode } from './operation_update';

export * from './operation_add';
export * from './operation_delete_comment';
export * from './operation_search';
export * from './operation_update';

export type TheHiveProjectV1CommentNode =
  | TheHiveProjectV1CommentAddNode
  | TheHiveProjectV1CommentDeleteCommentNode
  | TheHiveProjectV1CommentSearchNode
  | TheHiveProjectV1CommentUpdateNode
  ;