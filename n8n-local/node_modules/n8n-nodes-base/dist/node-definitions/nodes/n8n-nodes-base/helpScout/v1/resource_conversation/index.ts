/**
 * Help Scout - Conversation Resource
 * Re-exports all operation types for this resource.
 */

import type { HelpScoutV1ConversationCreateNode } from './operation_create';
import type { HelpScoutV1ConversationDeleteNode } from './operation_delete';
import type { HelpScoutV1ConversationGetNode } from './operation_get';
import type { HelpScoutV1ConversationGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type HelpScoutV1ConversationNode =
  | HelpScoutV1ConversationCreateNode
  | HelpScoutV1ConversationDeleteNode
  | HelpScoutV1ConversationGetNode
  | HelpScoutV1ConversationGetAllNode
  ;