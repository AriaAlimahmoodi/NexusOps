/**
 * Google Chat - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleChatV1MessageCreateNode } from './operation_create';
import type { GoogleChatV1MessageDeleteNode } from './operation_delete';
import type { GoogleChatV1MessageGetNode } from './operation_get';
import type { GoogleChatV1MessageSendAndWaitNode } from './operation_send_and_wait';
import type { GoogleChatV1MessageUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_send_and_wait';
export * from './operation_update';

export type GoogleChatV1MessageNode =
  | GoogleChatV1MessageCreateNode
  | GoogleChatV1MessageDeleteNode
  | GoogleChatV1MessageGetNode
  | GoogleChatV1MessageSendAndWaitNode
  | GoogleChatV1MessageUpdateNode
  ;