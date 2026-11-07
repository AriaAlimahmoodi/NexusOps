/**
 * Trello - BoardMember Resource
 * Re-exports all operation types for this resource.
 */

import type { TrelloV1BoardMemberAddNode } from './operation_add';
import type { TrelloV1BoardMemberGetAllNode } from './operation_get_all';
import type { TrelloV1BoardMemberInviteNode } from './operation_invite';
import type { TrelloV1BoardMemberRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_get_all';
export * from './operation_invite';
export * from './operation_remove';

export type TrelloV1BoardMemberNode =
  | TrelloV1BoardMemberAddNode
  | TrelloV1BoardMemberGetAllNode
  | TrelloV1BoardMemberInviteNode
  | TrelloV1BoardMemberRemoveNode
  ;