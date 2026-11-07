/**
 * Wekan Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { WekanV1BoardNode } from './resource_board';
import type { WekanV1CardNode } from './resource_card';
import type { WekanV1CardCommentNode } from './resource_card_comment';
import type { WekanV1ChecklistNode } from './resource_checklist';
import type { WekanV1ChecklistItemNode } from './resource_checklist_item';
import type { WekanV1ListNode } from './resource_list';

export * from './resource_board';
export * from './resource_card';
export * from './resource_card_comment';
export * from './resource_checklist';
export * from './resource_checklist_item';
export * from './resource_list';

export type WekanV1Node =
  | WekanV1BoardNode
  | WekanV1CardNode
  | WekanV1CardCommentNode
  | WekanV1ChecklistNode
  | WekanV1ChecklistItemNode
  | WekanV1ListNode
  ;