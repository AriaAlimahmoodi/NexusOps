/**
 * Linear - Comment Resource
 * Re-exports all operation types for this resource.
 */

import type { LinearV1CommentAddCommentNode } from './operation_add_comment';

export * from './operation_add_comment';

export type LinearV1CommentNode = LinearV1CommentAddCommentNode;