/**
 * Trello - Attachment Resource
 * Re-exports all operation types for this resource.
 */

import type { TrelloV1AttachmentCreateNode } from './operation_create';
import type { TrelloV1AttachmentDeleteNode } from './operation_delete';
import type { TrelloV1AttachmentGetNode } from './operation_get';
import type { TrelloV1AttachmentGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type TrelloV1AttachmentNode =
  | TrelloV1AttachmentCreateNode
  | TrelloV1AttachmentDeleteNode
  | TrelloV1AttachmentGetNode
  | TrelloV1AttachmentGetAllNode
  ;