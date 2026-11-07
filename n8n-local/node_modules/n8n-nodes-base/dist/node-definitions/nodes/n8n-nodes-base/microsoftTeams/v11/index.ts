/**
 * Microsoft Teams Node - Version 1.1
 * Re-exports all discriminator combinations.
 */

import type { MicrosoftTeamsV11ChannelNode } from './resource_channel';
import type { MicrosoftTeamsV11ChannelMessageNode } from './resource_channel_message';
import type { MicrosoftTeamsV11ChatMessageNode } from './resource_chat_message';
import type { MicrosoftTeamsV11TaskNode } from './resource_task';

export * from './resource_channel';
export * from './resource_channel_message';
export * from './resource_chat_message';
export * from './resource_task';

export type MicrosoftTeamsV11Node =
  | MicrosoftTeamsV11ChannelNode
  | MicrosoftTeamsV11ChannelMessageNode
  | MicrosoftTeamsV11ChatMessageNode
  | MicrosoftTeamsV11TaskNode
  ;