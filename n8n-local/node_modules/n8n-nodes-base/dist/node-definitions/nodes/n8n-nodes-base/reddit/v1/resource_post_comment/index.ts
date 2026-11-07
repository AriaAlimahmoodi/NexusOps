/**
 * Reddit - PostComment Resource
 * Re-exports all operation types for this resource.
 */

import type { RedditV1PostCommentCreateNode } from './operation_create';
import type { RedditV1PostCommentDeleteNode } from './operation_delete';
import type { RedditV1PostCommentGetAllNode } from './operation_get_all';
import type { RedditV1PostCommentReplyNode } from './operation_reply';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';
export * from './operation_reply';

export type RedditV1PostCommentNode =
  | RedditV1PostCommentCreateNode
  | RedditV1PostCommentDeleteNode
  | RedditV1PostCommentGetAllNode
  | RedditV1PostCommentReplyNode
  ;