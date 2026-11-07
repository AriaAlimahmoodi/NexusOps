/**
 * Slack Node - Version 2.3
 * Re-exports all discriminator combinations.
 */

import type { SlackV23ChannelNode } from './resource_channel';
import type { SlackV23FileNode } from './resource_file';
import type { SlackV23MessageNode } from './resource_message';
import type { SlackV23ReactionNode } from './resource_reaction';
import type { SlackV23StarNode } from './resource_star';
import type { SlackV23UserNode } from './resource_user';
import type { SlackV23UserGroupNode } from './resource_user_group';

export * from './resource_channel';
export * from './resource_file';
export * from './resource_message';
export * from './resource_reaction';
export * from './resource_star';
export * from './resource_user';
export * from './resource_user_group';

export type SlackV23Node =
  | SlackV23ChannelNode
  | SlackV23FileNode
  | SlackV23MessageNode
  | SlackV23ReactionNode
  | SlackV23StarNode
  | SlackV23UserNode
  | SlackV23UserGroupNode
  ;