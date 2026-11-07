/**
 * Discord - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { DiscordV2MessageDeleteMessageNode } from './operation_delete_message';
import type { DiscordV2MessageGetNode } from './operation_get';
import type { DiscordV2MessageGetAllNode } from './operation_get_all';
import type { DiscordV2MessageReactNode } from './operation_react';
import type { DiscordV2MessageSendNode } from './operation_send';
import type { DiscordV2MessageSendAndWaitNode } from './operation_send_and_wait';

export * from './operation_delete_message';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_react';
export * from './operation_send';
export * from './operation_send_and_wait';

export type DiscordV2MessageNode =
  | DiscordV2MessageDeleteMessageNode
  | DiscordV2MessageGetNode
  | DiscordV2MessageGetAllNode
  | DiscordV2MessageReactNode
  | DiscordV2MessageSendNode
  | DiscordV2MessageSendAndWaitNode
  ;