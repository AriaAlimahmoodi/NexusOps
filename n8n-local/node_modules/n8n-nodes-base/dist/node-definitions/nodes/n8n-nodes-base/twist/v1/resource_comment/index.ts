/**
 * Twist - Comment Resource
 * Re-exports all operation types for this resource.
 */

import type { TwistV1CommentCreateNode } from './operation_create';
import type { TwistV1CommentDeleteNode } from './operation_delete';
import type { TwistV1CommentGetNode } from './operation_get';
import type { TwistV1CommentGetAllNode } from './operation_get_all';
import type { TwistV1CommentUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type TwistV1CommentNode =
  | TwistV1CommentCreateNode
  | TwistV1CommentDeleteNode
  | TwistV1CommentGetNode
  | TwistV1CommentGetAllNode
  | TwistV1CommentUpdateNode
  ;