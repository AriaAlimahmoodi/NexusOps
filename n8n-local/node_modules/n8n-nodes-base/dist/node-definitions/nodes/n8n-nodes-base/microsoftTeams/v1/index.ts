/**
 * Microsoft Teams Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MicrosoftTeamsV1ChannelNode } from './resource_channel';
import type { MicrosoftTeamsV1ChannelMessageNode } from './resource_channel_message';
import type { MicrosoftTeamsV1ChatMessageNode } from './resource_chat_message';
import type { MicrosoftTeamsV1TaskNode } from './resource_task';

export * from './resource_channel';
export * from './resource_channel_message';
export * from './resource_chat_message';
export * from './resource_task';

export type MicrosoftTeamsV1Node =
  | MicrosoftTeamsV1ChannelNode
  | MicrosoftTeamsV1ChannelMessageNode
  | MicrosoftTeamsV1ChatMessageNode
  | MicrosoftTeamsV1TaskNode
  ;