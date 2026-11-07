/**
 * Linear - Comment Resource
 * Re-exports all operation types for this resource.
 */

import type { LinearV11CommentAddCommentNode } from './operation_add_comment';

export * from './operation_add_comment';

export type LinearV11CommentNode = LinearV11CommentAddCommentNode;