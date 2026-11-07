/**
 * Trello Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { TrelloV1AttachmentNode } from './resource_attachment';
import type { TrelloV1BoardNode } from './resource_board';
import type { TrelloV1BoardMemberNode } from './resource_board_member';
import type { TrelloV1CardNode } from './resource_card';
import type { TrelloV1CardCommentNode } from './resource_card_comment';
import type { TrelloV1ChecklistNode } from './resource_checklist';
import type { TrelloV1LabelNode } from './resource_label';
import type { TrelloV1ListNode } from './resource_list';

export * from './resource_attachment';
export * from './resource_board';
export * from './resource_board_member';
export * from './resource_card';
export * from './resource_card_comment';
export * from './resource_checklist';
export * from './resource_label';
export * from './resource_list';

export type TrelloV1Node =
  | TrelloV1AttachmentNode
  | TrelloV1BoardNode
  | TrelloV1BoardMemberNode
  | TrelloV1CardNode
  | TrelloV1CardCommentNode
  | TrelloV1ChecklistNode
  | TrelloV1LabelNode
  | TrelloV1ListNode
  ;