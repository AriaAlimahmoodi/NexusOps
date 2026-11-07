/**
 * Monica CRM - ConversationMessage Resource
 * Re-exports all operation types for this resource.
 */

import type { MonicaCrmV1ConversationMessageAddNode } from './operation_add';
import type { MonicaCrmV1ConversationMessageUpdateNode } from './operation_update';

export * from './operation_add';
export * from './operation_update';

export type MonicaCrmV1ConversationMessageNode =
  | MonicaCrmV1ConversationMessageAddNode
  | MonicaCrmV1ConversationMessageUpdateNode
  ;