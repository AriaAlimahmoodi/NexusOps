/**
 * Slack Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { SlackV2ChannelNode } from './resource_channel';
import type { SlackV2FileNode } from './resource_file';
import type { SlackV2MessageNode } from './resource_message';
import type { SlackV2ReactionNode } from './resource_reaction';
import type { SlackV2StarNode } from './resource_star';
import type { SlackV2UserNode } from './resource_user';
import type { SlackV2UserGroupNode } from './resource_user_group';

export * from './resource_channel';
export * from './resource_file';
export * from './resource_message';
export * from './resource_reaction';
export * from './resource_star';
export * from './resource_user';
export * from './resource_user_group';

export type SlackV2Node =
  | SlackV2ChannelNode
  | SlackV2FileNode
  | SlackV2MessageNode
  | SlackV2ReactionNode
  | SlackV2StarNode
  | SlackV2UserNode
  | SlackV2UserGroupNode
  ;