/**
 * Discord - Channel Resource
 * Re-exports all operation types for this resource.
 */

import type { DiscordV2ChannelCreateNode } from './operation_create';
import type { DiscordV2ChannelDeleteChannelNode } from './operation_delete_channel';
import type { DiscordV2ChannelGetNode } from './operation_get';
import type { DiscordV2ChannelGetAllNode } from './operation_get_all';
import type { DiscordV2ChannelUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete_channel';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type DiscordV2ChannelNode =
  | DiscordV2ChannelCreateNode
  | DiscordV2ChannelDeleteChannelNode
  | DiscordV2ChannelGetNode
  | DiscordV2ChannelGetAllNode
  | DiscordV2ChannelUpdateNode
  ;