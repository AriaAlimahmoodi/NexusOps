/**
 * Wekan - CardComment Resource
 * Re-exports all operation types for this resource.
 */

import type { WekanV1CardCommentCreateNode } from './operation_create';
import type { WekanV1CardCommentDeleteNode } from './operation_delete';
import type { WekanV1CardCommentGetNode } from './operation_get';
import type { WekanV1CardCommentGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type WekanV1CardCommentNode =
  | WekanV1CardCommentCreateNode
  | WekanV1CardCommentDeleteNode
  | WekanV1CardCommentGetNode
  | WekanV1CardCommentGetAllNode
  ;