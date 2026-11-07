/**
 * Monica CRM - Conversation Resource
 * Re-exports all operation types for this resource.
 */

import type { MonicaCrmV1ConversationCreateNode } from './operation_create';
import type { MonicaCrmV1ConversationDeleteNode } from './operation_delete';
import type { MonicaCrmV1ConversationGetNode } from './operation_get';
import type { MonicaCrmV1ConversationUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_update';

export type MonicaCrmV1ConversationNode =
  | MonicaCrmV1ConversationCreateNode
  | MonicaCrmV1ConversationDeleteNode
  | MonicaCrmV1ConversationGetNode
  | MonicaCrmV1ConversationUpdateNode
  ;