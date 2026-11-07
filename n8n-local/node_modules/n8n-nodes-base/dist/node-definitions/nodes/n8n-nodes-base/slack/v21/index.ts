/**
 * Slack Node - Version 2.1
 * Re-exports all discriminator combinations.
 */

import type { SlackV21ChannelNode } from './resource_channel';
import type { SlackV21FileNode } from './resource_file';
import type { SlackV21MessageNode } from './resource_message';
import type { SlackV21ReactionNode } from './resource_reaction';
import type { SlackV21StarNode } from './resource_star';
import type { SlackV21UserNode } from './resource_user';
import type { SlackV21UserGroupNode } from './resource_user_group';

export * from './resource_channel';
export * from './resource_file';
export * from './resource_message';
export * from './resource_reaction';
export * from './resource_star';
export * from './resource_user';
export * from './resource_user_group';

export type SlackV21Node =
  | SlackV21ChannelNode
  | SlackV21FileNode
  | SlackV21MessageNode
  | SlackV21ReactionNode
  | SlackV21StarNode
  | SlackV21UserNode
  | SlackV21UserGroupNode
  ;