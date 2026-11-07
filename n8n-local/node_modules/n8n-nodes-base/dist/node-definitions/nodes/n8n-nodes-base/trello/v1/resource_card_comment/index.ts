/**
 * Trello - CardComment Resource
 * Re-exports all operation types for this resource.
 */

import type { TrelloV1CardCommentCreateNode } from './operation_create';
import type { TrelloV1CardCommentDeleteNode } from './operation_delete';
import type { TrelloV1CardCommentUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_update';

export type TrelloV1CardCommentNode =
  | TrelloV1CardCommentCreateNode
  | TrelloV1CardCommentDeleteNode
  | TrelloV1CardCommentUpdateNode
  ;