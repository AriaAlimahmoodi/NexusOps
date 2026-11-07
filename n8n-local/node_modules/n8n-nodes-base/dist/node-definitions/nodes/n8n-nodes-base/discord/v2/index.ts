/**
 * Discord Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { DiscordV2ChannelNode } from './resource_channel';
import type { DiscordV2MessageNode } from './resource_message';
import type { DiscordV2MemberNode } from './resource_member';

export * from './resource_channel';
export * from './resource_message';
export * from './resource_member';

export type DiscordV2Node =
  | DiscordV2ChannelNode
  | DiscordV2MessageNode
  | DiscordV2MemberNode
  ;